import { IncomingMessage } from 'http';
import WebSocket, { CloseEvent, ErrorEvent, MessageEvent } from 'ws';
import { Vulkava } from './Vulkava';
import fetch, { HTTPMethods } from './utils/Request';
import { VERSION } from '..';

import type { NodeOptions, NodeStats, BasePayload, PlayerEventPayload } from './@types';

export enum State {
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

export default class Node {
  private resumed?: boolean;
  private readonly vulkava: Vulkava;
  private readonly options: NodeOptions;
  private ws: WebSocket | null;

  public retryAttempts: number;

  public state: State;
  public stats: NodeStats;

  constructor(vulkava: Vulkava, options: NodeOptions) {
    this.vulkava = vulkava;
    this.options = options;

    this.retryAttempts = -1;
    this.state = State.DISCONNECTED;

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
    if (this.state !== State.DISCONNECTED) return;

    ++this.retryAttempts;

    this.state = State.CONNECTING;

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
    if (this.state === State.DISCONNECTED || this.ws === null) return;

    this.ws.close(1000, 'Vulkava: disconnect');
  }

  public send(payload: Record<string, unknown>) {
    if (this.state !== State.CONNECTED || !this.ws?.OPEN) return;

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
    // TODO: Handle player events
    switch (e.type) {
      case 'TrackStartEvent':
        break;
      case 'TrackEndEvent':
        break;
      case 'TrackStuckEvent':
        break;
      case 'TrackExceptionEvent':
        break;
      default:
        this.vulkava.emit('nodeWarn', this, `Unknown player event type: ${e.type}`);
        break;
    }
  }

  // ---------- WebSocket event handlers ----------
  private open() {
    this.state = State.CONNECTED;
    this.vulkava.emit('nodeConnect', this);

    this.retryAttempts = 0;

    if (!this.resumed) {
      this.setupResuming();
    }

    delete this.resumed;
  }

  private message({ data }: MessageEvent) {
    const payload = JSON.parse(data as string) as BasePayload;

    switch (payload.op) {
      case 'stats':
        delete (payload as Record<string, unknown>).op;
        this.stats = payload as unknown as NodeStats;
        break;
      case 'pong':
        // TODO: Handle pong
        break;
      case 'playerUpdate':
        // TODO: Update player stats
        break;
      case 'event':
        this.handlePlayerEvent(payload as PlayerEventPayload);
        break;
      default:
        this.vulkava.emit('nodeWarn', this, 'Unknown payload op: ' + payload.op);
        break;
    }

    this.vulkava.emit('raw', payload);
  }

  private error({ error }: ErrorEvent) {
    this.vulkava.emit('nodeError', this, error);
  }

  private close({ code, reason, wasClean }: CloseEvent) {
    // TODO: Move all players to a connected node
    this.state = State.DISCONNECTED;

    this.ws?.removeAllListeners();
    this.ws = null;

    if (wasClean) {
      this.vulkava.emit('nodeDisconnect', this);
      return;
    }

    this.vulkava.emit('nodeError', this, new Error(`WebSocket closed abnormally with code ${code}: ${reason}`));

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
  public request<T>(method: HTTPMethods, endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return fetch<T>(`http${this.options.secure ? 's' : ''}://${this.options.hostname}:${this.options.port}/${endpoint}`, {
      method,
      headers: {
        Authorization: this.options.password,
      },
      body
    });
  }
}