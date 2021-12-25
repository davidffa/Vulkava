import { EventEmitter } from 'events';
import Node, { State } from './Node';

import type { EventListeners, LoadTracksResult, SearchResult, SEARCH_SOURCE, VulkavaOptions } from './@types';
import Track from './Track';

export interface Vulkava {
  once: EventListeners<this>;
  on: EventListeners<this>;
}
export class Vulkava extends EventEmitter {
  public clientId: string;
  public nodes: Node[];
  private defaultSearchSource: SEARCH_SOURCE;

  constructor(options: VulkavaOptions) {
    super();

    // TODO: verify input

    this.nodes = [];
    this.defaultSearchSource = options.defaultSearchSource ?? 'youtube';

    for (const nodeOp of options.nodes) {
      const node = new Node(this, nodeOp);
      this.nodes.push(node);
    }
  }

  /**
   *
   * @param {String} query - The query to search for
   * @param {('youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex')?} source - The search source
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
      return {
        ...res,
        tracks: res.tracks.map(t => new Track(t))
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
}