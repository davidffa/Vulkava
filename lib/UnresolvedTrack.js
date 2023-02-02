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
    constructor(vulkava, title, author, duration, uri, source, isrc) {
        this.vulkava = vulkava;
        this.title = title;
        this.author = author;
        this.duration = duration ?? 0;
        this.uri = uri ?? '';
        this.source = source ?? 'Unknown';
        if (isrc && vulkava.useISRC)
            this.isrc = isrc;
        this.requester = null;
    }
    get query() {
        return this.isrc ? `"${this.isrc}"` : `${this.author} - ${this.title}`;
    }
    async build() {
        let res = await this.vulkava.search(this.query, this.vulkava.unresolvedSearchSource);
        if (res.loadType !== 'SEARCH_RESULT' || !res.tracks.length) {
            if (!this.isrc)
                throw new Error(`Failed to resolve track ${this.uri}`);
            res = await this.vulkava.search(`${this.author} - ${this.title}`, this.vulkava.unresolvedSearchSource);
            if (res.loadType !== 'SEARCH_RESULT' || !res.tracks.length)
                throw new Error(`Failed to resolve track ${this.uri}`);
        }
        const track = res.tracks[0];
        track.setRequester(this.requester);
        track.metadata = {
            title: this.title,
            author: this.author,
            duration: this.duration,
            uri: this.uri,
            source: this.source,
            isrc: this.isrc,
        };
        return track;
    }
    setRequester(requester) {
        this.requester = requester;
    }
}
exports.default = UnresolvedTrack;
