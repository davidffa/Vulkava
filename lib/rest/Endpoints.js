"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFO = exports.VERSIONS = exports.VERSION = exports.ROUTE_PLANNER_FREE_ALL = exports.ROUTE_PLANNER_FREE_ADDR = exports.ROUTE_PLANNER_STATUS = exports.RECORD = exports.RECORDS = exports.DECODE_TRACKS = exports.LOAD_TRACKS = exports.PLAYER = exports.SESSIONS = exports.LAVALINK_API_VERSION = void 0;
exports.LAVALINK_API_VERSION = 3;
// Sessions
const SESSIONS = (sessionId) => `/sessions/${sessionId}`;
exports.SESSIONS = SESSIONS;
// Player
const PLAYER = (sessionId, guildId) => `/sessions/${sessionId}/players/${guildId}`;
exports.PLAYER = PLAYER;
const LOAD_TRACKS = (identifier) => `/loadtracks?identifier=${encodeURIComponent(identifier)}`;
exports.LOAD_TRACKS = LOAD_TRACKS;
const DECODE_TRACKS = () => '/decodetracks';
exports.DECODE_TRACKS = DECODE_TRACKS;
// Recorder
const RECORDS = (guildId) => `/records/${guildId}`;
exports.RECORDS = RECORDS;
const RECORD = (guildId, id) => `/records/${guildId}/${id}`;
exports.RECORD = RECORD;
// Route planner
const ROUTE_PLANNER_STATUS = () => '/routeplanner/status';
exports.ROUTE_PLANNER_STATUS = ROUTE_PLANNER_STATUS;
const ROUTE_PLANNER_FREE_ADDR = () => '/routeplanner/free';
exports.ROUTE_PLANNER_FREE_ADDR = ROUTE_PLANNER_FREE_ADDR;
const ROUTE_PLANNER_FREE_ALL = () => '/routeplanner/free/all';
exports.ROUTE_PLANNER_FREE_ALL = ROUTE_PLANNER_FREE_ALL;
// Versions
const VERSION = () => '/version';
exports.VERSION = VERSION;
const VERSIONS = () => '/versions';
exports.VERSIONS = VERSIONS;
const INFO = () => '/info';
exports.INFO = INFO;
