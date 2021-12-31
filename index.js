"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.VERSION = exports.ConnectionState = exports.NodeState = exports.Vulkava = exports.UnresolvedTrack = exports.Track = exports.Player = exports.Node = exports.Filters = void 0;
const Filters_1 = __importDefault(require("./lib/Filters"));
exports.Filters = Filters_1.default;
const Node_1 = __importStar(require("./lib/Node"));
exports.Node = Node_1.default;
Object.defineProperty(exports, "NodeState", { enumerable: true, get: function () { return Node_1.NodeState; } });
const Player_1 = __importStar(require("./lib/Player"));
exports.Player = Player_1.default;
Object.defineProperty(exports, "ConnectionState", { enumerable: true, get: function () { return Player_1.ConnectionState; } });
const Track_1 = __importDefault(require("./lib/Track"));
exports.Track = Track_1.default;
const UnresolvedTrack_1 = __importDefault(require("./lib/UnresolvedTrack"));
exports.UnresolvedTrack = UnresolvedTrack_1.default;
const Vulkava_1 = require("./lib/Vulkava");
Object.defineProperty(exports, "Vulkava", { enumerable: true, get: function () { return Vulkava_1.Vulkava; } });
const package_json_1 = require("./package.json");
const VERSION = package_json_1.version;
exports.VERSION = VERSION;
