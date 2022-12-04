"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const undici_1 = require("undici");
const AbstractExternalSource_1 = require("./AbstractExternalSource");
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
class AppleMusic extends AbstractExternalSource_1.AbstractExternalSource {
    static APPLE_MUSIC_REGEX = /^(?:https?:\/\/|)?(?:music\.)?apple\.com\/(?<storefront>[a-z]{2})\/(?<type>album|playlist|artist|music-video)(?:\/[^/]+)?\/(?<id>[^/?]+)(?:\?i=(?<albumtrackid>\d+))?/;
    static RENEW_URL = 'https://music.apple.com';
    static SCRIPTS_REGEX = /<script type="module" .+ src="(?<endpoint>\/assets\/index\..+\.js)">/g;
    static TOKEN_REGEX = /const \w{2}="(?<token>ey[\w.-]+)"/;
    static USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36';
    token;
    renewDate;
    constructor(vulkava) {
        super(vulkava);
        this.token = null;
        this.renewDate = 0;
    }
    async loadItem(query) {
        const appleMusicMatch = query.match(AppleMusic.APPLE_MUSIC_REGEX);
        if (!appleMusicMatch || !appleMusicMatch.groups)
            return null;
        const storefront = appleMusicMatch.groups['storefront'];
        switch (appleMusicMatch.groups['type']) {
            case 'music-video':
                return this.getMusicVideo(appleMusicMatch.groups['id'], storefront);
            case 'album':
                if (appleMusicMatch[4]) {
                    return this.getTrack(appleMusicMatch.groups['albumtrackid'], storefront);
                }
                else {
                    return this.getList('ALBUM', appleMusicMatch.groups['id'], storefront);
                }
            case 'playlist':
                return this.getList('PLAYLIST', appleMusicMatch.groups['id'], storefront);
            case 'artist':
                return this.getArtistTopTracks(appleMusicMatch.groups['id'], storefront);
        }
        return null;
    }
    async getMusicVideo(id, storefront) {
        const res = await this.makeRequest(`music-videos/${id}`, storefront);
        if (res instanceof AppleMusicError) {
            return this.handleErrorResult(res);
        }
        return {
            loadType: 'TRACK_LOADED',
            playlistInfo: {},
            tracks: [this.buildTrack(res.data[0].attributes)],
        };
    }
    async getTrack(id, storefront) {
        const res = await this.makeRequest(`songs/${id}`, storefront);
        if (res instanceof AppleMusicError) {
            return this.handleErrorResult(res);
        }
        return {
            loadType: 'TRACK_LOADED',
            playlistInfo: {},
            tracks: [this.buildTrack(res.data[0].attributes)],
        };
    }
    async getList(type, id, storefront) {
        const unresolvedTracks = [];
        const res = await this.makeRequest(`${type === 'ALBUM' ? 'albums' : 'playlists'}/${id}`, storefront);
        if (res instanceof AppleMusicError) {
            return this.handleErrorResult(res);
        }
        const title = res.data[0].attributes.name;
        let next = res.data[0].relationships.tracks.next;
        for (const it of res.data[0].relationships.tracks.data) {
            unresolvedTracks.push(this.buildTrack(it.attributes));
        }
        while (next && unresolvedTracks.length < 400) {
            const nextRes = await this.makeRequest(next.split('/').slice(4).join('/'), storefront);
            if (nextRes instanceof AppleMusicError) {
                return this.handleErrorResult(nextRes);
            }
            next = nextRes.next;
            for (const it of nextRes.data) {
                unresolvedTracks.push(this.buildTrack(it.attributes));
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
    async getArtistTopTracks(id, storefront) {
        const artistRes = await this.makeRequest(`artists/${id}`, storefront);
        const unresolvedTracks = [];
        const res = await this.makeRequest(`artists/${id}/view/top-songs`, storefront);
        if (res instanceof AppleMusicError) {
            return this.handleErrorResult(res);
        }
        if (artistRes instanceof AppleMusicError) {
            return this.handleErrorResult(artistRes);
        }
        for (const it of res.data) {
            unresolvedTracks.push(this.buildTrack(it.attributes));
        }
        return {
            loadType: 'PLAYLIST_LOADED',
            playlistInfo: {
                name: `${artistRes.data[0].attributes.name}'s top tracks`,
                duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
                selectedTrack: 0
            },
            tracks: unresolvedTracks
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
    buildTrack({ name, artistName, url, durationInMillis, isrc }) {
        return new UnresolvedTrack_1.default(this.vulkava, name, artistName, durationInMillis, url, 'apple-music', isrc);
    }
    async makeRequest(endpoint, storefront) {
        if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate)
            await this.renewToken();
        const res = await (0, undici_1.request)(`https://api.music.apple.com/v1/catalog/${storefront}/${endpoint}`, {
            headers: {
                'User-Agent': AppleMusic.USER_AGENT,
                Authorization: `Bearer ${this.token}`,
                'Origin': 'https://apple.com'
            }
        });
        if (res.statusCode === 200) {
            return res.body.json();
        }
        else {
            return new AppleMusicError(await res.body.json());
        }
    }
    async renewToken() {
        const html = await (0, undici_1.request)(AppleMusic.RENEW_URL + '/us/browse', {
            headers: {
                'User-Agent': AppleMusic.USER_AGENT
            },
        }).then(r => r.body.text());
        const scriptsMatch = [...html.matchAll(AppleMusic.SCRIPTS_REGEX)];
        if (!scriptsMatch.length) {
            throw new Error('Could not get Apple Music token scripts!');
        }
        for (const scriptMatch of scriptsMatch) {
            const script = await (0, undici_1.request)(`${AppleMusic.RENEW_URL}${scriptMatch[1]}`, {
                headers: {
                    'User-Agent': AppleMusic.USER_AGENT
                }
            }).then(r => r.body.text());
            const tokenMatch = script.match(AppleMusic.TOKEN_REGEX);
            if (tokenMatch) {
                this.token = tokenMatch.groups?.['token'] ?? null;
                break;
            }
        }
        if (!this.token) {
            throw new Error('Could not get Apple Music token!');
        }
        // 2 months but just in case ;)
        this.renewDate = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString()).exp * 1000;
    }
}
exports.default = AppleMusic;
class AppleMusicError {
    title;
    detail;
    constructor(errorRes) {
        this.title = errorRes.errors[0].title;
        this.detail = errorRes.errors[0].detail;
    }
    toString() {
        return `AppleMusicError: ${this.detail ?? this.title}`;
    }
}
