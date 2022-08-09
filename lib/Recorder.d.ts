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
     * @param {Array<String>} [options.users] - An array of user ids to record audio, if not passed, all users will be recorded
     * @param {Number} [options.channels] - The number of channels to record (mono or stereo), default is 2
     * @param {String} [options.format=MP3] - The output file format (currently MP3 or PCM), default is MP3
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
