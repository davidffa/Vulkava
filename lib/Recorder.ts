import { RecordOptions } from './@types';
import Player from './Player';
import { Vulkava } from './Vulkava';

export default class Recorder {
  private readonly vulkava: Vulkava;
  private readonly player: Player;
  public started = false;
  private options: RecordOptions;

  constructor(vulkava: Vulkava, player: Player) {
    this.vulkava = vulkava;
    this.player = player;
  }

  /**
   * Assigns a Node to the player associated with this recorder
   * @private
   */
  private assignNode() {
    const node = this.vulkava.bestNode;
    this.player.node = node;
  }

  /**
   * Starts recording audio in the voice channel
   * @param {Object} options - The record options
   * @param {String} options.id - The record id
   * @param {Number} [options.bitrate] - The bitrate value
   * @param {Boolean} [options.selfAudio] - Whether to record the bot's audio or not
   * @param {Array<String>} [options.users] - An array of user ids to record audio, if not passed, all users will be recorded
   * @param {Number} [options.channels] - The number of channels to record (mono or stereo), default is 2
   * @param {Boolean} [options.encodeToMp3] - Whether to encode the output to mp3 or not
   */
  public start(options: RecordOptions) {
    if (this.started) throw new Error('Already recording!');
    if (!options.id || typeof options.id !== 'string' || options.id === '') throw new TypeError('Recorder: id must be a non-empty string');
    this.options = options;

    if (this.player.node === null) {
      this.assignNode();
    }

    this.started = true;
    this.player.node?.send({
      op: 'record',
      guildId: this.player.guildId,
      ...this.options
    });
  }

  /**
   * Resumes the recording, with the same options provided in start
   */
  public resume() {
    if (!this.options) throw new Error('Cannot resume without starting first!');
    if (this.started) throw new Error('Already recording!');

    this.started = true;
    this.player.node?.send({
      op: 'record',
      guildId: this.player.guildId,
      ...this.options
    });
  }

  /**
   * Stops recording audio in the voice channel
   */
  public stop() {
    if (!this.started) throw new Error('Not recording!');

    this.started = false;
    this.player.node?.send({
      op: 'record',
      guildId: this.player.guildId
    });
  }
}