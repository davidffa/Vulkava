import { fetch } from 'undici';

import Node from '../Node';
import {
  LAVALINK_API_VERSION,
  DECODE_TRACKS,
  LOAD_TRACKS,
  PLAYER,
  SESSIONS,
  RECORD,
  RECORDS,
  ROUTE_PLANNER_STATUS,
  ROUTE_PLANNER_FREE_ALL,
  ROUTE_PLANNER_FREE_ADDR,
  VERSION,
  VERSIONS,
  INFO
} from './Endpoints';

import {
  Info,
  ITrack,
  LavalinkRESTError,
  LoadTracksResult,
  RequestOptions,
  RoutePlannerStatus,
  TrackInfo,
  UpdatePlayerOptions,
  Versions
} from '../@types';

export class RESTManager {
  private readonly baseUrl: string;
  #sessionId: string;

  set sessionId(sessionId: string) {
    this.#sessionId = sessionId;
  }

  constructor(private readonly node: Node) {
    this.baseUrl = `http${node.options.secure ? 's' : ''}://${node.options.hostname}:${node.options.port}`;

    if (node.options.transport === 'rest') {
      this.baseUrl += `/v${LAVALINK_API_VERSION}`;
    }
  }

  public async decodeTrack(encodedTrack: string): Promise<TrackInfo> {
    return this.request({
      method: 'GET',
      path: DECODE_TRACKS() + `?track=${encodeURIComponent(encodedTrack)}`
    });
  }

  public async decodeTracks(encodedTracks: string[]): Promise<ITrack[]> {
    return this.request({
      method: 'POST',
      path: DECODE_TRACKS(),
      json: encodedTracks
    });
  }

  public async deleteRecord(guildId: string, id: string) {
    await this.request({
      method: 'DELETE',
      path: RECORD(guildId, id)
    });
  }

  public async deleteRecords(guildId: string) {
    await this.request({
      method: 'DELETE',
      path: RECORDS(guildId)
    });
  }

  public async getRecord(guildId: string, id: string): Promise<Buffer> {
    return this.request({
      method: 'GET',
      path: RECORD(guildId, id)
    });
  }

  public async getRecords(guildId: string): Promise<string[]> {
    return this.request({
      method: 'GET',
      path: RECORDS(guildId)
    });
  }

  public async getRoutePlannerStatus(): Promise<RoutePlannerStatus> {
    return this.request({
      method: 'GET',
      path: ROUTE_PLANNER_STATUS()
    });
  }

  public async freeRoutePlannerAddress(address: string) {
    await this.request({
      method: 'POST',
      path: ROUTE_PLANNER_FREE_ADDR(),
      json: {
        address
      }
    });
  }

  public async freeAllRoutePlannerAddresses() {
    await this.request({
      method: 'POST',
      path: ROUTE_PLANNER_FREE_ALL()
    });
  }

  public async loadTracks(identifier: string): Promise<LoadTracksResult> {
    return this.request({
      method: 'GET',
      path: LOAD_TRACKS(identifier)
    });
  }

  public async updateSession(resumeKey: string, timeout?: number) {
    await this.request({
      method: 'PATCH',
      path: SESSIONS(this.#sessionId),
      json: {
        resumeKey,
        timeout
      }
    });
  }

  public async destroyPlayer(guildId: string) {
    await this.request({
      method: 'DELETE',
      path: PLAYER(this.#sessionId, guildId)
    });
  }

  public async updatePlayer(guildId: string, options: UpdatePlayerOptions) {
    let path = PLAYER(this.#sessionId, guildId);

    if (options.noReplace) {
      path += '?noReplace=true';
    }
    delete options.noReplace;

    await this.request({
      method: 'PATCH',
      path,
      json: options
    });
  }

  public async info(): Promise<Info> {
    return this.request({
      method: 'GET',
      path: INFO()
    });
  }

  public async version(): Promise<string> {
    return this.request({
      method: 'GET',
      path: VERSION(),
    });
  }

  public async versions(): Promise<Versions> {
    return this.request({
      method: 'GET',
      path: VERSIONS(),
    });
  }

  public async request<T = unknown>(options: RequestOptions): Promise<T> {
    const { method, path, json } = options;

    const headers: Record<string, string> = {
      ...options.headers,
      'authorization': this.node.options.password ?? '',
    };
    let body: string | null = null;

    if (json) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body
    });

    if (res.status >= 400) {
      if (res.headers.get('content-type') === 'application/json') {
        const error = await res.json() as LavalinkRESTError;

        throw new Error(`Lavalink request failed with status code ${res.status}. Path: ${error.path}. ERROR: ${error.error}: ${error.message}`);
      }
      throw new Error(`Request failed with status code ${res.status}`);
    }

    let resBody;

    if (res.status === 204) {
      resBody = null;
    } else if (res.headers.get('content-type') === 'application/json') {
      resBody = await res.json();
    } else {
      resBody = Buffer.from(await res.arrayBuffer());
    }

    return resBody as T;
  }
}