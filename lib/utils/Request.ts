import https from 'https';
import http, { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { VERSION } from '../../';

export type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ReqOptions = {
  method?: HTTPMethods;
  body?: Record<string, unknown> | Array<unknown> | undefined;
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
          if (res.headers['content-type']?.includes('application/json')) {
            resolve(JSON.parse(Buffer.concat(data).toString()));
          }

          resolve(Buffer.concat(data) as unknown as T);
        });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => reject(new Error('Request timed out!')));

    if (options?.body) {
      const body = JSON.stringify(options.body);

      req.setHeader('Content-Length', body.length);
      req.setHeader('Content-Type', 'application/json');
      req.write(body);
    }

    req.end();
  });
}
