import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';
import { AbstractQueue } from './AbstractQueue';

export class DefaultQueue extends AbstractQueue {
  protected tracks: Array<Track | UnresolvedTrack>;

  constructor() {
    super();
    this.tracks = [];
  }

  /**
   * Gets the queue size.
   */
  get size(): number {
    return this.tracks.length;
  }

  /**
   * Gets the queue duration in milliseconds.
   */
  get duration(): number {
    return this.tracks.reduce((acc, track) => acc + track.duration, 0);
  }

  /**
   * Adds a track to the queue.
   * @param {Track | UnresolvedTrack} track - The track to add to the queue
   * @deprecated - Use `add()` instead
   */
  public push(track: Track | UnresolvedTrack) {
    this.tracks.push(track);
  }

  /**
   * Adds a track to the queue.
   * @param {Track | UnresolvedTrack} track - The track to add to the queue
   */
  public add(track: Track | UnresolvedTrack) {
    this.tracks.push(track);
  }

  /**
   * Polls the queue for the next track.
   * @returns {Track | UnresolvedTrack | null} The next track in the queue or null if the queue is empty.
   */
  public poll(): Track | UnresolvedTrack | null {
    return this.tracks.shift() ?? null;
  }

  /**
   * Remove the next n tracks from the queue
   * @param {number} n - The number of tracks to skip
   */
  public skipNTracks(n: number) {
    this.tracks.splice(0, n - 1);
  }

  /**
   * Shuffles the queue
   */
  public shuffle() {
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
  public clear() {
    this.tracks = [];
  }
}