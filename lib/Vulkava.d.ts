/// <reference types="node" />
import { EventEmitter } from 'events';
import Node from './Node';
import Track from './Track';
import { Player } from '..';
import type { IncomingDiscordPayload, OutgoingDiscordPayload, EventListeners, PlayerOptions, SearchResult, SEARCH_SOURCE, VulkavaOptions } from './@types';
export interface Vulkava {
    once: EventListeners<this>;
    on: EventListeners<this>;
}
/**
 * Represents the main Vulkava client.
 * @extends EventEmitter
 * @prop {Array<Node>} nodes - The lavalink nodes array
 * @prop {String} clientId - The bot id
 * @prop {Map<String, Player>} players - The players map
 */
export declare class Vulkava extends EventEmitter {
    clientId: string;
    nodes: Node[];
    private readonly defaultSearchSource;
    readonly unresolvedSearchSource: SEARCH_SOURCE;
    private readonly appleMusic;
    private readonly deezer;
    private readonly spotify;
    readonly sendWS: (guildId: string, payload: OutgoingDiscordPayload) => void;
    players: Map<string, Player>;
    static checkOptions(options: VulkavaOptions): void;
    /**
     * Create a new Vulkava instance
     * @param {Object} options - The Vulkava options
     * @param {Array<Object>} options.nodes - The lavalink nodes array
     * @param {String} [options.nodes[].id] - The lavalink node identifier
     * @param {String} options.nodes[].hostname - The lavalink node hostname
     * @param {Number} options.nodes[].port - The lavalink node port
     * @param {String} [options.nodes[].password] - The lavalink node password
     * @param {Boolean} [options.nodes[].secure] - Whether the lavalink node uses TLS/SSL or not
     * @param {String} [options.nodes[].region] - The lavalink node region
     * @param {String} [options.nodes[].resumeKey] - The resume key
     * @param {Number} [options.nodes[].resumeTimeout] - The resume timeout, in seconds
     * @param {Number} [options.nodes[].maxRetryAttempts] - The max number of retry attempts
     * @param {Number} [options.nodes[].retryAttemptsInterval] - The interval between retry attempts
     * @param {String} [options.defaultSearchSource] - The default search source
     * @param {String} [options.unresolvedSearchSource] - The unresolved search source
     * @param {Object} [options.spotify] - The spotify credential options
     * @param {String} [options.spotify.clientId] - The spotify client id
     * @param {String} [options.spotify.clientSecret] - The spotify client secret
     * @param {String} [options.spotify.market] - The spotify market
     * @param {Function} options.sendWS - The function to send websocket messages to the main gateway
     */
    constructor(options: VulkavaOptions);
    /**
     * Decodes a track by its base64 string
     * @param {String} encodedTrack - The base64 encoded track
     * @returns {Promise<Track>}
     */
    decodeTrack(encodedTrack: string): Promise<Track>;
    /**
     * Decodes multiple tracks by their base64 string
     * @param {String[]} encodedTracks - The base64 encoded tracks
     * @returns {Promise<Track[]>}
     */
    decodeTracks(encodedTracks: string[]): Promise<Track[]>;
    /**
     * Creates a new player or returns an existing one
     * @param {Object} options - The player options
     * @param {String} options.guildId - The guild id that player belongs to
     * @param {String} options.voiceChannelId - The voice channel id
     * @param {String} [options.textChannelId] - The text channel id
     * @param {Boolean} [options.selfDeaf=false] - Whether the bot joins the voice channel deafened or not
     * @param {Boolean} [options.selfMute=false] - Whether the bot joins the voice channel muted or not
     * @returns {Player}
     */
    createPlayer(options: PlayerOptions): Player;
    /**
     *
     * @param {String} query - The query to search for
     * @param {('youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex')} [source=youtube] - The search source
     * @returns {Promise<SearchResult>}
     */
    search(query: string, source?: SEARCH_SOURCE): Promise<SearchResult>;
    /**
     * Connects to all lavalink nodes
     * @param {String} clientId - The client (BOT) id
     */
    start(clientId: string): void;
    /**
     * Handles voice state & voice server update packets
     * @param payload - The voice packet
     */
    handleVoiceUpdate(payload: IncomingDiscordPayload): void;
}
