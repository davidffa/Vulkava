import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
export default class Spotify {
    private readonly vulkava;
    private readonly auth;
    private token;
    private renewDate;
    constructor(vulkava: Vulkava, clientId: string, clientSecret: string);
    getTrack(id: string): Promise<UnresolvedTrack>;
    getAlbum(id: string): Promise<{
        title: string;
        tracks: UnresolvedTrack[];
    }>;
    getPlaylist(id: string): Promise<{
        title: string;
        tracks: UnresolvedTrack[];
    }>;
    private buildTrack;
    private makeRequest;
    private renewToken;
}
