"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vulkava = void 0;
const events_1 = require("events");
const Node_1 = __importStar(require("./Node"));
const Track_1 = __importDefault(require("./Track"));
const __1 = require("..");
const AbstractExternalSource_1 = require("./sources/AbstractExternalSource");
const AppleMusic_1 = __importDefault(require("./sources/AppleMusic"));
const Deezer_1 = __importDefault(require("./sources/Deezer"));
const Spotify_1 = __importDefault(require("./sources/Spotify"));
/**
 * Represents the main Vulkava client.
 * @extends EventEmitter
 * @prop {Array<Node>} nodes - The lavalink nodes array
 * @prop {String} clientId - The bot id
 * @prop {Map<String, Player>} players - The players map
 */
class Vulkava extends events_1.EventEmitter {
    clientId;
    nodes;
    defaultSearchSource;
    unresolvedSearchSource;
    useISRC;
    externalSources;
    sendWS;
    // guildId <-> Player
    players;
    lastNodeSorting;
    static checkOptions(options) {
        if (typeof options !== 'object') {
            throw new TypeError('VulkavaOptions must be an object');
        }
        if (!options.nodes) {
            throw new TypeError('VulkavaOptions must contain a nodes property');
        }
        if (!Array.isArray(options.nodes)) {
            throw new TypeError('VulkavaOptions.nodes must be an array');
        }
        if (options.nodes.length === 0) {
            throw new TypeError('VulkavaOptions.nodes must contain at least one node');
        }
        if (!options.sendWS || typeof options.sendWS !== 'function') {
            throw new TypeError('VulkavaOptions.sendWS must be a function');
        }
        if (options.disabledSources && typeof options.disabledSources !== 'object' && !Array.isArray(options.disabledSources)) {
            throw new TypeError('VulkavaOptions.disabledSources must be an array');
        }
        if (options.useISRC && typeof options.useISRC !== 'boolean') {
            throw new TypeError('VulkavaOptions.useISRC must be a boolean');
        }
    }
    /**
     * Create a new Vulkava instance
     * @param {Object} options - The Vulkava options
     * @param {Array<Object>} options.nodes - The lavalink nodes array
     * @param {String} [options.nodes[].id] - The lavalink node identifier
     * @param {String} options.nodes[].hostname - The lavalink node hostname
     * @param {Number} options.nodes[].port - The lavalink node port
     * @param {String} [options.nodes[].password] - The lavalink node password
     * @param {Boolean} [options.nodes[].secure] - Whether the lavalink node uses TLS/SSL or not
     * @param {Boolean} [options.nodes[].followRedirects] - Whether to follow redirects or not (default is false)
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
     * @param {Array<String>} [options.disabledSources] - Disables, apple music, deezer or spotify
     * @param {Boolean} [options.useISRC] - Whether to use ISRC to resolve tracks or not
     * @param {Function} options.sendWS - The function to send websocket messages to the main gateway
     */
    constructor(options) {
        super();
        Vulkava.checkOptions(options);
        this.nodes = [];
        this.defaultSearchSource = options.defaultSearchSource ?? 'youtube';
        this.unresolvedSearchSource = options.unresolvedSearchSource ?? 'youtube';
        this.useISRC = options.useISRC ?? true;
        this.externalSources = [];
        if (options.disabledSources) {
            if (!options.disabledSources.includes('APPLE_MUSIC'))
                this.externalSources.push(new AppleMusic_1.default(this));
            if (!options.disabledSources.includes('DEEZER'))
                this.externalSources.push(new Deezer_1.default(this));
            if (!options.disabledSources.includes('SPOTIFY'))
                this.externalSources.push(new Spotify_1.default(this, options.spotify?.clientId, options.spotify?.clientSecret, options.spotify?.market));
        }
        else {
            this.externalSources = [
                new AppleMusic_1.default(this),
                new Deezer_1.default(this),
                new Spotify_1.default(this, options.spotify?.clientId, options.spotify?.clientSecret, options.spotify?.market)
            ];
        }
        this.sendWS = options.sendWS;
        this.players = new Map();
        for (const nodeOp of options.nodes) {
            const node = new Node_1.default(this, nodeOp);
            this.nodes.push(node);
        }
        this.lastNodeSorting = 0;
    }
    get bestNode() {
        if (Date.now() < this.lastNodeSorting + 30000) {
            if (this.nodes[0].state === Node_1.NodeState.CONNECTED) {
                return this.nodes[0];
            }
            this.lastNodeSorting = 0;
            return this.bestNode;
        }
        this.nodes = this.nodes.sort((a, b) => a.totalPenalties - b.totalPenalties);
        const node = this.nodes[0];
        this.lastNodeSorting = Date.now();
        if (!node || node.state !== Node_1.NodeState.CONNECTED) {
            throw new Error('No connected nodes!');
        }
        return node;
    }
    /**
     * Adds an external source that produces a SearchResult with UnresolvedTracks
     * @param {AbstractExternalSource} extSource - The external source
     */
    addExternalSource(extSource) {
        if (extSource instanceof AbstractExternalSource_1.AbstractExternalSource) {
            throw new Error(`${extSource.constructor.name} must extend AbstractExternalSource`);
        }
        this.externalSources.push(extSource);
    }
    /**
     * Decodes a track by its base64 string
     * @param {String} encodedTrack - The base64 encoded track
     * @returns {Promise<Track>}
     */
    async decodeTrack(encodedTrack) {
        const node = this.bestNode;
        const trackInfo = await node.rest.decodeTrack(encodedTrack);
        return new Track_1.default({ track: encodedTrack, info: { ...trackInfo } });
    }
    /**
     * Decodes multiple tracks by their base64 string
     * @param {String[]} encodedTracks - The base64 encoded tracks
     * @returns {Promise<Track[]>}
     */
    async decodeTracks(encodedTracks) {
        const node = this.bestNode;
        const res = await node.rest.decodeTracks(encodedTracks);
        return res.map(it => new Track_1.default(it));
    }
    /**
     * Creates a new player or returns an existing one
     * @param {Object} options - The player options
     * @param {String} options.guildId - The guild id that player belongs to
     * @param {String} options.voiceChannelId - The voice channel id
     * @param {String} [options.textChannelId] - The text channel id
     * @param {Boolean} [options.selfDeaf=false] - Whether the bot joins the voice channel deafened or not
     * @param {Boolean} [options.selfMute=false] - Whether the bot joins the voice channel muted or not
     * @param {AbstractQueue} [options.queue] - The queue for this player
     * @returns {Player}
     */
    createPlayer(options) {
        let player = this.players.get(options.guildId);
        if (player) {
            return player;
        }
        player = new __1.Player(this, options);
        this.players.set(options.guildId, player);
        return player;
    }
    /**
     *
     * @param {String} query - The query to search for
     * @param {('youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex')} [source=youtube] - The search source
     * @returns {Promise<SearchResult>}
     */
    async search(query, source = this.defaultSearchSource) {
        if (typeof query !== 'string') {
            throw new TypeError('Search query must be a non-empty string');
        }
        for (const source of this.externalSources) {
            const loadRes = await source.loadItem(query);
            if (loadRes)
                return loadRes;
        }
        const sourceMap = {
            youtube: 'ytsearch:',
            youtubemusic: 'ytmsearch:',
            soundcloud: 'scsearch:',
            odysee: 'odsearch:',
            yandex: 'ymsearch:'
        };
        if (!query.startsWith('https://') && !query.startsWith('http://')) {
            query = `${sourceMap[source] || 'ytsearch:'}${query}`;
        }
        const node = this.bestNode;
        const res = await node.rest.loadTracks(query);
        if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') {
            return res;
        }
        else {
            const tracks = res.tracks.map(t => new Track_1.default(t));
            if (res.loadType === 'PLAYLIST_LOADED') {
                res.playlistInfo.duration = tracks.reduce((acc, cur) => acc + cur.duration, 0);
            }
            return {
                ...res,
                tracks
            };
        }
    }
    /**
     * Connects to all lavalink nodes
     * @param {String} clientId - The client (BOT) id
     */
    start(clientId) {
        if (typeof clientId !== 'string') {
            throw new TypeError('clientId must be a string');
        }
        this.clientId = clientId;
        for (const node of this.nodes) {
            node.connect();
        }
    }
    /**
     * Handles voice state & voice server update packets
     * @param payload - The voice packet
     */
    handleVoiceUpdate(payload) {
        if (payload.op !== 0 || !payload.d.guild_id)
            return;
        const player = this.players.get(payload.d.guild_id);
        if (!player)
            return;
        if (payload.t === 'VOICE_STATE_UPDATE') {
            const packet = payload;
            if (packet.d.user_id !== this.clientId || !packet.d.channel_id)
                return;
            player.voiceChannelId = packet.d.channel_id;
            if (player.voiceState.sessionId === packet.d.session_id)
                return;
            player.voiceState.sessionId = packet.d.session_id;
            this.emit('debug', `Received voiceStateUpdate from discord gateway for player ${player.guildId}. Voice channel id: ${player.voiceChannelId}. SessionID: ${player.voiceState.sessionId}`);
            if (player.voiceState.event) {
                player.sendVoiceUpdate();
            }
        }
        else if (payload.t === 'VOICE_SERVER_UPDATE') {
            const packet = payload;
            // Sometimes discord sends a partial voice server update packet, with null endpoint
            // Just wait for a new one I guess ?
            if (!packet.d.endpoint) {
                return;
            }
            player.voiceState.event = {
                ...packet.d
            };
            // A node should be assigned to the player on Player#connect()
            if (player.node === null) {
                player.state = __1.ConnectionState.DISCONNECTED;
                throw new Error('Assertion failed. The Player does not have a node.');
            }
            this.emit('debug', `Received voiceServerUpdate from discord gateway for player ${player.guildId}. Endpoint: ${player.voiceState.event.endpoint}. Token: ${player.voiceState.event.token}`);
            if (['us', 'brazil', 'buenos-aires'].some(loc => packet.d.endpoint.startsWith(loc))) {
                if (player.node.options.region && player.node.options.region !== 'USA') {
                    const usaNodes = this.nodes.filter(node => node.options.region === 'USA' && node.state === Node_1.NodeState.CONNECTED);
                    if (usaNodes.length) {
                        // Nodes are already sorted by penalties
                        player.moveNode(usaNodes[0]);
                        return;
                    }
                }
            }
            else if (player.node.options.region && player.node.options.region !== 'EU') {
                const europeNodes = this.nodes.filter(node => node.options.region === 'EU' && node.state === Node_1.NodeState.CONNECTED);
                if (europeNodes.length) {
                    // Nodes are already sorted by penalties
                    player.moveNode(europeNodes[0]);
                    return;
                }
            }
            if (player.voiceState.sessionId) {
                player.sendVoiceUpdate();
            }
        }
    }
}
exports.Vulkava = Vulkava;
