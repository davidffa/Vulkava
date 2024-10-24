import { DefaultQueue, Node } from '../..';
import { Player } from '../Player';
import { AbstractQueue } from '../queue/AbstractQueue';
import Track from '../Track';
import UnresolvedTrack from '../UnresolvedTrack';
import type { Dispatcher } from 'undici';

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
  market?: string;
}

export type Metadata = Pick<TrackInfo, 'title' | 'author' | 'uri'> & {
  duration: number;
  source: string;
  isrc?: string;
};

type UNRESOLVED_SOURCES = 'APPLE_MUSIC' | 'DEEZER' | 'SPOTIFY';

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
  /** Disables spotify, apple music or deezer */
  disabledSources?: UNRESOLVED_SOURCES[];
  /** Whether to search for ISRC to resolve tracks or not */
  useISRC?: boolean;
};

/** Vulkava events */
export interface VulkavaEvents {
  debug: [message: string];
  error: [
    node: Node,
    error: Error,
  ];
  playerCreate: [player: Player];
  playerDestroy: [player: Player];
  playerDisconnect: [
    player: Player,
    code: number,
    reason: string,
  ];
  playerUpdate: [
    oldPlayer: Player,
    newPlayer: Player,
  ];
  pong: [
    node: Node,
    ping?: number,
  ];
  queueEnd: [player: Player];
  raw: [
    node: Node,
    payload: unknown,
  ];
  recordFinished: [
    node: Node,
    guildId: string,
    id: string,
  ];

  // This event only works on my lavalink (https://github.com/davidffa/lavalink/releases) and while recording audio
  speakingStart: [
    player: Player,
    userId: string,
  ];
  // This event only works on my lavalink (https://github.com/davidffa/lavalink/releases) and while recording audio
  speakingStop: [
    player: Player,
    userId: string,
  ];

  trackEnd: [
    player: Player,
    track: Track,
    reason: TrackEndReason,
  ];
  trackException: [
    player: Player,
    track: Track | UnresolvedTrack,
    exception: LoadException & { cause: string },
  ];
  trackStart: [
    player: Player,
    track: Track,
  ];
  trackStuck: [
    player: Player,
    track: Track,
    thresholdMs: number,
  ];

  // This event only works on my lavalink (https://github.com/davidffa/lavalink/releases) and while recording audio
  userDisconnect: [
    player: Player,
    userId: string,
  ];

  nodeConnect: [node: Node];
  nodeDisconnect: [
    node: Node,
    code: number,
    reason: string,
  ];
  nodeResume: [node: Node];
  warn: [
    node: Node,
    warn: string,
  ];
}

/** Player events */
export interface PlayerEvents {
  queueShuffle: [
    player: Player,
    oldQueue: DefaultQueue,
    newQueue: DefaultQueue,
  ];
  seek: [
    player: Player,
    oldPosition: number,
    newPosition: number,
  ];
  skip: [
    player: Player,
    amount: number,
  ];
}

// Search sources (the last two only works on my lavalink (https://github.com/davidffa/lavalink/releases) )
export type SEARCH_SOURCE = 'youtube' | 'youtubemusic' | 'soundcloud' | 'odysee' | 'yandex';

// -- REST --

export type UpdatePlayerOptions = {
  encodedTrack?: string | null;
  // identifier?: string;
  position?: number;
  endTime?: number;
  volume?: number;
  paused?: boolean;
  filters?: FilterOptions;
  voice?: {
    sessionId: string;
    token: string;
    endpoint: string;
  };
  noReplace?: boolean;
}

export type LavalinkRESTError = {
  timestamp: number;
  status: number;
  error: string;
  trace?: string;
  message: string;
  path: string;
}

export type RequestOptions = {
  path: string;
  method: Dispatcher.HttpMethod;
  json?: unknown;
  headers?: Record<string, string>;
}

export type PlaylistInfo = {
  selectedTrack: number;
  name: string;
  duration: number;
};

export type TrackInfo = {
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
  /**
   * The transport method to use
   * default = websocket
   */
  transport?: 'websocket' | 'rest';
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
  frameStats?: {
    sent: number;
    nulled: number;
    deficit: number;
  };
};

/** Route planner API */
export type RoutePlannerStatus = {
  class: string | null;
  details: RoutePlannerDetails | null;
};

type RoutePlannerDetails = {
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

/** Versions struct (my custom lavalink) */
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

/** Info struct (original lavalink) */
export type Info = {
  version: {
    semver: string;
    major: number;
    minor: number;
    patch: number;
    preRelease: string | null;
  };
  buildTime: number;
  git: {
    branch: string;
    commit: string;
    commitTime: number;
  };
  jvm: string;
  lavaplayer: string;
  sourceManagers: string[];
  filters: string[];
  plugins: Array<{
    name: string;
    version: string;
  }>;
}

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
  /** The queue object that player will use */
  queue?: AbstractQueue;
};

export type VoiceState = {
  sessionId?: string;
  event?: VoiceServerUpdateData;
};

export type PlayOptions = {
  startTime?: number;
  endTime?: number;
  pause?: boolean;
  noReplace?: boolean;
};

// ---------- End of Player typings ----------

// ---------- Recorder typings ----------

export type RecordOptions = {
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
}

// ---------- End of Recorder typings ----------

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
  rotationHz?: number;
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
