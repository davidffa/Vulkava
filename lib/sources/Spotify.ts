import { request } from 'undici';

import { AbstractExternalSource } from './AbstractExternalSource';
import { Vulkava } from '../Vulkava';
import UnresolvedTrack from '../UnresolvedTrack';

import type { PlaylistInfo, SearchResult } from '../@types';

export default class Spotify extends AbstractExternalSource {
  public static readonly SPOTIFY_REGEX = /^(?:https?:\/\/(?:open\.)?spotify\.com|spotify)[/:](?<type>track|album|playlist|artist)[/:](?<id>[a-zA-Z0-9]+)/;

  private readonly auth: string | null;

  private readonly market: string;
  private token: string | null;

  private renewDate: number;

  constructor(vulkava: Vulkava, clientId?: string, clientSecret?: string, market = 'US') {
    super(vulkava);

    if (clientId && clientSecret) {
      this.auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    } else {
      this.auth = null;
    }

    this.market = market;

    this.token = null;
    this.renewDate = 0;
  }

  public async loadItem(query: string): Promise<SearchResult | null> {
    const spotifyMatch = query.match(Spotify.SPOTIFY_REGEX);
    if (!spotifyMatch || !spotifyMatch.groups) return null;

    switch (spotifyMatch.groups['type']) {
      case 'track':
        return this.getTrack(spotifyMatch.groups['id']);
      case 'album':
        return this.getAlbum(spotifyMatch.groups['id']);
      case 'playlist':
        return this.getPlaylist(spotifyMatch.groups['id']);
      case 'artist':
        return this.getArtistTopTracks(spotifyMatch.groups['id']);
    }

    return null;
  }

  public async getTrack(id: string): Promise<SearchResult> {
    const res = await this.makeRequest<ISpotifyTrack>(`tracks/${id}`);

    if (res instanceof SpotifyError) {
      return this.handleErrorResult(res);
    }

    return {
      loadType: 'TRACK_LOADED',
      playlistInfo: {} as PlaylistInfo,
      tracks: [this.buildTrack(res)],
    };
  }

  public async getAlbum(id: string): Promise<SearchResult> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    let res: ISpotifyAlbum | ISpotifyAlbumTracks | SpotifyError = await this.makeRequest<ISpotifyAlbum>(`albums/${id}`);

    if (res instanceof SpotifyError) {
      return this.handleErrorResult(res);
    }

    const title = res.name;

    for (const it of res.tracks.items) {
      if (it === null) continue;

      unresolvedTracks.push(this.buildTrack(it));
    }

    let next = res.tracks.next !== null;
    let offset = 50;

    while (next && unresolvedTracks.length < 400) {
      res = await this.makeRequest<ISpotifyAlbumTracks>(`albums/${id}/tracks?offset=${offset}`);

      if (res instanceof SpotifyError) {
        return this.handleErrorResult(res);
      }

      next = res.next !== null;

      for (const it of res.items) {
        unresolvedTracks.push(this.buildTrack(it));
      }

      offset += 50;
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

  public async getPlaylist(id: string): Promise<SearchResult> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    let res: ISpotifyPlaylist | ISpotifyPlaylistTracks | SpotifyError = await this.makeRequest<ISpotifyPlaylist>(`playlists/${id}`);

    if (res instanceof SpotifyError) {
      return this.handleErrorResult(res);
    }

    const title = res.name;

    for (const it of res.tracks.items) {
      if (it.track === null) continue;

      unresolvedTracks.push(this.buildTrack(it.track));
    }

    let next = res.tracks.next !== null;
    let offset = 100;

    while (next && unresolvedTracks.length < 400) {
      res = await this.makeRequest<ISpotifyPlaylistTracks>(`playlists/${id}/tracks?offset=${offset}`);

      if (res instanceof SpotifyError) {
        return this.handleErrorResult(res);
      }

      next = res.next !== null;

      for (const it of res.items) {
        if (it.track === null) continue;

        unresolvedTracks.push(this.buildTrack(it.track));
      }

      offset += 100;
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

  public async getArtistTopTracks(id: string): Promise<SearchResult> {
    const res = await this.makeRequest<{ tracks: ISpotifyTrack[] }>(`artists/${id}/top-tracks?market=${this.market}`);

    if (res instanceof SpotifyError) {
      return this.handleErrorResult(res);
    }

    const tracks = res.tracks.map(t => this.buildTrack(t));

    return {
      loadType: 'PLAYLIST_LOADED',
      playlistInfo: {
        name: `${res.tracks[0].artists.find(a => a.id === id)?.name ?? ''} Top Tracks`,
        duration: tracks.reduce((acc, curr) => acc + curr.duration, 0),
        selectedTrack: 0
      },
      tracks: tracks
    };
  }

  private handleErrorResult(error: SpotifyError): SearchResult {
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

  private buildTrack({ name, artists, external_urls: { spotify }, external_ids, duration_ms }: ISpotifyTrack): UnresolvedTrack {
    const artistNames = artists.map(({ name }) => name).join(', ');

    return new UnresolvedTrack(
      this.vulkava,
      name,
      artistNames,
      duration_ms,
      spotify,
      'spotify',
      external_ids?.isrc
    );
  }

  private async makeRequest<T>(endpoint: string): Promise<T | SpotifyError> {
    if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate) await this.renewToken();

    const res = await request(`https://api.spotify.com/v1/${endpoint}`, {
      headers: {
        Authorization: this.token as string,
      }
    }).then(r => r.body.json());

    if (res.error) {
      return new SpotifyError(res.error.message);
    }

    return res;
  }

  private async renewToken() {
    if (this.auth) {
      await this.getToken();
    } else {
      await this.getAnonymousToken();
    }
  }

  private async getAnonymousToken() {
    const { accessToken, accessTokenExpirationTimestampMs } = await request('https://open.spotify.com/get_access_token?reason=transport&productType=embed', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36'
      }
    }).then(r => r.body.json() as Promise<IAnonymousTokenResponse>);

    if (!accessToken) throw new Error('Failed to get anonymous token on Spotify.');

    this.token = `Bearer ${accessToken}`;
    this.renewDate = accessTokenExpirationTimestampMs - 5000;
  }

  private async getToken() {
    const {
      token_type,
      access_token,
      expires_in
    } = await request('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(r => r.body.json() as Promise<IRenewResponse>);

    this.token = `${token_type} ${access_token}`;
    this.renewDate = Date.now() + expires_in * 1000 - 5000;
  }
}

class SpotifyError implements ISpotifyError {
  readonly message: string;

  constructor(error: string) {
    this.message = error;
  }

  toString(): string {
    return `SpotifyError: ${this.message}`;
  }
}

interface ISpotifyError {
  message: string;
}

interface IAnonymousTokenResponse {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
}
interface IRenewResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

interface ISpotifyTrack {
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  external_urls: {
    spotify: string;
  };
  external_ids?: {
    isrc: string;
  }
  duration_ms: number;
}

interface ISpotifyAlbumTracks {
  items: ISpotifyTrack[];
  next: null | string;
}

interface ISpotifyAlbum {
  name: string;
  tracks: ISpotifyAlbumTracks;
}

interface ISpotifyPlaylistTracks {
  items: Array<{
    track: ISpotifyTrack | null;
  }>;
  next: null | string;
}
interface ISpotifyPlaylist {
  name: string;
  tracks: ISpotifyPlaylistTracks;
}