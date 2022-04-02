import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
import { request } from 'undici';

export default class AppleMusic {
  private readonly vulkava: Vulkava;

  private static readonly RENEW_URL = 'https://music.apple.com/us/album/%C3%ADgneo/1604813268';
  private static readonly TOKEN_PAYLOAD_REGEX = /"desktop-music-app\/config\/environment" content="([^"]+)"/;

  private token: string | null;
  private renewDate: number;

  constructor(vulkava: Vulkava) {
    this.vulkava = vulkava;

    this.token = null;
    this.renewDate = 0;
  }

  public async getMusicVideo(id: string, storefront: string): Promise<UnresolvedTrack> {
    const track = await this.makeRequest<IMusicVideoResponse>(`music-videos/${id}`, storefront);

    return this.buildTrack(track.data[0].attributes);
  }

  public async getTrack(id: string, storefront: string): Promise<UnresolvedTrack> {
    const track = await this.makeRequest<ISongsResponse>(`songs/${id}`, storefront);

    return this.buildTrack(track.data[0].attributes);
  }

  public async getAlbum(id: string, storefront: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<IAppleMusicAlbum>(`albums/${id}`, storefront);

    const title = res.data[0].attributes.name;

    let next = res.data[0].relationships.tracks.next;

    for (const it of res.data[0].relationships.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it.attributes));
    }

    while (next && unresolvedTracks.length < 400) {
      const nextRes = await this.makeRequest<ITrackList>(next.split('/').slice(4).join('/'), storefront);

      next = nextRes.next;

      for (const it of nextRes.data) {
        unresolvedTracks.push(this.buildTrack(it.attributes));
      }
    }

    return { title, tracks: unresolvedTracks };
  }

  public async getPlaylist(id: string, storefront: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<IAppleMusicPlaylist>(`playlists/${id}`, storefront);

    const title = res.data[0].attributes.name;

    let next = res.data[0].relationships.tracks.next;

    for (const it of res.data[0].relationships.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it.attributes));
    }

    while (next && unresolvedTracks.length < 400) {
      const nextRes = await this.makeRequest<ITrackList>(next.split('/').slice(4).join('/'), storefront);

      next = nextRes.next;

      for (const it of nextRes.data) {
        unresolvedTracks.push(this.buildTrack(it.attributes));
      }
    }

    return { title, tracks: unresolvedTracks };
  }

  public async getArtistTopTracks(id: string, storefront: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const artistRes = await this.makeRequest<IAppleMusicArtist>(`artists/${id}`, storefront);

    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<ISongsResponse>(`artists/${id}/view/top-songs`, storefront);

    for (const it of res.data) {
      unresolvedTracks.push(this.buildTrack(it.attributes));
    }

    return {
      title: `${artistRes.data[0].attributes.name}'s top tracks`,
      tracks: unresolvedTracks
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

  private async makeRequest<T>(endpoint: string, storefront: string): Promise<T> {
    if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate) await this.renewToken();

    return request(`https://api.music.apple.com/v1/catalog/${storefront}/${endpoint}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
        Authorization: `Bearer ${this.token}`
      }
    }).then(r => r.body.json());
  }

  private async renewToken() {
    const html = await request(AppleMusic.RENEW_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36'
      }
    }).then(r => r.body.text());

    const tokenPayloadMatch = html.match(AppleMusic.TOKEN_PAYLOAD_REGEX);

    if (!tokenPayloadMatch) {
      throw new Error('Could not get Apple Music token payload!');
    }

    const tokenPayload = JSON.parse(decodeURIComponent(tokenPayloadMatch[1]));

    const token = tokenPayload['MEDIA_API']?.token;

    if (!token) {
      throw new Error('Could not get Apple Music token!');
    }

    this.token = token;
    // 6 months but just in case ;)
    this.renewDate = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).exp * 1000;
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

interface IAppleMusicAlbum {
  data: IPlaylistData[];
}

interface ITrackList {
  next?: string;
  data: Array<{
    attributes: IAppleMusicTrack;
  }>;
}

interface IAppleMusicPlaylist {
  data: IPlaylistData[];
}