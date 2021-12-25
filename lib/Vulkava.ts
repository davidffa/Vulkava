import { EventEmitter } from 'events';
import Node from './Node';

import type { EventListeners, VulkavaOptions } from './@types';

export interface Vulkava {
  once: EventListeners<this>;
  on: EventListeners<this>;
}
export class Vulkava extends EventEmitter {
  public clientId: string;
  public nodes: Node[];

  constructor(options: VulkavaOptions) {
    super();

    // TODO: verify input

    this.nodes = [];

    for (const nodeOp of options.nodes) {
      const node = new Node(this, nodeOp);
      this.nodes.push(node);
    }
  }

  /**
   * Connects to all lavalink nodes
   * @param clientId String
   */
  public start(clientId: string) {
    if (typeof clientId !== 'string') {
      throw new TypeError('clientId must be a string');
    }

    this.clientId = clientId;

    for (const node of this.nodes) {
      node.connect();
    }
  }
}