import { IncomingMessage } from 'http';
import Vulkava from 'Vulkava';
import WebSocket, { CloseEvent, ErrorEvent, MessageEvent } from 'ws';
import { VERSION } from '..';

enum State {
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

export default class Node {
  private resumed: boolean;
  private readonly vulkava: Vulkava;
  private readonly options: NodeOptions;
  private ws: WebSocket | null;

  public state: State;

  constructor(vulkava: Vulkava, options: NodeOptions) {
    this.resumed = false;
    this.vulkava = vulkava;
    this.options = options;

    this.state = State.DISCONNECTED;
    this.ws = null;
  }

  get identifier() {
    return this.options.id ?? this.options.hostname;
  }

  public connect() {
    if (this.state !== State.DISCONNECTED) return;

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

    this.ws.close(1000);
  }

  public send(payload: Record<string, unknown>) {
    if (this.state !== State.CONNECTED || !this.ws?.OPEN) return;

    this.ws.send(JSON.stringify(payload));
  }

  private setupResuming() {
    if (!this.options.resumeKey) return;

    const payload = {
      op: 'configureResuming',
      resumeKey: this.options.resumeKey,
      timeout: this.options.resumeTimeout ?? 60
    };

    this.send(payload);
  }

  // ---------- WebSocket event handlers ----------
  private open() {
    this.state = State.CONNECTED;
    this.vulkava.emit('nodeConnect', this);

    if (!this.resumed) {
      this.setupResuming();
    }
  }

  private message({ data }: MessageEvent) {
    const payload = JSON.parse(data as string);

    // TODO: Implement message handlers

    this.vulkava.emit('raw', payload);
  }

  private error({ error }: ErrorEvent) {
    this.vulkava.emit('nodeError', this, error);
  }

  private close({ code, reason, wasClean }: CloseEvent) {
    if (wasClean) {
      this.state = State.DISCONNECTED;

      this.vulkava.emit('nodeDisconnect', this);
      return;
    }
    this.vulkava.emit('nodeError', this, new Error(`WebSocket closed abnormally with code ${code}: ${reason}`));
    // TODO: Cleanup and reconnect
  }

  private upgrade(msg: IncomingMessage) {
    if (msg.headers['Session-Resumed']) {
      this.resumed = true;
      this.vulkava.emit('nodeResume', this);
    }
  }
}