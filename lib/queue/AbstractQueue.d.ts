import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';
export declare abstract class AbstractQueue {
    /**
     * Gets the queue duration
     * @abstract
     * @type {number}
     */
    abstract get duration(): number;
    /**
     * Gets the queue size
     * @abstract
     * @type {number}
     */
    abstract get size(): number;
    /**
     * Adds a track to the queue
     * @abstract
     * @param {Track | UnresolvedTrack} track - The track to add to the queue
     */
    abstract add(track: Track | UnresolvedTrack): Promise<void> | void;
    /**
     * Polls the queue for the next track.
     * @abstract
     * @return {Track | UnresolvedTrack | null} The next track in the queue or null if the queue is empty.
     */
    abstract poll(): Promise<Track | UnresolvedTrack | null> | Track | UnresolvedTrack | null;
    /**
     * Remove the next n tracks from the queue
     * @abstract
     * @param {number} n - The number of tracks to skip
     */
    abstract skipNTracks(n: number): Promise<void> | void;
    /**
     * Clears the queue.
     * @abstract
     */
    abstract clear(): Promise<void> | void;
}
