import { EventEmitter } from 'events';
import Node from 'Node';

export default class Vulkava extends EventEmitter {
  public readonly clientId: string;
  public nodes: Node[];

  constructor(options: VulkavaOptions) {
    super();

    // TODO: verify input

    this.clientId = options.clientId;

    this.nodes = [];

    for (const nodeOp of options.nodes) {
      const node = new Node(this, nodeOp);
      this.nodes.push(node);
    }
  }

  public start() {
    for (const node of this.nodes) {
      node.connect();
    }
  }
}