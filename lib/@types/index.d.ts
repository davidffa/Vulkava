import { Node } from '../..';
import Player from '../Player';
import { AbstractQueue } from '../queue/AbstractQueue';
import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';
export declare type OutgoingDiscordPayload = {
    op: number;
    d: Record<string, unknown>;
};
export declare type IncomingDiscordPayload = {
    op: number;
    d?: unknown;
    s?: number;
    t?: string;
};
export declare type VoiceStateUpdatePayload = IncomingDiscordPayload & {
    t: 'VOICE_STATE_UPDATE';
    d: {
        session_id: string;
        channel_id: string | null;
        user_id: string;
        guild_id: string;
    };
};
declare type VoiceServerUpdateData = {
    token: string;
    guild_id: string;
    endpoint: string;
};
export declare type VoiceServerUpdatePayload = IncomingDiscordPayload & {
    t: 'VOICE_SERVER_UPDATE';
    d: VoiceServerUpdateData;
};
declare type SpotifyConfig = {
    clientId: string;
    clientSecret: string;
    market?: string;
};
declare type UNRESOLVED_SOURCES = 'APPLE_MUSIC' | 'DEEZER' | 'SPOTIFY';
/** Main constructor options */
export declare type VulkavaOptions = {
    /** The array of lavalink nodes */
    nodes: NodeOptions[];
    /** Function to send voice channel connect payloads to discord */
    sendWS: (guildId: string, payload: OutgoingDiscordPayload) => void;
    /** The default source to search for tracks */
    defaultSearchSource?: SEARCH_SOURCE;
    /** The default source to search for unresolved tracks */
    unresolvedSearchSource?: SEARCH_SOURCE;
    /** The spotify credentials */
    spotify?: SpotifyConfig;
    /** Disables spotify, apple music or deezer */
    disabledSources?: UNRESOLVED_SOURCES[];
};
/** Vulkava events */
export declare type EventListeners<T> = {
    (event: 'raw', listener: (node: Node, payload: unknown) => void): T;
    (event: 'nodeConnect', listener: (node: Node) => void): T;
    (event: 'nodeResume', listener: (node: Node) => void): T;
    (event: 'nodeDisconnect', listener: (node: Node, code: number, reason: string) => void): T;
    (event: 'warn', listener: (node: Node, warn: string) => void): T;
    (event: 'error', listener: (node: Node, error: Error) => void): T;
    (event: 'trackStart', listener: (player: Player, track: Track) => void): T;
    (event: 'trackEnd', listener: (player: Player, track: Track, reason: TrackEndReason) => void): T;
    (event: 'trackStuck', listener: (player: Player, track: Track, thresholdMs: number) => void): T;
    (event: 'trackException', listener: (player: Player, track: Track | UnresolvedTrack, exception: LoadException & {
        cause: string;
    }) => void): T;
    (event: 'playerCreate', listener: (player: Player) => void): T;
    (event: 'playerDestroy', listener: (player: Player) => void): T;
    (event: 'playerDisconnect', listener: (player: Player, code: number, reason: string) => void): T;
    (event: 'queueEnd', listener: (player: Player) => void): T;
    (event: 'pong', listener: (node: Node, ping?: number) => void): T;
    (event: 'recordFinished', listener: (node: Node, guildId: string, id: string) => void): T;
    (event: 'speakingStart', listener: (player: Player, userId: string) => void): T;
    (event: 'speakingStop', listener: (player: Player, userId: string) => void): T;
    (event: 'userDisconnect', listener: (player: Player, userId: string) => void): T;
};
export declare type SEARCH_SOURCE = 'youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex';
export declare type PlaylistInfo = {
    selectedTrack: number;
    name: string;
    duration: number;
};
export declare type TrackInfo = {
    identifier: string;
    thumbnail?: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    sourceName: string | null;
    position: number;
    title: string;
    uri: string;
};
export interface ITrack {
    track: string;
    info: TrackInfo;
}
declare type LoadException = {
    message: string;
    severity: 'COMMON' | 'SUSPIOUS' | 'FAULT';
};
declare type LoadResultBase = {
    loadType: 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
    playlistInfo: PlaylistInfo;
    exception?: LoadException;
};
export declare type LoadTracksResult = LoadResultBase & {
    tracks: ITrack[];
};
export declare type SearchResult = LoadResultBase & {
    tracks: Array<Track | UnresolvedTrack>;
};
/** Lavalink node options */
export declare type NodeOptions = {
    /** The node identifier */
    id?: string;
    /** The node hostname */
    hostname: string;
    /** The node port */
    port: number;
    /** Whether to use SSL/TLS or not */
    secure?: boolean;
    /** Whether to follow redirects or not (default is false) */
    followRedirects?: boolean;
    /** The node password */
    password?: string;
    /** The node region */
    region?: 'USA' | 'EU';
    /** The resume key */
    resumeKey?: string;
    /** The resume timeout, in seconds */
    resumeTimeout?: number;
    /** The max number of retry attempts */
    maxRetryAttempts?: number;
    /** The interval between retry attempts */
    retryAttemptsInterval?: number;
    /**
     * Tells to the lavalink server to send speaking events eg. speaking start, speaking stop
     * default is false
     * Only supported by my custom lavalink (https://github.com/davidffa/lavalink/releases) and if recording audio
    */
    sendSpeakingEvents?: boolean;
};
/** Lavalink node stats */
export declare type NodeStats = {
    /** The amount of playing players */
    playingPlayers: number;
    /** The total player amount */
    players: number;
    /** The lavalink node uptime, in seconds */
    uptime: number;
    /** RAM stats, in bytes */
    memory: {
        reservable: number;
        used: number;
        free: number;
        allocated: number;
    };
    /** CPU stats, [0, 1] */
    cpu: {
        cores: number;
        systemLoad: number;
        lavalinkLoad: number;
    };
    /** Audio frame stats */
    frameStats?: {
        sent: number;
        nulled: number;
        deficit: number;
    };
};
/** Route planner API */
export declare type RoutePlannerStatus = {
    class: string | null;
    details: RoutePlannerDetails | null;
};
declare type RoutePlannerDetails = {
    ipBlock: {
        type: string;
        size: string;
    };
    failingAddresses: Array<{
        address: string;
        failingTimestamp: number;
        failingTime: string;
    }>;
    blockIndex?: string;
    currentAddressIndex?: string;
};
/** Versions struct */
export declare type Versions = {
    /** Lavaplayer version */
    LAVAPLAYER: string;
    /** JVM version */
    JVM: string;
    /** Build number */
    BUILD: string;
    /** Timestamp of when .jar was built */
    BUILDTIME: number;
    /** Spring boot version */
    SPRING: string;
    /** Kotlin version */
    KOTLIN: string;
};
/** Lavalink node incoming payloads */
export interface SpeakingEventPayload {
    op: 'speakingEvent';
    type: 'start' | 'stop' | 'disconnected';
    guildId: string;
    userId: string;
}
export interface PlayerEventPayload {
    op: 'event';
    type: 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent' | 'WebSocketClosedEvent';
    guildId: string;
}
export interface TrackStartEvent extends PlayerEventPayload {
    type: 'TrackStartEvent';
    track: string;
}
declare type TrackEndReason = 'FINISHED' | 'LOAD_FAILED' | 'STOPPED' | 'REPLACED' | 'CLEANUP';
export interface TrackEndEvent extends PlayerEventPayload {
    type: 'TrackEndEvent';
    track: string;
    reason: TrackEndReason;
}
export interface TrackExceptionEvent extends PlayerEventPayload {
    type: 'TrackExceptionEvent';
    track: string;
    exception: LoadException & {
        cause: string;
    };
}
export interface TrackStuckEvent extends PlayerEventPayload {
    type: 'TrackStuckEvent';
    track: string;
    thresholdMs: number;
}
export interface WebSocketClosedEvent extends PlayerEventPayload {
    code: number;
    reason: string;
    byRemote: boolean;
}
export declare type PlayerState = {
    /** Unix timestamp when the position was picked */
    time: number;
    /** Track position in ms */
    position?: number;
    /** Whether the player is connected to discord voice gateway */
    connected: boolean;
};
export declare type PlayerOptions = {
    /** The guild id that player belongs to */
    guildId: string;
    /** The voice channel id */
    voiceChannelId: string;
    /** The text channel id */
    textChannelId?: string;
    /** Whether the bot joins the voice channel deafened or not */
    selfDeaf?: boolean;
    /** Whether the bot joins the voice channel muted or not */
    selfMute?: boolean;
    /** The queue object that player will use */
    queue?: AbstractQueue;
};
export declare type VoiceState = {
    sessionId: string;
    event: VoiceServerUpdateData;
};
export declare type PlayOptions = {
    startTime?: number;
    endTime?: number;
    pause?: boolean;
    noReplace?: boolean;
};
export declare type RecordOptions = {
    /** The record id */
    id: string;
    /** The bitrate value */
    bitrate: number;
    /** Whether to rec the bot's audio or not */
    selfAudio?: boolean;
    /** An array of user ids to record audio, if not passed, all users' audio will be recorded */
    users?: string[];
    /** The number of channels (mono or stereo) default=2 */
    channels?: number;
    /** The output audio file format (currently the available formats are PCM and MP3), default is MP3 */
    format?: 'PCM' | 'MP3';
};
export declare type ChannelMixOptions = {
    leftToLeft?: number;
    leftToRight?: number;
    rightToLeft?: number;
    rightToRight?: number;
};
export declare type DistortionOptions = {
    sinOffset?: number;
    sinScale?: number;
    tanOffset?: number;
    tanScale?: number;
    cosOffset?: number;
    cosScale?: number;
    offset?: number;
    scale?: number;
};
export declare type KaraokeOptions = {
    level?: number;
    monoLevel?: number;
    filterBand?: number;
    filterWidth?: number;
};
export declare type LowPassOptions = {
    smoothing?: number;
};
export declare type RotationOptions = {
    rotationHz?: number;
};
export declare type TimescaleOptions = {
    speed?: number;
    pitch?: number;
    rate?: number;
};
export declare type TremoloOptions = {
    frequency?: number;
    depth?: number;
};
export declare type VibratoOptions = {
    frequency?: number;
    depth?: number;
};
export declare type FilterOptions = {
    channelMix?: ChannelMixOptions;
    distortion?: DistortionOptions;
    /**
     * 15 bands [0-14]
     * 25 Hz, 40 Hz, 63 Hz, 100 Hz, 160 Hz, 250 Hz, 400 Hz, 630 Hz, 1 kHz, 1.6 kHz, 2.5 kHz, 4 kHz, 6.3 kHz, 10 kHz, 16 kHz
     */
    equalizer?: number[];
    karaoke?: KaraokeOptions;
    lowPass?: LowPassOptions;
    rotation?: RotationOptions;
    timescale?: TimescaleOptions;
    tremolo?: TremoloOptions;
    vibrato?: VibratoOptions;
    volume?: number;
    [key: string]: unknown;
};
export {};
