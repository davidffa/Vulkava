"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnresolvedTrack_1 = __importDefault(require("../UnresolvedTrack"));
const Request_1 = __importDefault(require("../utils/Request"));
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
        return (0, Request_1.default)(`https://api.deezer.com/${endpoint}`);
    }
}
exports.default = Deezer;
