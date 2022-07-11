import { Node, Vulkava, AbstractQueue } from '..';
import { PlayerOptions, PlayerState, PlayOptions, VoiceState } from './@types';
import Filters from './Filters';
import { NodeState } from './Node';
import { DefaultQueue } from './queue/DefaultQueue';
import Recorder from './Recorder';
import Track from './Track';
import UnresolvedTrack from './UnresolvedTrack';

export enum ConnectionState {
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

/**
 * Represents a Player structure
 * @prop {Node} node - The node that this player is connected to
 * @prop {Filters} filters - The filters instance of this player
 * @prop {String} guildId - The guild id of this player
 * @prop {String} voiceChannelId - The voice channel id of this player
 * @prop {String} [textChannelId] - The text channel id of this player
 * @prop {Boolean} [selfMute] - Whether or not this player is muted
 * @prop {Boolean} [selfDeaf] - Whether or not this player is deafened
 * @prop {Track | null} current - The current track of this player
 * @prop {Array<Track | UnresolvedTrack>} queue - The queue of this player
 * @prop {Boolean} trackRepeat - Whether to repeat the current track
 * @prop {Boolean} queueRepeat - Whether to repeat the queue
 * @prop {Boolean} playing - Whether this player is playing or not
 * @prop {Boolean} paused - Whether this player is paused or not
 * @prop {State} state - The state of this player (CONNECTING, CONNECTED, DISCONNECTED)
 * @prop {Object} voiceState - The player voicestate
 */
export default class Player {
  private readonly vulkava: Vulkava;
  public node: Node | null;

  public readonly guildId: string;

  public readonly filters: Filters;

  declare private connectTimeout?: NodeJS.Timeout;
  declare private recorderObj?: Recorder;

  public voiceChannelId: string;
  public textChannelId?: string | null;

  public selfDeaf?: boolean;
  public selfMute?: boolean;

  public current: Track | null;
  public queue: AbstractQueue;

  public queueRepeat: boolean;
  public trackRepeat: boolean;

  public position: number;
  private positionTimestamp: number;

  public playing: boolean;
  public paused: boolean;

  public state: ConnectionState;
  public voiceState: VoiceState;

  public moving: boolean;

  static checkOptions(options: PlayerOptions) {
    if (!options.guildId) throw new TypeError('You must provide a guildId.');
    if (typeof options.guildId !== 'string') throw new TypeError('guildId must be a string.');
    if (!options.voiceChannelId) throw new TypeError('You must provide a voiceChannelId.');
    if (typeof options.voiceChannelId !== 'string') throw new TypeError('voiceChannelId must be a string.');
    if (options.textChannelId && typeof options.textChannelId !== 'string') throw new TypeError('textChannelId must be a string.');
    if (options.selfDeaf && typeof options.selfDeaf !== 'boolean') throw new TypeError('selfDeaf must be a boolean.');
    if (options.selfMute && typeof options.selfMute !== 'boolean') throw new TypeError('selfMute must be a boolean.');
    if (options.queue && !(options.queue instanceof AbstractQueue)) throw new TypeError('Queue must extend AbstractQueue.');
  }

  /**
   * Create a new Player instance
   * @param {Vulkava} vulkava - The vulkava instance
   * @param {Object} options - The player options
   * @param {String} options.guildId - The guild id of this player
   * @param {String} options.voiceChannelId - The voice channel id of this player
   * @param {String} [options.textChannelId] - The text channel id of this player
   * @param {Boolean} [options.selfMute] - Whether or not this player is muted
   * @param {Boolean} [options.selfDeaf] - Whether or not this player is deafened
   * @param {AbstractQueue} [options.queue] - The queue for this player
   */
  constructor(vulkava: Vulkava, options: PlayerOptions) {
    Player.checkOptions(options);

    this.vulkava = vulkava;
    this.guildId = options.guildId;

    this.filters = new Filters(this);

    this.voiceChannelId = options.voiceChannelId;
    this.textChannelId = options.textChannelId ?? null;

    this.selfDeaf = options.selfDeaf ?? false;
    this.selfMute = options.selfMute ?? false;

    this.current = null;
    this.queue = options.queue ?? new DefaultQueue();

    this.queueRepeat = false;
    this.trackRepeat = false;

    this.position = 0;
    this.positionTimestamp = 0;

    this.playing = false;
    this.paused = false;

    this.moving = false;

    this.state = ConnectionState.DISCONNECTED;
    this.voiceState = {} as VoiceState;

    this.vulkava.emit('playerCreate', this);

    this.assignNode();
  }

  get recorder(): Recorder {
    if (this.recorderObj) return this.recorderObj;

    this.recorderObj = new Recorder(this.vulkava, this);
    return this.recorderObj;
  }

  /**
   * Gets the exact track position based on the last playerUpdate packet
   */
  get exactPosition(): number {
    if (this.paused) return this.position;

    const filterConfig = this.filters.active.timescale;

    const rate = filterConfig?.rate ?? 1;
    const speed = filterConfig?.speed ?? 1;

    return Math.min(this.current?.duration ?? 0, (this.position + (Date.now() - this.positionTimestamp)) * rate * speed);
  }

  /**
   * Gets the queue duration in milliseconds
   * @deprecated - Use `queue.duration` instead
   */
  get queueDuration(): number {
    return this.queue.duration;
  }

  /**
   * Gets the volume of the player
   */
  get volume(): number {
    return (this.filters.active.volume ?? 1) * 100;
  }

  /**
   * Assigns a Node to this player
   * @private
   */
  private assignNode() {
    const node = this.vulkava.bestNode;

    this.node = node;
  }

  /**
   * Connects to the voice channel
   */
  public connect() {
    if (this.state === ConnectionState.CONNECTED) return;

    if (!this.voiceChannelId) {
      throw new Error('No voice channel id provided');
    }

    if (this.node === null) {
      this.assignNode();
    }

    this.state = ConnectionState.CONNECTING;

    this.sendVoiceState();

    if (this.connectTimeout) clearTimeout(this.connectTimeout);

    this.connectTimeout = setTimeout(() => {
      this.state = ConnectionState.DISCONNECTED;
      throw new Error('Voice connection timeout. See possible solutions here: https://vulkava.js.org/common-issues');
    }, 10000);
  }

  /**
   * Disconnects from the voice channel
   */
  public disconnect() {
    this.vulkava.sendWS(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: null
      }
    });

    this.state = ConnectionState.DISCONNECTED;
  }

  /**
   * Destroys the player
   */
  public destroy() {
    this.disconnect();

    this.vulkava.emit('playerDestroy', this);

    this.node?.send({
      op: 'destroy',
      guildId: this.guildId
    });

    this.vulkava.players.delete(this.guildId);
  }

  /**
   * @param {Node} node - The target node to move the player
   */
  public moveNode(node: Node) {
    if (!node) throw new TypeError('You must provide a Node instance.');
    if (node.state !== NodeState.CONNECTED) throw new Error('The provided node is not connected.');
    if (this.node === node) return;

    this.moving = true;
    const wasRecording = !!this.recorderObj?.started;
    if (wasRecording) this.recorderObj?.stop();

    this.node?.send({
      op: 'destroy',
      guildId: this.guildId,
    });

    this.node = node;

    if (Object.keys(this.voiceState).length === 2) {
      this.state = ConnectionState.CONNECTING;

      this.sendVoiceUpdate();
    }

    if (this.filters.enabled) {
      this.filters.apply();
    }

    if (wasRecording) this.recorderObj?.resume();
    if (this.playing && this.current) {
      const payload = {
        op: 'play',
        guildId: this.guildId,
        track: this.current.encodedTrack,
        startTime: this.current?.isStream ? 0 : this.position
      };

      this.node.send(payload);
    } else {
      this.moving = false;
    }
  }

  /**
   * Gets the latency between discord voice gateway & lavalink node.
   * @returns {Promise<Number>}
   */
  public async ping(): Promise<number> {
    if (this.node === null || this.state !== ConnectionState.CONNECTED) return Infinity;
    return this.node.ping(this.guildId);
  }

  /**
   * Plays a track
   * @param {Object} [options] - Play options
   * @param {Number} [options.startTime] - Start time in milliseconds
   * @param {Number} [options.endTime] - End time in milliseconds
   * @param {Boolean} [options.noReplace] - Whether to ignore operation if a track is already playing or paused
   */
  public async play(options?: PlayOptions) {
    if (this.node === null) {
      this.assignNode();
    }

    if (!this.current) {
      let newTrack = this.queue.poll();

      if (newTrack) {
        if (newTrack instanceof UnresolvedTrack) {
          try {
            newTrack = await newTrack.build();
          } catch (e) {
            this.vulkava.emit('error', this.node, e);
            if (this.queue.size > 0) this.play();
            return;
          }
        }
      } else {
        throw new Error('The queue is empty!');
      }

      this.current = newTrack;
    }

    this.playing = true;

    this.node?.send({
      op: 'play',
      guildId: this.guildId,
      track: this.current.encodedTrack,
      ...options
    });
  }

  /**
   * Sends a voice state update payload to the discord gateway
   * @private
   */
  private sendVoiceState() {
    this.vulkava.sendWS(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: this.voiceChannelId,
        self_mute: this.selfMute,
        self_deaf: this.selfDeaf
      }
    });
  }

  /**
   * Sets the bot's self deaf state
   * @param state - Whether to self deaf or not
   */
  public setSelfDeaf(state: boolean) {
    if (typeof state !== 'boolean') throw new TypeError('state must be a boolean');

    if (this.selfDeaf !== state && this.state !== ConnectionState.DISCONNECTED) {
      this.selfDeaf = state;
      this.sendVoiceState();
    }
  }

  /**
   * Sets the bot's self mute state
   * @param state - Whether to self mute or not
   */
  public setSelfMute(state: boolean) {
    if (typeof state !== 'boolean') throw new TypeError('state must be a boolean');

    if (this.selfMute !== state && this.state !== ConnectionState.DISCONNECTED) {
      this.selfMute = state;
      this.sendVoiceState();
    }
  }

  /**
   * Sets the track looping
   * @param {Boolean} state - Whether to enable track looping or not
   */
  public setTrackLoop(state: boolean) {
    this.trackRepeat = state;
  }

  /**
   * Sets the queue looping
   * @param {Boolean} state - Whether to enable queue looping or not
   */
  public setQueueLoop(state: boolean) {
    this.queueRepeat = state;
  }

  /**
   * Sets the player voice channel
   * @param {String} channelId - The voice channel id
   */
  public setVoiceChannel(channelId: string) {
    if (!channelId || typeof channelId !== 'string') throw new TypeError('Voice channel id must be a string.');
    if (this.voiceChannelId === channelId) return;

    this.voiceChannelId = channelId;
    this.state = ConnectionState.DISCONNECTED;
    this.connect();
  }

  /**
   * Shuffles the queue
   * @deprecated Use `queue.shuffle()` instead
   */
  public shuffleQueue() {
    if (this.queue instanceof DefaultQueue) {
      (this.queue as DefaultQueue).shuffle();
    }
  }

  /**
   * Skips the current playing track
   * @param {Number} [amount=1] - The amount of tracks to skip
   */
  public skip(amount = 1) {
    if (!this.playing) return;

    if (amount > this.queue.size) {
      this.queue.clear();
    } else {
      this.queue.skipNTracks(amount);
    }

    this.node?.send({
      op: 'stop',
      guildId: this.guildId
    });
  }

  /**
   * Pause or unpause the player
   * @param {Boolean} [state=true] - Whether to pause or unpause the player
   */
  public pause(state = true) {
    if (typeof state !== 'boolean') {
      throw new TypeError('State must be a boolean');
    }

    if (!this.playing) return;

    if (this.node === null) throw new Error('Assertion failed. The player does not have a node.');

    this.paused = state;

    this.node.send({
      op: 'pause',
      guildId: this.guildId,
      pause: state
    });
  }

  /**
   * Seek to a specific position in the track
   * @param {Number} position - The position to seek, in milliseconds
   */
  public seek(position: number) {
    if (!this.playing || !this.current || !this.current.isSeekable) return;
    if (typeof position !== 'number') {
      throw new TypeError('Position must be a number');
    }

    if (position > this.current.duration) {
      this.skip();
      return;
    }

    this.node?.send({
      op: 'seek',
      guildId: this.guildId,
      position
    });
  }

  public sendVoiceUpdate() {
    if (this.node === null) {
      this.assignNode();
    }

    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      delete this.connectTimeout;
    }

    this.state = ConnectionState.CONNECTED;

    this.node?.send({
      op: 'voiceUpdate',
      guildId: this.guildId,
      ...this.voiceState
    });
  }

  public updatePlayer(state: PlayerState): void {
    if (state.position) this.position = state.position;
    if (state.time) this.positionTimestamp = state.time;

    if (state.connected) {
      if (this.state !== ConnectionState.CONNECTED) this.state = ConnectionState.CONNECTED;
    } else if (this.state !== ConnectionState.DISCONNECTED) {
      this.state = ConnectionState.DISCONNECTED;
    }
  }
}