import UnresolvedTrack from '../UnresolvedTrack';
import { Vulkava } from '../Vulkava';
export default class Deezer {
    private readonly vulkava;
    constructor(vulkava: Vulkava);
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
}
