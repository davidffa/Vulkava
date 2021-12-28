import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
import fetch from '../utils/Request';

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

  private buildTrack({ title, artist: { name }, link, duration }: IDeezerTrack): UnresolvedTrack {
    return new UnresolvedTrack(
      this.vulkava,
      title,
      name,
      duration * 1000,
      link,
      null
    );
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    return fetch<T>(`https://api.deezer.com/${endpoint}`);
  }

}

interface IDeezerTrack {
  title: string;
  artist: {
    name: string;
  };
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