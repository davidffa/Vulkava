/// <reference types="node" />
import Node from '../Node';
import { Info, ITrack, LoadTracksResult, RequestOptions, RoutePlannerStatus, TrackInfo, UpdatePlayerOptions, Versions } from '../@types';
export declare class RESTManager {
    #private;
    private readonly node;
    private readonly baseUrl;
    set sessionId(sessionId: string);
    constructor(node: Node);
    decodeTrack(encodedTrack: string): Promise<TrackInfo>;
    decodeTracks(encodedTracks: string[]): Promise<ITrack[]>;
    deleteRecord(guildId: string, id: string): Promise<void>;
    deleteRecords(guildId: string): Promise<void>;
    getRecord(guildId: string, id: string): Promise<Buffer>;
    getRecords(guildId: string): Promise<string[]>;
    getRoutePlannerStatus(): Promise<RoutePlannerStatus>;
    freeRoutePlannerAddress(address: string): Promise<void>;
    freeAllRoutePlannerAddresses(): Promise<void>;
    loadTracks(identifier: string): Promise<LoadTracksResult>;
    updateSession(resumeKey: string, timeout?: number): Promise<void>;
    destroyPlayer(guildId: string): Promise<void>;
    updatePlayer(guildId: string, options: UpdatePlayerOptions): Promise<void>;
    info(): Promise<Info>;
    version(): Promise<string>;
    versions(): Promise<Versions>;
    request<T = unknown>(options: RequestOptions): Promise<T>;
}
