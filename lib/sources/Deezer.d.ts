import { AbstractExternalSource } from './AbstractExternalSource';
import { Vulkava } from '../Vulkava';
import type { SearchResult } from '../@types';
export default class Deezer extends AbstractExternalSource {
    static readonly DEEZER_REGEX: RegExp;
    constructor(vulkava: Vulkava);
    loadItem(query: string): Promise<SearchResult | null>;
    getTrack(id: string): Promise<SearchResult>;
    getList(type: 'ALBUM' | 'PLAYLIST', id: string): Promise<SearchResult>;
    private handleErrorResult;
    private buildTrack;
    private makeRequest;
}
