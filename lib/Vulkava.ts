import { EventEmitter } from 'events';

import Node, { NodeState } from './Node';
import Track from './Track';
import { ConnectionState, Player } from '..';

import { AbstractExternalSource } from './sources/AbstractExternalSource';
import AppleMusic from './sources/AppleMusic';
import Deezer from './sources/Deezer';
import Spotify from './sources/Spotify';

import type {
  IncomingDiscordPayload,
  OutgoingDiscordPayload,
  EventListeners,
  PlayerOptions,
  SearchResult,
  SEARCH_SOURCE,
  VoiceServerUpdatePayload,
  VoiceStateUpdatePayload,
  VulkavaOptions
} from './@types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Vulkava {
  once: EventListeners<this>;
  on: EventListeners<this>;
}

/**
 * Represents the main Vulkava client.
 * @extends EventEmitter
 * @prop {Array<Node>} nodes - The lavalink nodes array
 * @prop {String} clientId - The bot id
 * @prop {Map<String, Player>} players - The players map
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Vulkava extends EventEmitter {
  public clientId: string;
  public nodes: Node[];
  private readonly defaultSearchSource: SEARCH_SOURCE;
  public readonly unresolvedSearchSource: SEARCH_SOURCE;
  public readonly useISRC: boolean;

  private externalSources: AbstractExternalSource[];

  public readonly sendWS: (guildId: string, payload: OutgoingDiscordPayload) => void;

  // guildId <-> Player
  public players: Map<string, Player>;

  private lastNodeSorting: number;

  static checkOptions(options: VulkavaOptions) {
    if (typeof options !== 'object') {
      throw new TypeError('VulkavaOptions must be an object');
    }

    if (!options.nodes) {
      throw new TypeError('VulkavaOptions must contain a nodes property');
    }

    if (!Array.isArray(options.nodes)) {
      throw new TypeError('VulkavaOptions.nodes must be an array');
    }

    if (options.nodes.length === 0) {
      throw new TypeError('VulkavaOptions.nodes must contain at least one node');
    }

    if (!options.sendWS || typeof options.sendWS !== 'function') {
      throw new TypeError('VulkavaOptions.sendWS must be a function');
    }

    if (options.disabledSources && typeof options.disabledSources !== 'object' && !Array.isArray(options.disabledSources)) {
      throw new TypeError('VulkavaOptions.disabledSources must be an array');
    }

    if (options.useISRC && typeof options.useISRC !== 'boolean') {
      throw new TypeError('VulkavaOptions.useISRC must be a boolean');
    }
  }

  /**
   * Create a new Vulkava instance
   * @param {Object} options - The Vulkava options
   * @param {Array<Object>} options.nodes - The lavalink nodes array
   * @param {String} [options.nodes[].id] - The lavalink node identifier
   * @param {String} options.nodes[].hostname - The lavalink node hostname
   * @param {Number} options.nodes[].port - The lavalink node port
   * @param {String} [options.nodes[].password] - The lavalink node password
   * @param {Boolean} [options.nodes[].secure] - Whether the lavalink node uses TLS/SSL or not
   * @param {Boolean} [options.nodes[].followRedirects] - Whether to follow redirects or not (default is false)
   * @param {String} [options.nodes[].region] - The lavalink node region
   * @param {String} [options.nodes[].resumeKey] - The resume key
   * @param {Number} [options.nodes[].resumeTimeout] - The resume timeout, in seconds
   * @param {Number} [options.nodes[].maxRetryAttempts] - The max number of retry attempts
   * @param {Number} [options.nodes[].retryAttemptsInterval] - The interval between retry attempts
   * @param {String} [options.defaultSearchSource] - The default search source
   * @param {String} [options.unresolvedSearchSource] - The unresolved search source
   * @param {Object} [options.spotify] - The spotify credential options
   * @param {String} [options.spotify.clientId] - The spotify client id
   * @param {String} [options.spotify.clientSecret] - The spotify client secret
   * @param {String} [options.spotify.market] - The spotify market
   * @param {Array<String>} [options.disabledSources] - Disables apple music, deezer or spotify. Doesn't have any effect if you use the lavasrc plugin.
   * @param {Boolean} [options.useISRC] - Whether to use ISRC to resolve tracks or not
   * @param {Function} options.sendWS - The function to send websocket messages to the main gateway
   */
  constructor(options: VulkavaOptions) {
    super();

    Vulkava.checkOptions(options);

    this.nodes = [];
    this.defaultSearchSource = options.defaultSearchSource ?? 'youtube';
    this.unresolvedSearchSource = options.unresolvedSearchSource ?? 'youtube';
    this.useISRC = options.useISRC ?? true;

    this.externalSources = [];

    if (options.disabledSources) {
      if (!options.disabledSources.includes('APPLE_MUSIC')) this.externalSources.push(new AppleMusic(this));
      if (!options.disabledSources.includes('DEEZER')) this.externalSources.push(new Deezer(this));
      if (!options.disabledSources.includes('SPOTIFY')) this.externalSources.push(new Spotify(this, options.spotify?.clientId, options.spotify?.clientSecret, options.spotify?.market));
    } else {
      this.externalSources = [
        new AppleMusic(this),
        new Deezer(this),
        new Spotify(this, options.spotify?.clientId, options.spotify?.clientSecret, options.spotify?.market)
      ];
    }

    this.sendWS = options.sendWS;

    this.players = new Map();

    for (const nodeOp of options.nodes) {
      const node = new Node(this, nodeOp);
      this.nodes.push(node);
    }

    this.lastNodeSorting = 0;
  }

  public get bestNode(): Node {
    if (Date.now() < this.lastNodeSorting + 30000) {
      if (this.nodes[0].state === NodeState.CONNECTED) {
        return this.nodes[0];
      }

      this.lastNodeSorting = 0;
      return this.bestNode;
    }

    this.nodes = this.nodes.sort((a, b) => a.totalPenalties - b.totalPenalties);
    const node = this.nodes[0];
    this.lastNodeSorting = Date.now();

    if (!node || node.state !== NodeState.CONNECTED) {
      throw new Error('No connected nodes!');
    }

    return node;
  }

  /**
   * Adds an external source that produces a SearchResult with UnresolvedTracks
   * @param {AbstractExternalSource} extSource - The external source
   */
  public addExternalSource(extSource: AbstractExternalSource) {
    if (extSource instanceof AbstractExternalSource) {
      throw new Error(`${extSource.constructor.name} must extend AbstractExternalSource`);
    }

    this.externalSources.push(extSource);
  }

  /**
   * Decodes a track by its base64 string
   * @param {String} encodedTrack - The base64 encoded track
   * @returns {Promise<Track>}
   */
  public async decodeTrack(encodedTrack: string): Promise<Track> {
    const node = this.bestNode;

    const trackInfo = await node.rest.decodeTrack(encodedTrack);

    return new Track({ track: encodedTrack, info: { ...trackInfo } });
  }

  /**
   * Decodes multiple tracks by their base64 string
   * @param {String[]} encodedTracks - The base64 encoded tracks
   * @returns {Promise<Track[]>}
   */
  public async decodeTracks(encodedTracks: string[]): Promise<Track[]> {
    const node = this.bestNode;

    const res = await node.rest.decodeTracks(encodedTracks);

    return res.map(it => new Track(it));
  }

  /**
   * Creates a new player or returns an existing one
   * @param {Object} options - The player options
   * @param {String} options.guildId - The guild id that player belongs to
   * @param {String} options.voiceChannelId - The voice channel id
   * @param {String} [options.textChannelId] - The text channel id
   * @param {Boolean} [options.selfDeaf=false] - Whether the bot joins the voice channel deafened or not
   * @param {Boolean} [options.selfMute=false] - Whether the bot joins the voice channel muted or not
   * @param {AbstractQueue} [options.queue] - The queue for this player
   * @returns {Player}
   */
  public createPlayer(options: PlayerOptions): Player {
    let player = this.players.get(options.guildId);

    if (player) {
      return player;
    }

    player = new Player(this, options);
    this.players.set(options.guildId, player);

    return player;
  }

  /**
   *
   * @param {String} query - The query to search for
   * @param {('youtube' | 'youtubemusic' | 'spotify' | 'applemusic' | 'deezer'| 'soundcloud' | 'odysee' | 'yandex')} [source=youtube] - The search source. spotify, apple music and deezer search are not supported by default (only urls are supported by default), you can use the https://github.com/topi314/LavaSrc plugin to enable them.
   * @returns {Promise<SearchResult>}
   */
  public async search(query: string, source: SEARCH_SOURCE = this.defaultSearchSource): Promise<SearchResult> {
    if (typeof query !== 'string') { throw new TypeError('Search query must be a non-empty string'); }

    for (const source of this.externalSources) {
      const loadRes = await source.loadItem(query);

      if (loadRes) return loadRes;
    }

    const sourceMap = {
      youtube: 'ytsearch:',
      youtubemusic: 'ytmsearch:',
      spotify: 'spsearch:',
      applemusic: 'amsearch:',
      deezer: 'dzisearch:',
      soundcloud: 'scsearch:',
      odysee: 'odsearch:',
      yandex: 'ymsearch:'
    };

    if (!query.startsWith('https://') && !query.startsWith('http://')) {
      query = `${sourceMap[source] || 'ytsearch:'}${query}`;
    }

    const node = this.bestNode;

    const res = await node.rest.loadTracks(query);

    if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') {
      return res as unknown as SearchResult;
    } else {
      const tracks = res.tracks.map(t => new Track(t));
      if (res.loadType === 'PLAYLIST_LOADED') {
        res.playlistInfo.duration = tracks.reduce((acc, cur) => acc + cur.duration, 0);
      }

      return {
        ...res,
        tracks
      };
    }
  }

  /**
   * Connects to all lavalink nodes
   * @param {String} clientId - The client (BOT) id
   */
  public start(clientId: string) {
    if (typeof clientId !== 'string') {
      throw new TypeError('clientId must be a string');
    }

    this.clientId = clientId;

    for (const node of this.nodes) {
      node.connect();
    }
  }

  /**
   * Handles voice state & voice server update packets
   * @param payload - The voice packet
   */
  public handleVoiceUpdate(payload: IncomingDiscordPayload) {
    if (payload.op !== 0 || !(payload.d as Record<string, unknown>).guild_id) return;

    const player = this.players.get((payload.d as Record<string, unknown>).guild_id as string);

    if (!player) return;

    if (payload.t === 'VOICE_STATE_UPDATE') {
      const packet = payload as VoiceStateUpdatePayload;

      if (packet.d.user_id !== this.clientId || !packet.d.channel_id) return;

      player.voiceChannelId = packet.d.channel_id;

      if (player.voiceState.sessionId === packet.d.session_id) return;
      player.voiceState.sessionId = packet.d.session_id;

      this.emit('debug', `Received voiceStateUpdate from discord gateway for player ${player.guildId}. Voice channel id: ${player.voiceChannelId}. SessionID: ${player.voiceState.sessionId}`);

      if (player.voiceState.event) {
        player.sendVoiceUpdate();
      }
    } else if (payload.t === 'VOICE_SERVER_UPDATE') {
      const packet = payload as VoiceServerUpdatePayload;

      // Sometimes discord sends a partial voice server update packet, with null endpoint
      // Just wait for a new one I guess ?
      if (!packet.d.endpoint) {
        return;
      }

      player.voiceState.event = {
        ...packet.d
      };

      // A node should be assigned to the player on Player#connect()
      if (player.node === null) {
        player.state = ConnectionState.DISCONNECTED;
        throw new Error('Assertion failed. The Player does not have a node.');
      }

      this.emit('debug', `Received voiceServerUpdate from discord gateway for player ${player.guildId}. Endpoint: ${player.voiceState.event.endpoint}. Token: ${player.voiceState.event.token}`);

      if (['us', 'brazil', 'buenos-aires'].some(loc => packet.d.endpoint.startsWith(loc))) {
        if (player.node.options.region && player.node.options.region !== 'USA') {
          const usaNodes = this.nodes.filter(node => node.options.region === 'USA' && node.state === NodeState.CONNECTED);

          if (usaNodes.length) {
            // Nodes are already sorted by penalties
            player.moveNode(usaNodes[0]);
            return;
          }
        }
      } else if (player.node.options.region && player.node.options.region !== 'EU') {
        const europeNodes = this.nodes.filter(node => node.options.region === 'EU' && node.state === NodeState.CONNECTED);

        if (europeNodes.length) {
          // Nodes are already sorted by penalties
          player.moveNode(europeNodes[0]);
          return;
        }
      }

      if (player.voiceState.sessionId) {
        player.sendVoiceUpdate();
      }
    }
  }
}
