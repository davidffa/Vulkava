import https from 'https';
import http, { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { VERSION } from '../../';

type ReqOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: OutgoingHttpHeaders;
}

export default function fetch<T>(url: string, options?: ReqOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);

    const request = requestUrl.protocol === 'https:' ? https.request : http.request;

    const data: Buffer[] = [];

    const req = request({
      host: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname + requestUrl.search,
      headers: {
        'User-Agent': `Vulkava (v${VERSION})`,
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
