"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultQueue = void 0;
const AbstractQueue_1 = require("./AbstractQueue");
class DefaultQueue extends AbstractQueue_1.AbstractQueue {
    tracks;
    constructor() {
        super();
        this.tracks = [];
    }
    /**
     * Gets the queue size.
     */
    get size() {
        return this.tracks.length;
    }
    /**
     * Gets the queue duration in milliseconds.
     */
    get duration() {
        return this.tracks.reduce((acc, track) => acc + track.duration, 0);
    }
    /**
     * Adds a track to the queue.
     * @param {Track | UnresolvedTrack} track - The track to add to the queue
     * @deprecated - Use `add()` instead
     */
    push(track) {
        this.tracks.push(track);
    }
    /**
     * Adds a track to the queue.
     * @param {Track | UnresolvedTrack} track - The track to add to the queue
     */
    add(track) {
        this.tracks.push(track);
    }
    /**
     * Polls the queue for the next track.
     * @returns {Track | UnresolvedTrack | null} The next track in the queue or null if the queue is empty.
     */
    poll() {
        return this.tracks.shift() ?? null;
    }
    /**
     * Remove the next n tracks from the queue
     * @param {number} n - The number of tracks to skip
     */
    skipNTracks(n) {
        this.tracks.splice(0, n - 1);
    }
    /**
     * Shuffles the queue
     */
    shuffle() {
        if (this.tracks.length) {
            let j;
            for (let i = this.tracks.length - 1; i; i--) {
                j = Math.floor(Math.random() * (i + 1));
                [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
            }
        }
    }
    /**
     * Clears the queue.
     */
    clear() {
        this.tracks = [];
    }
}
exports.DefaultQueue = DefaultQueue;
