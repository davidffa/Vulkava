"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTManager = void 0;
const undici_1 = require("undici");
const Endpoints_1 = require("./Endpoints");
class RESTManager {
    node;
    baseUrl;
    #sessionId;
    set sessionId(sessionId) {
        this.#sessionId = sessionId;
    }
    constructor(node) {
        this.node = node;
        this.baseUrl = `http${node.options.secure ? 's' : ''}://${node.options.hostname}:${node.options.port}`;
        if (node.options.transport === 'rest') {
            this.baseUrl += `/v${Endpoints_1.LAVALINK_API_VERSION}`;
        }
    }
    async decodeTrack(encodedTrack) {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.DECODE_TRACKS)() + `?track=${encodeURIComponent(encodedTrack)}`
        });
    }
    async decodeTracks(encodedTracks) {
        return this.request({
            method: 'POST',
            path: (0, Endpoints_1.DECODE_TRACKS)(),
            json: encodedTracks
        });
    }
    async deleteRecord(guildId, id) {
        await this.request({
            method: 'DELETE',
            path: (0, Endpoints_1.RECORD)(guildId, id)
        });
    }
    async deleteRecords(guildId) {
        await this.request({
            method: 'DELETE',
            path: (0, Endpoints_1.RECORDS)(guildId)
        });
    }
    async getRecord(guildId, id) {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.RECORD)(guildId, id)
        });
    }
    async getRecords(guildId) {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.RECORDS)(guildId)
        });
    }
    async getRoutePlannerStatus() {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.ROUTE_PLANNER_STATUS)()
        });
    }
    async freeRoutePlannerAddress(address) {
        await this.request({
            method: 'POST',
            path: (0, Endpoints_1.ROUTE_PLANNER_FREE_ADDR)(),
            json: {
                address
            }
        });
    }
    async freeAllRoutePlannerAddresses() {
        await this.request({
            method: 'POST',
            path: (0, Endpoints_1.ROUTE_PLANNER_FREE_ALL)()
        });
    }
    async loadTracks(identifier) {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.LOAD_TRACKS)(identifier)
        });
    }
    async updateSession(resumeKey, timeout) {
        await this.request({
            method: 'PATCH',
            path: (0, Endpoints_1.SESSIONS)(this.#sessionId),
            json: {
                resumeKey,
                timeout
            }
        });
    }
    async destroyPlayer(guildId) {
        await this.request({
            method: 'DELETE',
            path: (0, Endpoints_1.PLAYER)(this.#sessionId, guildId)
        });
    }
    async updatePlayer(guildId, options) {
        let path = (0, Endpoints_1.PLAYER)(this.#sessionId, guildId);
        if (options.noReplace) {
            path += '?noReplace=true';
        }
        delete options.noReplace;
        await this.request({
            method: 'PATCH',
            path,
            json: options
        });
    }
    async info() {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.INFO)()
        });
    }
    async version() {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.VERSION)(),
        });
    }
    async versions() {
        return this.request({
            method: 'GET',
            path: (0, Endpoints_1.VERSIONS)(),
        });
    }
    async request(options) {
        const { method, path, json } = options;
        const headers = {
            ...options.headers,
            'authorization': this.node.options.password ?? '',
        };
        let body = null;
        if (json) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(json);
        }
        const res = await (0, undici_1.fetch)(`${this.baseUrl}${path}`, {
            method,
            headers,
            body
        });
        if (res.status >= 400) {
            if (res.headers.get('content-type') === 'application/json') {
                const error = await res.json();
                throw new Error(`Lavalink request failed with status code ${res.status}. Path: ${error.path}. ERROR: ${error.error}: ${error.message}`);
            }
            throw new Error(`Request failed with status code ${res.status}`);
        }
        let resBody;
        if (res.status === 204) {
            resBody = null;
        }
        else if (res.headers.get('content-type') === 'application/json') {
            resBody = await res.json();
        }
        else {
            resBody = await res.arrayBuffer();
        }
        return resBody;
    }
}
exports.RESTManager = RESTManager;
