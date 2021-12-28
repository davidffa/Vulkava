import { Node, Vulkava } from '..';
import { PlayerOptions, PlayerState, PlayOptions, VoiceState } from './@types';
import Filters from './Filters';
import { NodeState } from './Node';
import Track from './Track';
import UnresolvedTrack from './UnresolvedTrack';

export enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED
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
  public node: Node;

  public readonly guildId: string;

  public readonly filters: Filters;

  public voiceChannelId: string;
  public textChannelId?: string | null;

  public selfDeaf?: boolean;
  public selfMute?: boolean;

  public current: Track | null;
  public queue: Array<Track | UnresolvedTrack>;

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
    this.queue = [];

    this.queueRepeat = false;
    this.trackRepeat = false;

    this.position = 0;
    this.positionTimestamp = 0;

    this.playing = false;
    this.paused = false;

    this.moving = false;

    this.node = this.vulkava.nodes.filter(n => n.state === NodeState.CONNECTED).sort((a, b) => a.stats.players - b.stats.players)[0];

    this.state = ConnectionState.DISCONNECTED;
    this.voiceState = {} as VoiceState;
  }

  /**
   * Gets the exact track position based on the last voiceUpdate packet
   */
  get exactPosition(): number {
    return this.position + (Date.now() - this.positionTimestamp);
  }

  /**
   * Gets the queue duration in milliseconds
   */
  get queueDuration(): number {
    return this.queue.reduce((acc, curr) => acc + curr.duration, 0);
  }

  /**
   * Gets the volume of the player
   */
  get volume(): number {
    return (this.filters.active.volume ?? 1) * 100;
  }

  /**
   * Connects to the voice channel
   */
  public connect() {
    if (this.state === ConnectionState.CONNECTED) return;

    if (this.node === null) {
      throw new Error('No available nodes!');
    }

    if (!this.voiceChannelId) {
      throw new Error('No voice channel id provided');
    }

    this.state = ConnectionState.CONNECTING;

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
   * Disconnects from the voice channel
   */
  public disconnect() {
    if (this.state === ConnectionState.DISCONNECTED) return;

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

    this.node.send({
      op: 'destroy',
      guildId: this.guildId
    });

    this.vulkava.players.delete(this.guildId);
  }

  /**
   * @param {Node} node - The node to move the player to
   */
  public moveNode(node: Node) {
    if (!node) throw new TypeError('You must provide a Node instance.');
    if (node.state !== NodeState.CONNECTED) throw new Error('The provided node is not connected.');
    if (this.node === node) return;

    this.moving = true;

    this.node.send({
      op: 'destroy',
      guildId: this.guildId,
    });

    this.node = node;

    if (Object.keys(this.voiceState).length) {
      this.state = ConnectionState.CONNECTING;

      this.sendVoiceUpdate();

      this.state = ConnectionState.CONNECTED;
    }

    if (this.filters.enabled) {
      this.filters.apply();
    }

    if (this.playing && this.current) {
      const payload = {
        op: 'play',
        guildId: this.guildId,
        track: this.current.encodedTrack,
        startTime: this.position
      };

      this.node.send(payload);
    } else {
      this.moving = false;
    }
  }

  /**
   * Gets the latency between discord gateway & lavalink node.
   * @returns {Promise<Number>}
   */
  public ping(): Promise<number> {
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
      throw new Error('No available nodes!');
    }

    if (!this.current) {
      let newTrack = this.queue.shift() ?? null;

      if (newTrack) {
        if (newTrack instanceof UnresolvedTrack) {
          newTrack = await newTrack.build();
        }
      } else {
        throw new Error('The queue is empty!');
      }

      this.current = newTrack;
    }

    this.node.send({
      op: 'play',
      guildId: this.guildId,
      track: this.current.encodedTrack,
      ...options
    });
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
   * Shuffles the queue
   */
  public shuffleQueue() {
    if (this.queue.length) {
      this.queue = this.queue.sort(() => Math.random() - 0.5);
    }
  }

  /**
   * Skips the current playing track
   * @param {Number} [amount=1] - The amount of tracks to skip
   */
  public skip(amount = 1) {
    if (!this.playing) return;

    if (amount > this.queue.length) {
      this.queue = [];
    } else {
      this.queue.splice(0, amount - 1);
    }

    this.node.send({
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
    if (!this.playing || !this.current) return;
    if (typeof position !== 'number') {
      throw new TypeError('Position must be a number');
    }

    if (position > this.current.duration) {
      this.skip();
      return;
    }

    this.node.send({
      op: 'seek',
      guildId: this.guildId,
      position
    });
  }

  public sendVoiceUpdate() {
    this.state = ConnectionState.CONNECTED;

    this.node.send({
      op: 'voiceUpdate',
      guildId: this.guildId,
      ...this.voiceState
    });
  }

  public updatePlayer(state: PlayerState): void {
    if (state.position) this.position = state.position;
    if (state.time) this.positionTimestamp = state.time;

    // Lavalink not sending this?
    // if (state.connected) {
    //   if (this.state !== State.CONNECTED) this.state = State.CONNECTED;
    // } else if (this.state !== State.DISCONNECTED) {
    //   this.state = State.DISCONNECTED;
    // }
  }
}