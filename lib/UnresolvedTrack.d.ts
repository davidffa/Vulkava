import { Track } from '..';
import { Vulkava } from './Vulkava';
export default class UnresolvedTrack {
    private readonly vulkava;
    readonly title: string;
    readonly author: string;
    readonly duration: number;
    readonly uri: string;
    readonly source: string;
    requester: unknown;
    private readonly isrc;
    constructor(vulkava: Vulkava, title: string, author: string, duration?: number, uri?: string, source?: string, isrc?: string);
    get query(): string;
    build(): Promise<Track>;
    setRequester(requester: unknown): void;
}
