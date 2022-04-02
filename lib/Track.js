"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Track {
    identifier;
    isSeekable;
    author;
    duration;
    isStream;
    source;
    position;
    title;
    uri;
    encodedTrack;
    constructor(data) {
        this.identifier = data.info.identifier;
        if (data.info.thumbnail)
            this.thumbnailUrl = data.info.thumbnail;
        this.isSeekable = data.info.isSeekable;
        this.author = data.info.author;
        this.duration = data.info.length;
        this.isStream = data.info.isStream;
        this.source = data.info.sourceName ?? 'unknown';
        this.position = data.info.position;
        this.title = data.info.title;
        this.uri = data.info.uri;
        this.encodedTrack = data.track;
    }
    get thumbnail() {
        if (this.thumbnailUrl)
            return this.thumbnailUrl;
        if (this.source === 'youtube') {
            return `https://img.youtube.com/vi/${this.identifier}/sddefault.jpg`;
        }
        return null;
    }
    setRequester(requester) {
        this.requester = requester;
    }
}
exports.default = Track;
