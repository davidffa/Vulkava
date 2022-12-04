import { request } from 'undici';

import { AbstractExternalSource } from './AbstractExternalSource';
import { Vulkava } from '../Vulkava';
import UnresolvedTrack from '../UnresolvedTrack';

import type { PlaylistInfo, SearchResult } from '../@types';

export default class AppleMusic extends AbstractExternalSource {
  public static readonly APPLE_MUSIC_REGEX = /^(?:https?:\/\/|)?(?:music\.)?apple\.com\/(?<storefront>[a-z]{2})\/(?<type>album|playlist|artist|music-video)(?:\/[^/]+)?\/(?<id>[^/?]+)(?:\?i=(?<albumtrackid>\d+))?/;
  private static readonly RENEW_URL = 'https://music.apple.com';
  private static readonly SCRIPTS_REGEX = /<script type="module" .+ src="(?<endpoint>\/assets\/index\..+\.js)">/g;
  private static readonly TOKEN_REGEX = /const \w{2}="(?<token>ey[\w.-]+)"/;

  private static readonly USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36';

  private token: string | null;
  private renewDate: number;

  constructor(vulkava: Vulkava) {
    super(vulkava);

    this.token = null;
    this.renewDate = 0;
  }

  public async loadItem(query: string): Promise<SearchResult | null> {
    const appleMusicMatch = query.match(AppleMusic.APPLE_MUSIC_REGEX);
    if (!appleMusicMatch || !appleMusicMatch.groups) return null;

    const storefront = appleMusicMatch.groups['storefront'];

    switch (appleMusicMatch.groups['type']) {
      case 'music-video':
        return this.getMusicVideo(appleMusicMatch.groups['id'], storefront);
      case 'album':
        if (appleMusicMatch[4]) {
          return this.getTrack(appleMusicMatch.groups['albumtrackid'], storefront);
        } else {
          return this.getList('ALBUM', appleMusicMatch.groups['id'], storefront);
        }
      case 'playlist':
        return this.getList('PLAYLIST', appleMusicMatch.groups['id'], storefront);
      case 'artist':
        return this.getArtistTopTracks(appleMusicMatch.groups['id'], storefront);
    }

    return null;
  }

  public async getMusicVideo(id: string, storefront: string): Promise<SearchResult> {
    const res = await this.makeRequest<IMusicVideoResponse>(`music-videos/${id}`, storefront);

    if (res instanceof AppleMusicError) {
      return this.handleErrorResult(res);
    }

    return {
      loadType: 'TRACK_LOADED',
      playlistInfo: {} as PlaylistInfo,
      tracks: [this.buildTrack(res.data[0].attributes)],
    };
  }

  public async getTrack(id: string, storefront: string): Promise<SearchResult> {
    const res = await this.makeRequest<ISongsResponse>(`songs/${id}`, storefront);

    if (res instanceof AppleMusicError) {
      return this.handleErrorResult(res);
    }

    return {
      loadType: 'TRACK_LOADED',
      playlistInfo: {} as PlaylistInfo,
      tracks: [this.buildTrack(res.data[0].attributes)],
    };
  }

  public async getList(type: 'ALBUM' | 'PLAYLIST', id: string, storefront: string): Promise<SearchResult> {
    const unresolvedTracks: UnresolvedTrack[] = [];
    const res = await this.makeRequest<IAppleMusicList>(`${type === 'ALBUM' ? 'albums' : 'playlists'}/${id}`, storefront);

    if (res instanceof AppleMusicError) {
      return this.handleErrorResult(res);
    }

    const title = res.data[0].attributes.name;
    let next = res.data[0].relationships.tracks.next;

    for (const it of res.data[0].relationships.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it.attributes));
    }

    while (next && unresolvedTracks.length < 400) {
      const nextRes = await this.makeRequest<ITrackList>(next.split('/').slice(4).join('/'), storefront);

      if (nextRes instanceof AppleMusicError) {
        return this.handleErrorResult(nextRes);
      }

      next = nextRes.next;

      for (const it of nextRes.data) {
        unresolvedTracks.push(this.buildTrack(it.attributes));
      }
    }

    return {
      loadType: 'PLAYLIST_LOADED',
      playlistInfo: {
        name: title,
        duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
        selectedTrack: 0
      },
      tracks: unresolvedTracks,
    };
  }

  public async getArtistTopTracks(id: string, storefront: string): Promise<SearchResult> {
    const artistRes = await this.makeRequest<IAppleMusicArtist>(`artists/${id}`, storefront);

    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<ISongsResponse>(`artists/${id}/view/top-songs`, storefront);

    if (res instanceof AppleMusicError) {
      return this.handleErrorResult(res);
    }

    if (artistRes instanceof AppleMusicError) {
      return this.handleErrorResult(artistRes);
    }

    for (const it of res.data) {
      unresolvedTracks.push(this.buildTrack(it.attributes));
    }

    return {
      loadType: 'PLAYLIST_LOADED',
      playlistInfo: {
        name: `${artistRes.data[0].attributes.name}'s top tracks`,
        duration: unresolvedTracks.reduce((acc, curr) => acc + curr.duration, 0),
        selectedTrack: 0
      },
      tracks: unresolvedTracks
    };
  }

  private handleErrorResult(error: AppleMusicError): SearchResult {
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

  private buildTrack({ name, artistName, url, durationInMillis, isrc }: IAppleMusicTrack): UnresolvedTrack {
    return new UnresolvedTrack(
      this.vulkava,
      name,
      artistName,
      durationInMillis,
      url,
      'apple-music',
      isrc
    );
  }

  private async makeRequest<T>(endpoint: string, storefront: string): Promise<T | AppleMusicError> {
    if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate) await this.renewToken();

    const res = await request(`https://api.music.apple.com/v1/catalog/${storefront}/${endpoint}`, {
      headers: {
        'User-Agent': AppleMusic.USER_AGENT,
        Authorization: `Bearer ${this.token}`,
        'Origin': 'https://apple.com'
      }
    });

    if (res.statusCode === 200) {
      return res.body.json();
    } else {
      return new AppleMusicError(await res.body.json());
    }
  }

  private async renewToken() {
    const html: string = await request(AppleMusic.RENEW_URL + '/us/browse', {
      headers: {
        'User-Agent': AppleMusic.USER_AGENT
      },
    }).then(r => r.body.text());

    const scriptsMatch = [...html.matchAll(AppleMusic.SCRIPTS_REGEX)];

    if (!scriptsMatch.length) {
      throw new Error('Could not get Apple Music token scripts!');
    }

    for (const scriptMatch of scriptsMatch) {
      const script = await request(`${AppleMusic.RENEW_URL}${scriptMatch[1]}`, {
        headers: {
          'User-Agent': AppleMusic.USER_AGENT
        }
      }).then(r => r.body.text());

      const tokenMatch = script.match(AppleMusic.TOKEN_REGEX);

      if (tokenMatch) {
        this.token = tokenMatch.groups['token'];
        break;
      }
    }

    console.log(this.token);

    if (!this.token) {
      throw new Error('Could not get Apple Music token!');
    }

    // 2 months but just in case ;)
    this.renewDate = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString()).exp * 1000;
  }
}

class AppleMusicError implements IAppleMusicError {
  readonly title: string;
  readonly detail: string;

  constructor(errorRes: IErrorResponse) {
    this.title = errorRes.errors[0].title;
    this.detail = errorRes.errors[0].detail;
  }

  toString(): string {
    return `AppleMusicError: ${this.detail ?? this.title}`;
  }
}

interface IAppleMusicTrack {
  name: string;
  artistName: string;
  isrc: string;
  url: string;
  durationInMillis: number;
}

interface IMusicVideoData {
  attributes: IAppleMusicTrack;
}

interface IMusicVideoResponse {
  data: IMusicVideoData[];
}

interface IAppleMusicError {
  title: string;
  detail: string;
}
interface IErrorResponse {
  errors: IAppleMusicError[];
}

interface IAppleMusicArtist {
  data: Array<{
    attributes: {
      name: string;
    }
  }>;
}

interface ISongsResponse {
  data: Array<{
    attributes: IAppleMusicTrack;
  }>;
}

interface IPlaylistData {
  attributes: {
    name: string;
  };
  relationships: {
    tracks: {
      next?: string;
      data: Array<{
        attributes: IAppleMusicTrack;
      }>;
    };
  };
}

interface IAppleMusicList {
  data: IPlaylistData[];
}

interface ITrackList {
  next?: string;
  data: Array<{
    attributes: IAppleMusicTrack;
  }>;
}