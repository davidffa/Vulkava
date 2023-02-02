export const LAVALINK_API_VERSION = 3;

// Sessions
export const SESSIONS = (sessionId: string) => `/sessions/${sessionId}`;

// Player
export const PLAYER = (sessionId: string, guildId: string) => `/sessions/${sessionId}/players/${guildId}`;
export const LOAD_TRACKS = (identifier: string) => `/loadtracks?identifier=${encodeURIComponent(identifier)}`;
export const DECODE_TRACKS = () => '/decodetracks';

// Recorder
export const RECORDS = (guildId: string) => `/records/${guildId}`;
export const RECORD = (guildId: string, id: string) => `/records/${guildId}/${id}`;

// Route planner
export const ROUTE_PLANNER_STATUS = () => '/routeplanner/status';
export const ROUTE_PLANNER_FREE_ADDR = () => '/routeplanner/free';
export const ROUTE_PLANNER_FREE_ALL = () => '/routeplanner/free/all';

// Versions
export const VERSION = () => '/version';
export const VERSIONS = () => '/versions';
export const INFO = () => '/info';