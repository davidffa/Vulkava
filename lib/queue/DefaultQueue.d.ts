import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';
import { AbstractQueue } from './AbstractQueue';
export declare class DefaultQueue extends AbstractQueue {
    tracks: Array<Track | UnresolvedTrack>;
    constructor();
    /**
     * Gets the queue size.
     */
    get size(): number;
    /**
     * Gets the queue duration in milliseconds.
     */
    get duration(): number;
    /**
     * Adds a track to the queue.
     * @param {Track | UnresolvedTrack} track - The track to add to the queue
     * @deprecated - Use `add()` instead
     */
    push(track: Track | UnresolvedTrack): void;
    /**
     * Adds a track to the queue.
     * @param {Track | UnresolvedTrack} track - The track to add to the queue
     */
    add(track: Track | UnresolvedTrack): void;
    /**
     * Polls the queue for the next track.
     * @returns {Track | UnresolvedTrack | null} The next track in the queue or null if the queue is empty.
     */
    poll(): Track | UnresolvedTrack | null;
    /**
     * Remove the next n tracks from the queue
     * @param {number} n - The number of tracks to skip
     */
    skipNTracks(n: number): void;
    /**
     * Shuffles the queue
     */
    shuffle(): void;
    /**
     * Clears the queue.
     */
    clear(): void;
}
