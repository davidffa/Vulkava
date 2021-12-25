import { Node } from '../..';

// ---------- Vulkava typings ----------
type DiscordPayload = {
  op: number;
  d: Record<string, unknown>;
}

/** Main constructor options */
export type VulkavaOptions = {
  /** The array of lavalink nodes */
  nodes: NodeOptions[];
  /** Function to send voice channel connect payloads to discord */
  sendWS: (guildId: string, payload: DiscordPayload) => void;
  /** The defautl source to search for tracks */
  defaultSearchSource?: SEARCH_SOURCE;
};

/** Vulkava events */
export type EventListeners<T> = {
  (event: 'raw', listener: (payload: unknown) => void): T;
  (event: 'nodeConnect', listener: (node: Node) => void): T;
  (event: 'nodeResume', listener: (node: Node) => void): T;
  (event: 'nodeDisconnect', listener: (node: Node) => void): T;
  (event: 'nodeWarn', listener: (node: Node, warn: string) => void): T;
  (event: 'nodeError', listener: (node: Node, error: Error) => void): T;
}

// Search sources (the last two only works on my lavalink (https://github.com/davidffa/lavalink/releases) )
export type SEARCH_SOURCE = 'youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex';

// -- REST --

type PlaylistInfo = {
  selectedTrack: number;
  title: string;
};

type TrackInfo = {
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
export interface ILoadTracksResult {
  loadType: 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
  playlistInfo: PlaylistInfo;
  tracks: ITrack[];
  exception?: LoadException;
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

/** Lavalink node incoming payloads */
export interface BasePayload {
  op: 'stats' | 'pong' | 'playerUpdate' | 'event';
  [key: string]: unknown;
}

export interface PlayerEventPayload extends BasePayload {
  op: 'event';
  type: 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent';
}

// ---------- End of Node typings ----------