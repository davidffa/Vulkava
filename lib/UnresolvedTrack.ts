import { Track } from '..';
import { Vulkava } from './Vulkava';

export default class UnresolvedTrack {
  private readonly vulkava: Vulkava;

  public readonly title: string;
  public readonly author: string;
  public readonly duration: number;
  public readonly uri: string;
  public readonly source: string;
  public requester: unknown;

  private readonly isrc: string;

  constructor(vulkava: Vulkava, title: string, author: string, duration?: number, uri?: string, source?: string, isrc?: string) {
    this.vulkava = vulkava;

    this.title = title;
    this.author = author;
    this.duration = duration ?? 0;
    this.uri = uri ?? '';
    this.source = source ?? 'Unknown';

    if (isrc) this.isrc = isrc;

    this.requester = null;
  }

  get query() {
    return this.isrc ? `"${this.isrc}"` : `${this.author} - ${this.title}`;
  }

  public async build(): Promise<Track> {
    let res = await this.vulkava.search(this.query, this.vulkava.unresolvedSearchSource);

    if (res.loadType !== 'SEARCH_RESULT' || !res.tracks.length) {
      if (!this.isrc) throw new Error(`Failed to resolve track ${this.uri}`);

      res = await this.vulkava.search(`${this.author} - ${this.title}`, this.vulkava.unresolvedSearchSource);

      if (res.loadType !== 'SEARCH_RESULT' || !res.tracks.length) throw new Error(`Failed to resolve track ${this.uri}`);
    }

    const track = res.tracks[0] as Track;
    track.setRequester(this.requester);

    return track;
  }

  public setRequester(requester: unknown) {
    this.requester = requester;
  }
}
