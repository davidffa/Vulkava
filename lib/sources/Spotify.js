"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const undici_1 = require("undici");
const AbstractExternalSource_1 = require("./AbstractExternalSource");
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
class Spotify extends AbstractExternalSource_1.AbstractExternalSource {
    static SPOTIFY_REGEX = /^(?:https?:\/\/(?:open\.)?spotify\.com|spotify)[/:](?<type>track|album|playlist|artist)[/:](?<id>[a-zA-Z0-9]+)/;
    auth;
    market;
    token;
    renewDate;
    constructor(vulkava, clientId, clientSecret, market = 'US') {
        super(vulkava);
        if (clientId && clientSecret) {
            this.auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        }
        else {
            this.auth = null;
        }
        this.market = market;
        this.token = null;
        this.renewDate = 0;
    }
    async loadItem(query) {
        const spotifyMatch = query.match(Spotify.SPOTIFY_REGEX);
        if (!spotifyMatch || !spotifyMatch.groups)
            return null;
        switch (spotifyMatch.groups['type']) {
            case 'track':
                return this.getTrack(spotifyMatch.groups['id']);
            case 'album':
                return this.getAlbum(spotifyMatch.groups['id']);
            case 'playlist':
                return this.getPlaylist(spotifyMatch.groups['id']);
            case 'artist':
                return this.getArtistTopTracks(spotifyMatch.groups['id']);
        }
        return null;
    }
    async getTrack(id) {
        const res = await this.makeRequest(`tracks/${id}`);
        if (res instanceof SpotifyError) {
            return this.handleErrorResult(res);
        }
        return {
            loadType: 'TRACK_LOADED',
            playlistInfo: {},
            tracks: [this.buildTrack(res)],
        };
    }
    async getAlbum(id) {
        const unresolvedTracks = [];
        let res = await this.makeRequest(`albums/${id}`);
        if (res instanceof SpotifyError) {
            return this.handleErrorResult(res);
        }
        const title = res.name;
        for (const it of res.tracks.items) {
            if (it === null)
                continue;
            unresolvedTracks.push(this.buildTrack(it));
        }
        let next = res.tracks.next !== null;
        while (next && unresolvedTracks.length < 400) {
            res = await this.makeRequest(`albums/${id}/tracks?offset=${unresolvedTracks.length}&limit=50`);
            if (res instanceof SpotifyError) {
                return this.handleErrorResult(res);
            }
            next = res.next !== null;
            for (const it of res.items) {
                unresolvedTracks.push(this.buildTrack(it));
            }
        }
        return {
            loadType: 'PLAYLIST_LOADED',
            playlistInfo: {
                name: title,
                duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
                selectedTrack: 0
            },
            tracks: unresolvedTracks,
        };
    }
    async getPlaylist(id) {
        const unresolvedTracks = [];
        let res = await this.makeRequest(`playlists/${id}`);
        if (res instanceof SpotifyError) {
            return this.handleErrorResult(res);
        }
        const title = res.name;
        for (const it of res.tracks.items) {
            if (it.track === null)
                continue;
            unresolvedTracks.push(this.buildTrack(it.track));
        }
        let next = res.tracks.next !== null;
        while (next && unresolvedTracks.length < 400) {
            res = await this.makeRequest(`playlists/${id}/tracks?offset=${unresolvedTracks.length}`);
            if (res instanceof SpotifyError) {
                return this.handleErrorResult(res);
            }
            next = res.next !== null;
            for (const it of res.items) {
                if (it.track === null)
                    continue;
                unresolvedTracks.push(this.buildTrack(it.track));
            }
        }
        return {
            loadType: 'PLAYLIST_LOADED',
            playlistInfo: {
                name: title,
                duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
                selectedTrack: 0
            },
            tracks: unresolvedTracks,
        };
    }
    async getArtistTopTracks(id) {
        const res = await this.makeRequest(`artists/${id}/top-tracks?market=${this.market}`);
        if (res instanceof SpotifyError) {
            return this.handleErrorResult(res);
        }
        const tracks = res.tracks.map(t => this.buildTrack(t));
        return {
            loadType: 'PLAYLIST_LOADED',
            playlistInfo: {
                name: `${res.tracks[0].artists.find(a => a.id === id)?.name ?? ''} Top Tracks`,
                duration: tracks.reduce((acc, curr) => acc + curr.duration, 0),
                selectedTrack: 0
            },
            tracks: tracks
        };
    }
    handleErrorResult(error) {
        return {
            loadType: 'LOAD_FAILED',
            playlistInfo: {},
            tracks: [],
            exception: {
                message: error.toString(),
                severity: 'SUSPIOUS'
            }
        };
    }
    buildTrack({ name, artists, external_urls: { spotify }, external_ids, duration_ms }) {
        const artistNames = artists.map(({ name }) => name).join(', ');
        return new UnresolvedTrack_1.default(this.vulkava, name, artistNames, duration_ms, spotify, 'spotify', external_ids?.isrc);
    }
    async makeRequest(endpoint) {
        if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate)
            await this.renewToken();
        const res = await (0, undici_1.request)(`https://api.spotify.com/v1/${endpoint}`, {
            headers: {
                Authorization: this.token,
            }
        }).then(r => r.body.json());
        if (res.error) {
            return new SpotifyError(res.error.message);
        }
        return res;
    }
    async renewToken() {
        if (this.auth) {
            await this.getToken();
        }
        else {
            await this.getAnonymousToken();
        }
    }
    async getAnonymousToken() {
        const { accessToken, accessTokenExpirationTimestampMs } = await (0, undici_1.request)('https://open.spotify.com/get_access_token?reason=transport&productType=embed', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36'
            }
        }).then(r => r.body.json());
        if (!accessToken)
            throw new Error('Failed to get anonymous token on Spotify.');
        this.token = `Bearer ${accessToken}`;
        this.renewDate = accessTokenExpirationTimestampMs - 5000;
    }
    async getToken() {
        const { token_type, access_token, expires_in } = await (0, undici_1.request)('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${this.auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(r => r.body.json());
        this.token = `${token_type} ${access_token}`;
        this.renewDate = Date.now() + expires_in * 1000 - 5000;
    }
}
exports.default = Spotify;
class SpotifyError {
    message;
    constructor(error) {
        this.message = error;
    }
    toString() {
        return `SpotifyError: ${this.message}`;
    }
}
