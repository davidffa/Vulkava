"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const __1 = require("../../");
function fetch(url, options) {
    return new Promise((resolve, reject) => {
        const requestUrl = new url_1.URL(url);
        const request = requestUrl.protocol === 'https:' ? https_1.default.request : http_1.default.request;
        const data = [];
        const req = request({
            host: requestUrl.hostname,
            port: requestUrl.port,
            path: requestUrl.pathname + requestUrl.search,
            headers: {
                'User-Agent': `Vulkava (v${__1.VERSION})`,
                ...options?.headers
            },
            method: options?.method
        }, (res) => {
            res
                .on('data', d => data.push(d))
                .on('error', err => reject(err))
                .once('end', () => {
                resolve(JSON.parse(Buffer.concat(data).toString()));
            });
        });
        req.on('error', err => reject(err));
        req.on('timeout', () => reject(new Error('Request timed out!')));
        req.on('error', err => reject(err));
        if (options?.body) {
            const body = JSON.stringify(options.body);
            req.setHeader('Content-Length', body.length);
            req.setHeader('Content-Type', 'application/json');
            req.write(body);
        }
        req.end();
    });
}
exports.default = fetch;
