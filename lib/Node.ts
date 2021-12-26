import { IncomingMessage } from 'http';
import WebSocket, { CloseEvent, ErrorEvent, MessageEvent } from 'ws';
import { Vulkava } from './Vulkava';
import fetch, { HTTPMethods } from './utils/Request';
import { Player, VERSION } from '..';

import type {
  NodeOptions,
  NodeStats,
  PlayerEventPayload,
  TrackEndEvent,
  TrackExceptionEvent,
  TrackStartEvent,
  TrackStuckEvent,
  Versions,
  WebSocketClosedEvent
} from './@types';

export enum NodeState {
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

export default class Node {
  private resumed?: boolean;
  private readonly vulkava: Vulkava;
  public readonly options: NodeOptions;
  private ws: WebSocket | null;

  public retryAttempts: number;

  public state: NodeState;
  public stats: NodeStats;

  /** Version object for the node (null if lavalink does not support) */
  public versions: Versions | null;

  constructor(vulkava: Vulkava, options: NodeOptions) {
    this.vulkava = vulkava;
    this.options = options;

    this.retryAttempts = -1;
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

    this.ws = new WebSocket(`ws${this.options.secure ? 's' : ''}://${this.options.hostname}:${this.options.port}`, { headers });

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
    try {
      this.versions = await this.request('GET', 'versions');
    } catch {
      this.versions = null;
    }
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
    if (this.state !== NodeState.CONNECTED || !this.ws?.OPEN) return;

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
    this.vulkava.emit('trackStart', player, player.current);
  }

  private handleTrackEnd(ev: TrackEndEvent, player: Player) {
    // If a player is moving node
    if (player.node !== this) return;

    player.playing = false;

    if (['LOAD_FAILED', 'CLEANUP'].includes(ev.reason)) {
      this.vulkava.emit('trackEnd', player, player.current, ev.reason);
      if (player.queue.length > 0) {
        player.current = player.queue.shift() ?? null;

        player.play();
      } else {
        this.vulkava.emit('queueEnd', player);
      }
      return;
    }

    if (player.queueRepeat && player.current) {
      player.queue.push(player.current);
    }
    this.vulkava.emit('trackEnd', player, player.current, ev.reason);

    if (player.trackRepeat || player.queue.length) {
      player.play();
      return;
    }

    this.vulkava.emit('queueEnd', player);
  }

  private handleTrackStuck(ev: TrackStuckEvent, player: Player) {
    this.vulkava.emit('trackStuck', player, player.current, ev.thresholdMs);
  }

  private handleTrackExeption(ev: TrackExceptionEvent, player: Player) {
    this.vulkava.emit('trackExeption', player, player.current, ev.exception);
    player.skip();
  }

  private handleWSClose(ev: WebSocketClosedEvent, player: Player) {
    if (ev.code === 1006) {
      player.sendVoiceUpdate();
    } else {
      this.vulkava.emit('wsDisconnect', player, ev.code, ev.reason);
    }
  }

  // ---------- WebSocket event handlers ----------
  private open() {
    this.state = NodeState.CONNECTED;
    this.vulkava.emit('nodeConnect', this);

    if (!this.versions) this.fetchVersions();

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

  private error({ error }: ErrorEvent) {
    this.vulkava.emit('error', this, error);
  }

  private close({ code, reason, wasClean }: CloseEvent) {
    this.state = NodeState.DISCONNECTED;

    this.ws?.removeAllListeners();
    this.ws = null;

    if (wasClean) {
      this.vulkava.emit('nodeDisconnect', this);
      return;
    }

    const newNode = this.vulkava.nodes.find(n => n.state === NodeState.CONNECTED);

    if (newNode) {
      for (const player of this.vulkava.players.values()) {
        if (player.node === this) {
          player.moveNode(newNode);
        }
      }
    }

    this.vulkava.emit('error', this, new Error(`WebSocket closed abnormally with code ${code}: ${reason}`));

    if (this.retryAttempts === 0) this.connect();
    else setTimeout(() => this.connect, this.options.retryAttemptsInterval ?? 5000);
  }

  private upgrade(msg: IncomingMessage) {
    if (msg.headers['session-resumed'] === 'true') {
      this.resumed = true;
      this.vulkava.emit('nodeResume', this);
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