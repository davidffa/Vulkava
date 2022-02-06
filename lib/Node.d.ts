import { Vulkava } from './Vulkava';
import { HTTPMethods } from './utils/Request';
import type { NodeOptions, NodeStats, RoutePlannerStatus, Versions } from './@types';
export declare enum NodeState {
    CONNECTING = 0,
    CONNECTED = 1,
    DISCONNECTED = 2
}
/**
 * Represents a lavalink Node structure.
 * @prop {State} state - The node state (CONNECTING, CONNECTED, DISCONNECTED)
 * @prop {Object} stats - The node stats
 * @prop {Object | null} versions - The lavalink node versions
 */
export default class Node {
    private resumed?;
    private readonly vulkava;
    readonly options: NodeOptions;
    private ws;
    retryAttempts: number;
    state: NodeState;
    stats: NodeStats;
    /** Version object for the node (undefined if lavalink does not support) */
    versions?: Versions;
    static checkOptions(options: NodeOptions): void;
    /**
     * Create a new Vulkava instance
     * @param {Vulkava} vulkava - The Vulkava instance
     * @param {Object} options - The node options
     * @param {String} [options.id] - The lavalink node identifier
     * @param {String} options.hostname - The lavalink node hostname
     * @param {Number} options.port - The lavalink node port
     * @param {String} [options.password] - The lavalink node password
     * @param {Boolean} [options.secure] - Whether the lavalink node uses TLS/SSL or not
     * @param {String} [options.region] - The lavalink node region
     * @param {String} [options.resumeKey] - The resume key
     * @param {Number} [options.resumeTimeout] - The resume timeout, in seconds
     * @param {Number} [options.maxRetryAttempts] - The max number of reconnect attempts
     * @param {Number} [options.retryAttemptsInterval] - The interval between reconnect attempts, in milliseconds
     */
    constructor(vulkava: Vulkava, options: NodeOptions);
    get identifier(): string;
    connect(): void;
    disconnect(): void;
    /** Fetches versions from lavalink Node */
    private fetchVersions;
    /**
     * Gets the route planner status
     * @returns {Promise<Object>}
     */
    getRoutePlannerStatus(): Promise<RoutePlannerStatus>;
    /**
     * Unmarks a failed address
     * @param {String} address - The address to unmark
     */
    unmarkFailedAddress(address: string): Promise<unknown>;
    /**
     * Unmarks all failed address
     */
    unmarkAllFailedAddress(): Promise<unknown>;
    /**
     * Gets the node ws connection latency or the latency between discord gateway & lavalink if guildId param provided.
     * @param {String} [guildId]
     * @returns {Promise<Number>}
     */
    ping(guildId?: string): Promise<number>;
    send(payload: Record<string, unknown>): void;
    private setupResuming;
    private pollTrack;
    private handlePlayerEvent;
    private handleTrackStart;
    private handleTrackEnd;
    private handleTrackStuck;
    private handleTrackExeption;
    private handleWSClose;
    private open;
    private message;
    private error;
    private close;
    private upgrade;
    request<T>(method: HTTPMethods, endpoint: string, body?: Record<string, unknown> | Array<unknown>): Promise<T>;
}
