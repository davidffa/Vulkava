import { request } from 'undici';

import { AbstractExternalSource } from './AbstractExternalSource';
import { Vulkava } from '../Vulkava';
import UnresolvedTrack from '../UnresolvedTrack';

import type { PlaylistInfo, SearchResult } from '../@types';

export default class Deezer extends AbstractExternalSource {
  public static readonly DEEZER_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist)\/(?<id>\d+)/;

  constructor(vulkava: Vulkava) {
    super(vulkava);
  }

  public async loadItem(query: string): Promise<SearchResult | null> {
    const deezerMatch = query.match(Deezer.DEEZER_REGEX);
    if (!deezerMatch || !deezerMatch.groups) return null;

    switch (deezerMatch.groups['type']) {
      case 'track':
        return this.getTrack(deezerMatch.groups['id']);
      case 'album':
        return this.getList('ALBUM', deezerMatch.groups['id']);
      case 'playlist':
        return this.getList('PLAYLIST', deezerMatch.groups['id']);
    }

    return null;
  }

  public async getTrack(id: string): Promise<SearchResult> {
    const res = await this.makeRequest<IDeezerTrack>(`track/${id}`);

    if (res instanceof DeezerError) {
      return this.handleErrorResult(res);
    }

    return {
      loadType: 'TRACK_LOADED',
      playlistInfo: {} as PlaylistInfo,
      tracks: [this.buildTrack(res)],
    };
  }

  public async getList(type: 'ALBUM' | 'PLAYLIST', id: string): Promise<SearchResult> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<IDeezerList>(`${type === 'ALBUM' ? 'album' : 'playlist'}/${id}`);

    if (res instanceof DeezerError) {
      return this.handleErrorResult(res);
    }

    for (const it of res.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it));
    }

    return {
      loadType: 'PLAYLIST_LOADED',
      playlistInfo: {
        name: res.title,
        duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
        selectedTrack: 0
      },
      tracks: unresolvedTracks,
    };
  }

  private handleErrorResult(error: DeezerError): SearchResult {
    return {
      loadType: 'LOAD_FAILED',
      playlistInfo: {} as PlaylistInfo,
      tracks: [],
      exception: {
        message: error.toString(),
        severity: 'SUSPIOUS'
      }
    };
  }

  private buildTrack({ title, artist: { name }, link, duration, isrc }: IDeezerTrack): UnresolvedTrack {
    return new UnresolvedTrack(
      this.vulkava,
      title,
      name,
      duration * 1000,
      link,
      'deezer',
      isrc
    );
  }

  private async makeRequest<T>(endpoint: string): Promise<T | DeezerError> {
    const res = await request(`https://api.deezer.com/${endpoint}`).then(r => r.body.json()) as IDeezerResponse;

    if (res.error) {
      return new DeezerError(res.error.type, res.error.message);
    }

    return res as T;
  }
}

class DeezerError implements IDeezerError {
  readonly type: string;
  readonly message: string;

  constructor(type: string, message: string) {
    this.type = type;
    this.message = message;
  }

  toString(): string {
    return `DeezerError: ${this.type}: ${this.message}`;
  }
}

interface IDeezerResponse {
  error?: IDeezerError;
}

interface IDeezerError {
  type: string;
  message: string;
}

interface IDeezerTrack {
  title: string;
  artist: {
    name: string;
  };
  isrc: string;
  link: string;
  duration: number;
}

interface IDeezerList {
  title: string;
  tracks: {
    data: IDeezerTrack[];
  };
}