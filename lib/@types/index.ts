import { Node } from '../..';
import Player from '../Player';
import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';

// ---------- Vulkava typings ----------
export type OutgoingDiscordPayload = {
  op: number;
  d: Record<string, unknown>;
};

export type IncomingDiscordPayload = {
  op: number;
  d?: unknown;
  s?: number;
  t?: string;
};

export type VoiceStateUpdatePayload = IncomingDiscordPayload & {
  t: 'VOICE_STATE_UPDATE';
  d: {
    session_id: string;
    channel_id: string | null;
    user_id: string;
    guild_id: string;
  };
};

type VoiceServerUpdateData = {
  token: string;
  guild_id: string;
  endpoint: string;
};

export type VoiceServerUpdatePayload = IncomingDiscordPayload & {
  t: 'VOICE_SERVER_UPDATE';
  d: VoiceServerUpdateData;
};

type SpotifyConfig = {
  clientId: string;
  clientSecret: string;
}

/** Main constructor options */
export type VulkavaOptions = {
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
};

/** Vulkava events */
export type EventListeners<T> = {
  (event: 'raw', listener: (node: Node, payload: unknown) => void): T;
  (event: 'nodeConnect', listener: (node: Node) => void): T;
  (event: 'nodeResume', listener: (node: Node) => void): T;
  (event: 'nodeDisconnect', listener: (node: Node) => void): T;
  (event: 'warn', listener: (node: Node, warn: string) => void): T;
  (event: 'error', listener: (node: Node, error: Error) => void): T;
  (event: 'trackStart', listener: (player: Player, track: Track) => void): T;
  (event: 'trackEnd', listener: (player: Player, track: Track, reason: TrackEndReason) => void): T;
  (event: 'trackStuck', listener: (player: Player, track: Track, thresholdMs: number) => void): T;
  (event: 'trackException', listener: (player: Player, track: Track, exception: LoadException & { cause: string }) => void): T;
  (event: 'wsDisconnect', listener: (player: Player, code: number, reason: string) => void): T;
  (event: 'queueEnd', listener: (player: Player) => void): T;
  (event: 'pong', listener: (node: Node, ping?: number) => void): T;
}

// Search sources (the last two only works on my lavalink (https://github.com/davidffa/lavalink/releases) )
export type SEARCH_SOURCE = 'youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex';

// -- REST --

export type PlaylistInfo = {
  selectedTrack: number;
  title: string;
  duration: number;
};

export type TrackInfo = {
  identifier: string;
  thumbnail?: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  source?: string;
  sourceName?: string;
  position: number;
  title: string;
  uri: string;
};
export interface ITrack {
  track: string;
  info: TrackInfo;
}

type LoadException = {
  message: string;
  severity: 'COMMON' | 'SUSPIOUS' | 'FAULT';
}

type LoadResultBase = {
  loadType: 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
  playlistInfo: PlaylistInfo;
  exception?: LoadException;
}
export type LoadTracksResult = LoadResultBase & {
  tracks: ITrack[];
}

export type SearchResult = LoadResultBase & {
  tracks: Array<Track | UnresolvedTrack>;
}

// -- END REST --

// ---------- End of Vulkava typings ----------

// ---------- Node typings ----------

/** Lavalink node options */
export type NodeOptions = {
  /** The node identifier */
  id?: string;
  /** The node hostname */
  hostname: string;
  /** The node port */
  port: number;
  /** Whether to use SSL/TLS or not */
  secure?: boolean;
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
};

/** Lavalink node stats */
export type NodeStats = {
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
  frameStats: {
    sent: number;
    nulled: number;
    deficit: number;
  };
};

/** Versions struct */
export type Versions = {
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
}

/** Lavalink node incoming payloads */
export interface PlayerEventPayload {
  op: 'event';
  type: 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent' | 'WebSocketClosedEvent';
  guildId: string;
}

export interface TrackStartEvent extends PlayerEventPayload {
  type: 'TrackStartEvent';
  track: string;
}

type TrackEndReason = 'FINISHED' | 'LOAD_FAILED' | 'STOPPED' | 'REPLACED' | 'CLEANUP';
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

export type PlayerState = {
  /** Unix timestamp when the position was picked */
  time: number;
  /** Track position in ms */
  position?: number;
  /** Whether the player is connected to discord voice gateway */
  connected: boolean;
};

// ---------- End of Node typings ----------

// ---------- Player typings ----------

// Main constructor options
export type PlayerOptions = {
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
};

export type VoiceState = {
  sessionId: string;
  event: VoiceServerUpdateData;
};

export type PlayOptions = {
  startTime?: number;
  endTime?: number;
  pause?: boolean;
  noReplace?: boolean;
};

// ---------- End of Player typings ----------

// ---------- Filter typings ----------

export type ChannelMixOptions = {
  leftToLeft?: number;
  leftToRight?: number;
  rightToLeft?: number;
  rightToRight?: number;
}

export type DistortionOptions = {
  sinOffset?: number;
  sinScale?: number;
  tanOffset?: number;
  tanScale?: number;
  cosOffset?: number;
  cosScale?: number;
  offset?: number;
  scale?: number;
}

export type KaraokeOptions = {
  level?: number;
  monoLevel?: number;
  filterBand?: number;
  filterWidth?: number;
}

export type LowPassOptions = {
  smoothing?: number;
}

export type RotationOptions = {
  speed?: number;
}

export type TimescaleOptions = {
  speed?: number;
  pitch?: number;
  rate?: number;
}

export type TremoloOptions = {
  frequency?: number;
  depth?: number;
}

export type VibratoOptions = {
  frequency?: number;
  depth?: number;
}

export type FilterOptions = {
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
}
// ---------- End of Filter typings ----------