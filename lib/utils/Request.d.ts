/// <reference types="node" />
import { OutgoingHttpHeaders } from 'http';
export declare type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
declare type ReqOptions = {
    method?: HTTPMethods;
    body?: Record<string, unknown> | Array<unknown> | undefined;
    headers?: OutgoingHttpHeaders;
};
export default function fetch<T>(url: string, options?: ReqOptions): Promise<T>;
export {};
