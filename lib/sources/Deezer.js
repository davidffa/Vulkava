"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
const undici_1 = require("undici");
class Deezer {
    vulkava;
    constructor(vulkava) {
        this.vulkava = vulkava;
    }
    async getTrack(id) {
        const track = await this.makeRequest(`track/${id}`);
        return this.buildTrack(track);
    }
    async getAlbum(id) {
        const unresolvedTracks = [];
        const res = await this.makeRequest(`album/${id}`);
        for (const it of res.tracks.data) {
            unresolvedTracks.push(this.buildTrack(it));
        }
        return { title: res.title, tracks: unresolvedTracks };
    }
    async getPlaylist(id) {
        const unresolvedTracks = [];
        const res = await this.makeRequest(`playlist/${id}`);
        for (const it of res.tracks.data) {
            unresolvedTracks.push(this.buildTrack(it));
        }
        return { title: res.title, tracks: unresolvedTracks };
    }
    buildTrack({ title, artist: { name }, link, duration, isrc }) {
        return new UnresolvedTrack_1.default(this.vulkava, title, name, duration * 1000, link, 'deezer', isrc);
    }
    async makeRequest(endpoint) {
        return (0, undici_1.request)(`https://api.deezer.com/${endpoint}`).then(r => r.body.json());
    }
}
exports.default = Deezer;
