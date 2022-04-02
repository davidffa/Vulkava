import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
import { request } from 'undici';

export default class Deezer {
  private readonly vulkava: Vulkava;

  constructor(vulkava: Vulkava) {
    this.vulkava = vulkava;
  }

  public async getTrack(id: string): Promise<UnresolvedTrack> {
    const track = await this.makeRequest<IDeezerTrack>(`track/${id}`);

    return this.buildTrack(track);
  }

  public async getAlbum(id: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];

    const res = await this.makeRequest<IDeezerAlbum>(`album/${id}`);

    for (const it of res.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it));
    }

    return { title: res.title, tracks: unresolvedTracks };
  }

  public async getPlaylist(id: string): Promise<{ title: string, tracks: UnresolvedTrack[] }> {
    const unresolvedTracks: UnresolvedTrack[] = [];


    const res = await this.makeRequest<IDeezerPlaylist>(`playlist/${id}`);

    for (const it of res.tracks.data) {
      unresolvedTracks.push(this.buildTrack(it));
    }

    return { title: res.title, tracks: unresolvedTracks };
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

  private async makeRequest<T>(endpoint: string): Promise<T> {
    return request(`https://api.deezer.com/${endpoint}`).then(r => r.body.json());
  }
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

interface IDeezerAlbum {
  title: string;
  tracks: {
    data: IDeezerTrack[];
  };
}

interface IDeezerPlaylist {
  title: string;
  tracks: {
    data: IDeezerTrack[];
  };
}