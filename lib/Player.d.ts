import { Node, Vulkava, AbstractQueue } from '..';
import { PlayerOptions, PlayerState, PlayOptions, VoiceState } from './@types';
import Filters from './Filters';
import Recorder from './Recorder';
import Track from './Track';
export declare enum ConnectionState {
    CONNECTING = 0,
    CONNECTED = 1,
    DISCONNECTED = 2
}
/**
 * Represents a Player structure
 * @prop {Node} node - The node that this player is connected to
 * @prop {Filters} filters - The filters instance of this player
 * @prop {String} guildId - The guild id of this player
 * @prop {String} voiceChannelId - The voice channel id of this player
 * @prop {String} [textChannelId] - The text channel id of this player
 * @prop {Boolean} [selfMute] - Whether or not this player is muted
 * @prop {Boolean} [selfDeaf] - Whether or not this player is deafened
 * @prop {Track | null} current - The current track of this player
 * @prop {AbstractQueue} queue - The queue of this player
 * @prop {Boolean} trackRepeat - Whether to repeat the current track
 * @prop {Boolean} queueRepeat - Whether to repeat the queue
 * @prop {Boolean} playing - Whether this player is playing or not
 * @prop {Boolean} paused - Whether this player is paused or not
 * @prop {State} state - The state of this player (CONNECTING, CONNECTED, DISCONNECTED)
 * @prop {Object} voiceState - The player voicestate
 */
export default class Player {
    private readonly vulkava;
    node: Node | null;
    readonly guildId: string;
    readonly filters: Filters;
    private connectTimeout?;
    private recorderObj?;
    voiceChannelId: string;
    textChannelId?: string | null;
    selfDeaf?: boolean;
    selfMute?: boolean;
    current: Track | null;
    queue: AbstractQueue;
    queueRepeat: boolean;
    trackRepeat: boolean;
    position: number;
    private positionTimestamp;
    playing: boolean;
    paused: boolean;
    state: ConnectionState;
    voiceState: VoiceState;
    moving: boolean;
    static checkOptions(options: PlayerOptions): void;
    /**
     * Create a new Player instance
     * @param {Vulkava} vulkava - The vulkava instance
     * @param {Object} options - The player options
     * @param {String} options.guildId - The guild id of this player
     * @param {String} options.voiceChannelId - The voice channel id of this player
     * @param {String} [options.textChannelId] - The text channel id of this player
     * @param {Boolean} [options.selfMute] - Whether or not this player is muted
     * @param {Boolean} [options.selfDeaf] - Whether or not this player is deafened
     * @param {AbstractQueue} [options.queue] - The queue for this player
     */
    constructor(vulkava: Vulkava, options: PlayerOptions);
    get recorder(): Recorder;
    /**
     * Gets the exact track position based on the last playerUpdate packet
     */
    get exactPosition(): number;
    /**
     * Gets the queue duration in milliseconds
     * @deprecated - Use `queue.duration` instead
     */
    get queueDuration(): number;
    /**
     * Gets the volume of the player
     */
    get volume(): number;
    /**
     * Assigns a Node to this player
     * @private
     */
    private assignNode;
    /**
     * Connects to the voice channel
     */
    connect(): void;
    /**
     * Disconnects from the voice channel
     */
    disconnect(): void;
    /**
     * Destroys the player
     */
    destroy(): void;
    /**
     * @param {Node} node - The target node to move the player
     */
    moveNode(node: Node): void;
    /**
     * Gets the latency between discord voice gateway & lavalink node.
     * @returns {Promise<Number>}
     */
    ping(): Promise<number>;
    /**
     * Plays a track
     * @param {Object} [options] - Play options
     * @param {Number} [options.startTime] - Start time in milliseconds
     * @param {Number} [options.endTime] - End time in milliseconds
     * @param {Boolean} [options.noReplace] - Whether to ignore operation if a track is already playing or paused
     */
    play(options?: PlayOptions): Promise<void>;
    /**
     * Sends a voice state update payload to the discord gateway
     * @private
     */
    private sendVoiceState;
    /**
     * Sets the bot's self deaf state
     * @param state - Whether to self deaf or not
     */
    setSelfDeaf(state: boolean): void;
    /**
     * Sets the bot's self mute state
     * @param state - Whether to self mute or not
     */
    setSelfMute(state: boolean): void;
    /**
     * Sets the track looping
     * @param {Boolean} state - Whether to enable track looping or not
     */
    setTrackLoop(state: boolean): void;
    /**
     * Sets the queue looping
     * @param {Boolean} state - Whether to enable queue looping or not
     */
    setQueueLoop(state: boolean): void;
    /**
     * Sets the player voice channel
     * @param {String} channelId - The voice channel id
     */
    setVoiceChannel(channelId: string): void;
    /**
     * Shuffles the queue
     * @deprecated Use `queue.shuffle()` instead
     */
    shuffleQueue(): void;
    /**
     * Skips the current playing track
     * @param {Number} [amount=1] - The amount of tracks to skip
     */
    skip(amount?: number): Promise<void>;
    /**
     * Pause or unpause the player
     * @param {Boolean} [state=true] - Whether to pause or unpause the player
     */
    pause(state?: boolean): void;
    /**
     * Seek to a specific position in the track
     * @param {Number} position - The position to seek, in milliseconds
     */
    seek(position: number): void;
    sendVoiceUpdate(): void;
    update(state: PlayerState): void;
}
