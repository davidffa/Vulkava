/** Main constructor options */
type VulkavaOptions = {
  /** The client (BOT) id */
  clientId: string;
  /** The array of lavalink nodes */
  nodes: NodeOptions[];
  /** Function to send voice channel connect payloads to discord */
  sendWS: (guildId: string, payload: Record<string, unknown>) => void;
};

/** Lavalink node options */
type NodeOptions = {
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