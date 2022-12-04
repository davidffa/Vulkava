import { AbstractExternalSource } from './AbstractExternalSource';
import { Vulkava } from '../Vulkava';
import type { SearchResult } from '../@types';
export default class AppleMusic extends AbstractExternalSource {
    static readonly APPLE_MUSIC_REGEX: RegExp;
    private static readonly RENEW_URL;
    private static readonly SCRIPTS_REGEX;
    private static readonly TOKEN_REGEX;
    private static readonly USER_AGENT;
    private token;
    private renewDate;
    constructor(vulkava: Vulkava);
    loadItem(query: string): Promise<SearchResult | null>;
    getMusicVideo(id: string, storefront: string): Promise<SearchResult>;
    getTrack(id: string, storefront: string): Promise<SearchResult>;
    getList(type: 'ALBUM' | 'PLAYLIST', id: string, storefront: string): Promise<SearchResult>;
    getArtistTopTracks(id: string, storefront: string): Promise<SearchResult>;
    private handleErrorResult;
    private buildTrack;
    private makeRequest;
    private renewToken;
}
