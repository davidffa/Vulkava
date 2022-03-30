import { IncomingMessage } from 'http';
import WebSocket, { CloseEvent, ErrorEvent, MessageEvent } from 'ws';
import { Vulkava } from './Vulkava';
import fetch, { HTTPMethods } from './utils/Request';
import { Player, VERSION } from '..';

import type {
  NodeOptions,
  NodeStats,
  PlayerEventPayload,
  RoutePlannerStatus,
  TrackEndEvent,
  TrackExceptionEvent,
  TrackStartEvent,
  TrackStuckEvent,
  Versions,
  WebSocketClosedEvent
} from './@types';
import { ConnectionState } from './Player';
import UnresolvedTrack from './UnresolvedTrack';

export enum NodeState {
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

/**
 * Represents a lavalink Node structure.
 * @prop {State} state - The node state (CONNECTING, CONNECTED, DISCONNECTED)
 * @prop {Object} stats - The node stats
 * @prop {Object | null} versions - The lavalink node versions
 */
export default class Node {
  private resumed?: boolean;
  private readonly vulkava: Vulkava;
  public readonly options: NodeOptions;
  private ws: WebSocket | null;

  public retryAttempts: number;

  public state: NodeState;
  public stats: NodeStats;

  /** Version object for the node (undefined if lavalink does not support) */
  public versions?: Versions;

  static checkOptions(options: NodeOptions) {
    if (typeof options !== 'object') throw new TypeError('NodeOptions must be an object');

    if (!options.hostname) throw new TypeError('NodeOptions.hostname is required');
    if (!options.port) throw new TypeError('NodeOptions.port is required');

    if (typeof options.hostname !== 'string') throw new TypeError('NodeOptions.hostname must be a string');
    if (typeof options.port !== 'number') throw new TypeError('NodeOptions.port must be a number');

    if (options.id && typeof options.id !== 'string') throw new TypeError('NodeOptions.id must be a string');
    if (options.password && typeof options.password !== 'string') throw new TypeError('NodeOptions.password must be a string');
    if (options.region && (typeof options.region !== 'string' || !['USA', 'EU'].includes(options.region))) throw new TypeError('NodeOptions.region must be a string and must be either "USA" or "EU"');
    if (options.resumeKey && typeof options.resumeKey !== 'string') throw new TypeError('NodeOptions.resumeKey must be a string');
    if (options.resumeTimeout && typeof options.resumeTimeout !== 'number') throw new TypeError('NodeOptions.resumeTimeout must be a number');
    if (options.secure && typeof options.secure !== 'boolean') throw new TypeError('NodeOptions.secure must be a boolean');
    if (options.followRedirects && typeof options.followRedirects !== 'boolean') throw new TypeError('NodeOptions.followRedirects must be a boolean');
    if (options.maxRetryAttempts && typeof options.maxRetryAttempts !== 'number') throw new TypeError('NodeOptions.maxRetryAttempts must be a number');
    if (options.retryAttemptsInterval && typeof options.retryAttemptsInterval !== 'number') throw new TypeError('NodeOptions.retryAttemptsInterval must be a number');
  }

  /**
   * Create a new Vulkava instance
   * @param {Vulkava} vulkava - The Vulkava instance
   * @param {Object} options - The node options
   * @param {String} [options.id] - The lavalink node identifier
   * @param {String} options.hostname - The lavalink node hostname
   * @param {Number} options.port - The lavalink node port
   * @param {String} [options.password] - The lavalink node password
   * @param {Boolean} [options.secure] - Whether the lavalink node uses TLS/SSL or not
   * @param {String} [options.region] - The lavalink node region
   * @param {String} [options.resumeKey] - The resume key
   * @param {Number} [options.resumeTimeout] - The resume timeout, in seconds
   * @param {Number} [options.maxRetryAttempts] - The max number of reconnect attempts
   * @param {Number} [options.retryAttemptsInterval] - The interval between reconnect attempts, in milliseconds
   */
  constructor(vulkava: Vulkava, options: NodeOptions) {
    Node.checkOptions(options);

    this.vulkava = vulkava;
    this.options = options;

    this.retryAttempts = 0;
    this.state = NodeState.DISCONNECTED;

    this.stats = {
      playingPlayers: 0,
      players: 0,
      uptime: 0,
      memory: {
        reservable: 0,
        used: 0,
        free: 0,
        allocated: 0,
      },
      cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
      },
      frameStats: {
        sent: 0,
        nulled: 0,
        deficit: 0,
      }
    };

    this.ws = null;
  }

  get identifier() {
    return this.options.id ?? this.options.hostname;
  }

  public connect() {
    if (this.state !== NodeState.DISCONNECTED) return;

    ++this.retryAttempts;

    this.state = NodeState.CONNECTING;

    const headers = {
      Authorization: this.options.password,
      'User-Id': this.vulkava.clientId,
      'Client-Name': `Vulkava/${VERSION}`
    };

    if (this.options.resumeKey) Object.assign(headers, { 'Resume-Key': this.options.resumeKey });

    this.ws = new WebSocket(`ws${this.options.secure ? 's' : ''}://${this.options.hostname}:${this.options.port}`, {
      headers,
      followRedirects: this.options.followRedirects
    });

    this.ws.onopen = this.open.bind(this);
    this.ws.onmessage = this.message.bind(this);
    this.ws.onerror = this.error.bind(this);
    this.ws.onclose = this.close.bind(this);
    this.ws.once('upgrade', this.upgrade.bind(this));
  }

  public disconnect() {
    if (this.state === NodeState.DISCONNECTED || this.ws === null) return;

    this.ws.close(1000, 'Vulkava: disconnect');
  }

  /** Fetches versions from lavalink Node */
  private async fetchVersions(): Promise<void> {
    const versions = await this.request<Versions>('GET', 'versions');

    if (versions.BUILD) this.versions = versions;
    else delete this.versions;
  }

  /**
   * Gets the route planner status
   * @returns {Promise<Object>}
   */
  public getRoutePlannerStatus(): Promise<RoutePlannerStatus> {
    return this.request<RoutePlannerStatus>('GET', 'routeplanner/status');
  }

  /**
   * Unmarks a failed address
   * @param {String} address - The address to unmark
   */
  public unmarkFailedAddress(address: string) {
    return this.request('POST', 'routeplanner/free/address', { address });
  }

  /**
   * Unmarks all failed address
   */
  public unmarkAllFailedAddress() {
    return this.request('POST', 'routeplanner/free/all');
  }

  /**
   * Gets the node ws connection latency or the latency between discord gateway & lavalink if guildId param provided.
   * @param {String} [guildId]
   * @returns {Promise<Number>}
   */
  // Use this lavalink .jar in order to use this function https://github.com/davidffa/lavalink/releases
  public ping(guildId?: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.state !== NodeState.CONNECTED) resolve(Infinity);

      const t1 = Date.now();

      const rejectTimeout = setTimeout(() => {
        reject(new Error('Lavalink Node took more than 2 seconds to respond.\nDo your Lavalink Node supports ping op?'));
      }, 2000);

      const pong = (node: Node, ping?: number) => {
        if (node !== this) return;
        resolve(ping ?? (Date.now() - t1));
        this.vulkava.removeListener('pong', pong);
        clearTimeout(rejectTimeout);
      };

      this.vulkava.on('pong', pong);
      this.send({ op: 'ping', guildId });
    });
  }

  public send(payload: Record<string, unknown>) {
    if (this.state !== NodeState.CONNECTED || !this.ws?.OPEN) {
      this.vulkava.emit('warn', this, `Packet dropped: ${payload}`);
      return;
    }

    this.ws.send(JSON.stringify(payload));
  }

  private setupResuming() {
    if (!this.options.resumeKey) return;

    const payload = {
      op: 'configureResuming',
      key: this.options.resumeKey,
      timeout: this.options.resumeTimeout ?? 60
    };

    this.send(payload);
  }

  private async pollTrack(player: Player) {
    let newTrack = player.queue.shift() ?? null;

    if (newTrack) {
      if (newTrack instanceof UnresolvedTrack) {
        try {
          newTrack = await newTrack.build();
        } catch (err) {
          this.vulkava.emit('error', this, err);
          this.pollTrack(player);
          return;
        }
      }

      player.current = newTrack;
      player.play();
      return;
    }

    player.current = null;
    this.vulkava.emit('queueEnd', player);
  }

  private handlePlayerEvent(e: PlayerEventPayload) {
    const player = this.vulkava.players.get(e.guildId);

    if (!player) {
      this.vulkava.emit('warn', this, `Unhandled player event. Player not found for guild ${e.guildId}`);
      return;
    }

    switch (e.type) {
      case 'TrackStartEvent':
        this.handleTrackStart(e as TrackStartEvent, player);
        break;
      case 'TrackEndEvent':
        this.handleTrackEnd(e as TrackEndEvent, player);
        break;
      case 'TrackStuckEvent':
        this.handleTrackStuck(e as TrackStuckEvent, player);
        break;
      case 'TrackExceptionEvent':
        this.handleTrackExeption(e as TrackExceptionEvent, player);
        break;
      case 'WebSocketClosedEvent':
        this.handleWSClose(e as WebSocketClosedEvent, player);
        break;
      default:
        this.vulkava.emit('warn', this, `Unhandled player event. Unknown event type: ${e.type}`);
        break;
    }
  }

  private handleTrackStart(_: TrackStartEvent, player: Player) {
    player.playing = true;
    player.paused = false;

    if (player.moving) {
      player.moving = false;
      return;
    }

    this.vulkava.emit('trackStart', player, player.current);
  }

  private async handleTrackEnd(ev: TrackEndEvent, player: Player) {
    // If a player is moving node
    if (player.node !== this) return;

    if (ev.reason === 'REPLACED') {
      if (player.queueRepeat && player.current) {
        player.queue.push(player.current);
      }
      return;
    }

    player.playing = false;

    if (['LOAD_FAILED', 'CLEANUP'].includes(ev.reason)) {
      this.vulkava.emit('trackEnd', player, player.current, ev.reason);

      this.pollTrack(player);
      return;
    }

    this.vulkava.emit('trackEnd', player, player.current, ev.reason);

    if (player.trackRepeat) {
      player.play();
      return;
    }

    if (player.queueRepeat && player.current) {
      player.queue.push(player.current);
    }

    this.pollTrack(player);
  }

  private handleTrackStuck(ev: TrackStuckEvent, player: Player) {
    this.vulkava.emit('trackStuck', player, player.current, ev.thresholdMs);
  }

  private handleTrackExeption(ev: TrackExceptionEvent, player: Player) {
    this.vulkava.emit('trackExeption', player, player.current, ev.exception);
    player.skip();
  }

  private handleWSClose(ev: WebSocketClosedEvent, player: Player) {
    this.vulkava.emit('wsDisconnect', player, ev.code, ev.reason);

    switch (ev.code) {
      case 1006:
      case 4015:
        player.sendVoiceUpdate();
        break;
      case 4006:
      case 4009:
        player.state = ConnectionState.DISCONNECTED;
        player.connect();
        break;
    }
  }

  // ---------- WebSocket event handlers ----------
  private open() {
    this.state = NodeState.CONNECTED;
    this.vulkava.emit('nodeConnect', this);

    this.retryAttempts = 0;

    if (!this.resumed) {
      this.setupResuming();
    }

    delete this.resumed;
  }

  private message({ data }: MessageEvent) {
    const payload = JSON.parse(data as string);

    switch (payload.op) {
      case 'stats':
        delete payload.op;
        this.stats = payload as NodeStats;
        break;
      case 'pong':
        this.vulkava.emit('pong', this, payload.ping);
        break;
      case 'playerUpdate':
        this.vulkava.players.get(payload.guildId)?.updatePlayer(payload.state);
        break;
      case 'event':
        this.handlePlayerEvent(payload);
        break;
      default:
        this.vulkava.emit('warn', this, 'Unknown payload op: ' + payload.op);
        break;
    }

    this.vulkava.emit('raw', this, payload);
  }

  private error({ error, message }: ErrorEvent) {
    if (message.includes('connect ECONNREFUSED')) return;
    if (message.includes('401')) {
      this.retryAttempts = Infinity;
      this.vulkava.emit('error', this, new Error('Authentication failed!'));
      return;
    }
    this.vulkava.emit('error', this, error);
  }

  private close({ code, reason, wasClean }: CloseEvent) {
    this.state = NodeState.DISCONNECTED;

    this.ws?.removeAllListeners();
    this.ws = null;

    if (wasClean) {
      this.vulkava.emit('nodeDisconnect', this, code, reason);
      return;
    }

    const newNode = this.vulkava.nodes.filter(n => n.state === NodeState.CONNECTED).sort((a, b) => a.stats.players - b.stats.players)[0];

    if (newNode) {
      for (const player of this.vulkava.players.values()) {
        if (player.node === this) {
          player.moveNode(newNode);
        }
      }
    }

    this.vulkava.emit('error', this, new Error(`WebSocket closed abnormally with code ${code}: ${reason}`));

    if (this.retryAttempts > (this.options.maxRetryAttempts ?? 10)) return;

    if (this.retryAttempts === 0) this.connect();
    else setTimeout(() => this.connect(), this.options.retryAttemptsInterval ?? 5000);
  }

  private upgrade(msg: IncomingMessage) {
    if (msg.headers['session-resumed'] === 'true') {
      this.resumed = true;
      this.vulkava.emit('nodeResume', this);
    }

    if (this.versions) return;

    if (msg.headers['lavalink-version'] === 'davidffa/lavalink') {
      this.fetchVersions();
    } else {
      delete this.versions;
    }
  }

  // REST
  public request<T>(method: HTTPMethods, endpoint: string, body?: Record<string, unknown> | Array<unknown>): Promise<T> {
    return fetch<T>(`http${this.options.secure ? 's' : ''}://${this.options.hostname}:${this.options.port}/${endpoint}`, {
      method,
      headers: {
        Authorization: this.options.password,
      },
      body
    });
  }
}