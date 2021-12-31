"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnresolvedTrack {
    vulkava;
    title;
    author;
    duration;
    uri;
    source;
    requester;
    constructor(vulkava, title, author, duration, uri, source) {
        this.vulkava = vulkava;
        this.title = title;
        this.author = author;
        this.duration = duration ?? 0;
        this.uri = uri ?? '';
        this.source = source ?? 'Unknown';
        this.requester = null;
    }
    async build() {
        const res = await this.vulkava.search(`${this.author} - ${this.title}`, this.vulkava.unresolvedSearchSource);
        if (res.loadType !== 'SEARCH_RESULT') {
            throw new Error(`Failed to resolve track ${this.uri}`);
        }
        const track = res.tracks[0];
        track.setRequester(this.requester);
        return track;
    }
    setRequester(requester) {
        this.requester = requester;
    }
}
exports.default = UnresolvedTrack;
