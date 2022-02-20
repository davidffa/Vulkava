import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
export default class AppleMusic {
    private readonly vulkava;
    private static readonly RENEW_URL;
    private static readonly TOKEN_PAYLOAD_REGEX;
    private token;
    private renewDate;
    constructor(vulkava: Vulkava);
    getTrack(id: string, storefront: string): Promise<UnresolvedTrack>;
    getAlbum(id: string, storefront: string): Promise<{
        title: string;
        tracks: UnresolvedTrack[];
    }>;
    getPlaylist(id: string, storefront: string): Promise<{
        title: string;
        tracks: UnresolvedTrack[];
    }>;
    getArtistTopTracks(id: string, storefront: string): Promise<{
        title: string;
        tracks: UnresolvedTrack[];
    }>;
    private buildTrack;
    private makeRequest;
    private renewToken;
}
