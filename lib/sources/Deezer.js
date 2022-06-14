"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const undici_1 = require("undici");
const AbstractExternalSource_1 = require("./AbstractExternalSource");
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
class Deezer extends AbstractExternalSource_1.AbstractExternalSource {
    static DEEZER_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist)\/(?<id>\d+)/;
    constructor(vulkava) {
        super(vulkava);
    }
    async loadItem(query) {
        const deezerMatch = query.match(Deezer.DEEZER_REGEX);
        if (!deezerMatch || !deezerMatch.groups)
            return null;
        switch (deezerMatch.groups['type']) {
            case 'track':
                return this.getTrack(deezerMatch.groups['id']);
            case 'album':
                return this.getList('ALBUM', deezerMatch.groups['id']);
            case 'playlist':
                return this.getList('PLAYLIST', deezerMatch.groups['id']);
        }
        return null;
    }
    async getTrack(id) {
        const res = await this.makeRequest(`track/${id}`);
        if (res instanceof DeezerError) {
            return this.handleErrorResult(res);
        }
        return {
            loadType: 'TRACK_LOADED',
            playlistInfo: {},
            tracks: [this.buildTrack(res)],
        };
    }
    async getList(type, id) {
        const unresolvedTracks = [];
        const res = await this.makeRequest(`${type === 'ALBUM' ? 'album' : 'playlist'}/${id}`);
        if (res instanceof DeezerError) {
            return this.handleErrorResult(res);
        }
        for (const it of res.tracks.data) {
            unresolvedTracks.push(this.buildTrack(it));
        }
        return {
            loadType: 'PLAYLIST_LOADED',
            playlistInfo: {
                name: res.title,
                duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
                selectedTrack: 0
            },
            tracks: unresolvedTracks,
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
    buildTrack({ title, artist: { name }, link, duration, isrc }) {
        return new UnresolvedTrack_1.default(this.vulkava, title, name, duration * 1000, link, 'deezer', isrc);
    }
    async makeRequest(endpoint) {
        const res = await (0, undici_1.request)(`https://api.deezer.com/${endpoint}`).then(r => r.body.json());
        if (res.error) {
            return new DeezerError(res.error.type, res.error.message);
        }
        return res;
    }
}
exports.default = Deezer;
class DeezerError {
    type;
    message;
    constructor(type, message) {
        this.type = type;
        this.message = message;
    }
    toString() {
        return `DeezerError: ${this.type}: ${this.message}`;
    }
}
