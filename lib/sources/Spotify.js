"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
const Request_1 = __importDefault(require("../utils/Request"));
class Spotify {
    vulkava;
    auth;
    market;
    token;
    renewDate;
    constructor(vulkava, clientId, clientSecret, market = 'US') {
        this.vulkava = vulkava;
        this.auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        this.market = market;
        this.token = null;
        this.renewDate = 0;
    }
    async getTrack(id) {
        const track = await this.makeRequest(`tracks/${id}`);
        return this.buildTrack(track);
    }
    async getAlbum(id) {
        const unresolvedTracks = [];
        let offset = 0;
        let next;
        let title;
        do {
            const res = await this.makeRequest(`albums/${id}/?limit=50&offset=${offset}`);
            title = res.name;
            next = res.tracks.next !== null;
            for (const it of res.tracks.items) {
                unresolvedTracks.push(this.buildTrack(it));
            }
            offset += 50;
        } while (next && unresolvedTracks.length < 400);
        return { title, tracks: unresolvedTracks };
    }
    async getPlaylist(id) {
        const unresolvedTracks = [];
        let offset = 0;
        let next;
        let title;
        do {
            const res = await this.makeRequest(`playlists/${id}/?limit=100&offset=${offset}`);
            title = res.name;
            next = res.tracks.next !== null;
            for (const it of res.tracks.items) {
                if (it.track === null)
                    continue;
                unresolvedTracks.push(this.buildTrack(it.track));
            }
            offset += 100;
        } while (next && unresolvedTracks.length < 400);
        return { title, tracks: unresolvedTracks };
    }
    async getArtistTopTracks(id) {
        const res = await this.makeRequest(`artists/${id}/top-tracks?market=${this.market}`);
        return {
            title: `${res.tracks[0].artists.find(a => a.id === id)?.name ?? ''} Top Tracks`,
            tracks: res.tracks.map(t => this.buildTrack(t))
        };
    }
    buildTrack({ name, artists, external_urls: { spotify }, external_ids, duration_ms }) {
        const artistNames = artists.map(({ name }) => name).join(', ');
        return new UnresolvedTrack_1.default(this.vulkava, name, artistNames, duration_ms, spotify, 'spotify', external_ids?.isrc);
    }
    async makeRequest(endpoint) {
        if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate)
            await this.renewToken();
        return (0, Request_1.default)(`https://api.spotify.com/v1/${endpoint}`, {
            headers: {
                Authorization: this.token,
            }
        });
    }
    async renewToken() {
        const res = await (0, Request_1.default)('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${this.auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        this.token = `${res.token_type} ${res.access_token}`;
        this.renewDate = Date.now() + res.expires_in * 1000 - 5000;
    }
}
exports.default = Spotify;
