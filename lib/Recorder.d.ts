import { RecordOptions } from './@types';
import Player from './Player';
import { Vulkava } from './Vulkava';
export default class Recorder {
    private readonly vulkava;
    private readonly player;
    started: boolean;
    private options;
    constructor(vulkava: Vulkava, player: Player);
    /**
     * Assigns a Node to the player associated with this recorder
     * @private
     */
    private assignNode;
    /**
     * Starts recording audio in the voice channel
     * @param {Object} options - The record options
     * @param {String} options.id - The record id
     * @param {Number} [options.bitrate] - The bitrate value
     * @param {Boolean} [options.selfAudio] - Whether to record the bot's audio or not
     */
    start(options: RecordOptions): void;
    /**
     * Resumes the recording, with the same options provided in start
     */
    resume(): void;
    /**
     * Stops recording audio in the voice channel
     */
    stop(): void;
}
