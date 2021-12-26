import { EventEmitter } from 'events';
import Node, { State } from './Node';

import type { DiscordPayload, EventListeners, IncomingDiscordPayload, LoadTracksResult, PlayerOptions, SearchResult, SEARCH_SOURCE, VoiceServerUpdatePayload, VoiceStateUpdatePayload, VulkavaOptions } from './@types';
import Track from './Track';
import { Player } from '..';

export interface Vulkava {
  once: EventListeners<this>;
  on: EventListeners<this>;
}
export class Vulkava extends EventEmitter {
  public clientId: string;
  public nodes: Node[];
  private readonly defaultSearchSource: SEARCH_SOURCE;

  public readonly sendWS: (guildId: string, payload: DiscordPayload) => void;

  // guildId <-> Player
  public players: Map<string, Player>;

  constructor(options: VulkavaOptions) {
    super();

    // TODO: verify input

    this.nodes = [];
    this.defaultSearchSource = options.defaultSearchSource ?? 'youtube';

    this.sendWS = options.sendWS;

    this.players = new Map();

    for (const nodeOp of options.nodes) {
      const node = new Node(this, nodeOp);
      this.nodes.push(node);
    }
  }

  /**
   * Creates a new player or returns an existing one
   * @param {Object} options - The player options
   * @param {String} options.guildId - The guild id that player belongs to
   * @param {String} options.voiceChannelId - The voice channel id
   * @param {String} [options.textChannelId] - The text channel id
   * @param {Boolean} [options.selfDeaf=false] - Whether the bot joins the voice channel deafened or not
   * @param {Boolean} [options.selfMute=false] - Whether the bot joins the voice channel muted or not
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
   * @param {('youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex')} [source=youtube] - The search source
   */
  public async search(query: string, source: SEARCH_SOURCE = this.defaultSearchSource): Promise<SearchResult> {
    const node = this.nodes.find(n => n.state === State.CONNECTED);

    if (!node) {
      throw new Error('No connected nodes found');
    }

    const sourceMap = {
      youtube: 'ytsearch:',
      youtubemusic: 'ytmsearch:',
      soundcloud: 'scsearch:',
      odysee: 'odsearch:',
      yandex: 'ymsearch:'
    };

    if (!query.startsWith('https://') && !query.startsWith('http://')) {
      query = `${sourceMap[source] || 'ytsearch:'}${query}`;
    }

    const res = await node.request<LoadTracksResult>('GET', `loadtracks?identifier=${encodeURIComponent(query)}`);

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
    if (payload.op !== 0) return;
    if (!payload.d.guild_id) return;

    const player = this.players.get(payload.d.guild_id as string);

    if (!player) return;

    if (payload.t === 'VOICE_STATE_UPDATE') {
      const packet = payload as VoiceStateUpdatePayload;

      if (packet.d.user_id !== this.clientId) return;

      player.voiceState.sessionId = packet.d.session_id;
    } else if (payload.t === 'VOICE_SERVER_UPDATE') {
      // TODO: move to nearest node (region)
      const packet = payload as VoiceServerUpdatePayload;

      Object.assign(player.voiceState.event, packet.d);

      player.sendVoiceUpdate();
    }
  }
}