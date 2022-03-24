import { ITrack } from './@types';

export default class Track {
  public readonly identifier: string;
  private readonly thumbnailUrl?: string;
  public readonly isSeekable: boolean;
  public readonly author: string;
  public readonly duration: number;
  public readonly isStream: boolean;
  public readonly source: string;
  public position?: number;
  public readonly title: string;
  public readonly uri: string;

  public encodedTrack: string;

  public requester: unknown;

  constructor(data: ITrack) {
    this.identifier = data.info.identifier;
    this.thumbnailUrl = `https://img.youtube.com/vi/${data.info.identifier}/sddefault.jpg`;
    this.isSeekable = data.info.isSeekable;
    this.author = data.info.author;
    this.duration = data.info.length;
    this.isStream = data.info.isStream;
    this.source = data.info.sourceName ?? 'unknown';
    this.position = data.info.position;
    this.title = data.info.title;
    this.uri = data.info.uri;

    this.encodedTrack = data.track;
  }

  get thumbnail(): string | null {
    if (this.thumbnailUrl) return this.thumbnailUrl;

    if (this.source === 'youtube') {
      return `https://img.youtube.com/vi/${this.identifier}/sddefault.jpg`;
    }

    return null;
  }

  public setRequester(requester: unknown): void {
    this.requester = requester;
  }
}
