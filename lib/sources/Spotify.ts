import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
import fetch from '../utils/Request';

export default class Spotify {
  private readonly vulkava: Vulkava;
  private readonly auth: string;

  private readonly market: string;
  private token: string | null;

  private renewDate: number;

  constructor(vulkava: Vulkava, clientId: string, clientSecret: string, market = 'US') {
    this.vulkava = vulkava;
    this.auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    this.market = market;

    this.token = null;
    this.renewDate = 0;
  }

  public async getTrack(id: string): Promise<UnresolvedTrack> {
    const track = await this.makeRequest<ISpotifyTrack>(`tracks/${id}`);

    return this.buildTrack(track);
  }

  public async getAlbum(id: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    let offset = 0;
    let next: boolean;
    let title: string;

    do {
      const res = await this.makeRequest<ISpotifyAlbum>(`albums/${id}/?limit=50&offset=${offset}`);
      title = res.name;
      next = res.tracks.next !== null;

      for (const it of res.tracks.items) {
        unresolvedTracks.push(this.buildTrack(it));
      }

      offset += 50;
    } while (next && unresolvedTracks.length < 400);

    return { title, tracks: unresolvedTracks };
  }

  public async getPlaylist(id: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    let offset = 0;
    let next: boolean;
    let title: string;

    do {
      const res = await this.makeRequest<ISpotifyPlaylist>(`playlists/${id}/?limit=100&offset=${offset}`);
      title = res.name;
      next = res.tracks.next !== null;

      for (const it of res.tracks.items) {
        if (it.track === null) continue;

        unresolvedTracks.push(this.buildTrack(it.track));
      }

      offset += 100;
    } while (next && unresolvedTracks.length < 400);

    return { title, tracks: unresolvedTracks };
  }

  public async getArtistTopTracks(id: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const res = await this.makeRequest<{ tracks: ISpotifyTrack[] }>(`artists/${id}/top-tracks?market=${this.market}`);

    return {
      title: `${res.tracks[0].artists.find(a => a.id === id)?.name ?? ''} Top Tracks`,
      tracks: res.tracks.map(t => this.buildTrack(t))
    };
  }

  private buildTrack({ name, artists, external_urls: { spotify }, duration_ms }: ISpotifyTrack): UnresolvedTrack {
    const artistNames = artists.map(({ name }) => name).join(', ');

    return new UnresolvedTrack(
      this.vulkava,
      name,
      artistNames,
      duration_ms,
      spotify,
      'spotify'
    );
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate) await this.renewToken();

    return fetch<T>(`https://api.spotify.com/v1/${endpoint}`, {
      headers: {
        Authorization: this.token as string,
      }
    });
  }

  private async renewToken() {
    const res = await fetch<IRenewResponse>('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    this.token = `${res.token_type} ${res.access_token}`;
    this.renewDate = Date.now() + res.expires_in * 1000 - 5000;
  }
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
  duration_ms: number;
}

interface ISpotifyAlbum {
  name: string;
  tracks: {
    items: ISpotifyTrack[];
    next: null | string;
  };
}

interface ISpotifyPlaylist {
  name: string;
  tracks: {
    items: Array<{
      track: ISpotifyTrack | null;
    }>;
    next: null | string;
  };
}