import { ITrack } from './@types';

export default class Track {
  public identifier: string;
  private thumbnailUrl?: string;
  public isSeekable: boolean;
  public author: string;
  public length: number;
  public isStream: boolean;
  public source: string;
  public position: number;
  public title: string;
  public uri: string;

  public encodedTrack: string;

  public requester: unknown;

  constructor(data: ITrack) {
    this.identifier = data.info.identifier;
    if (data.info.thumbnail) this.thumbnailUrl = data.info.thumbnail;
    this.isSeekable = data.info.isSeekable;
    this.author = data.info.author;
    this.length = data.info.length;
    this.isStream = data.info.isStream;
    this.source = data.info.source ?? data.info.sourceName ?? 'unknown';
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