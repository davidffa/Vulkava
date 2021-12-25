import { Node } from '../..';

/** Main constructor options */
export type VulkavaOptions = {
  /** The array of lavalink nodes */
  nodes: NodeOptions[];
  /** Function to send voice channel connect payloads to discord */
  sendWS: (guildId: string, payload: Record<string, unknown>) => void;
};

/** Vulkava events */
interface EventListeners<T> {
  (event: 'raw', listener: (payload: unknown) => void): T;
  (event: 'nodeConnect', listener: (node: Node) => void): T;
  (event: 'nodeResume', listener: (node: Node) => void): T;
  (event: 'nodeDisconnect', listener: (node: Node) => void): T;
  (event: 'nodeError', listener: (node: Node, error: Error) => void): T;
}

export interface Vulkava {
  once: EventListeners<this>;
  on: EventListeners<this>;
}

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