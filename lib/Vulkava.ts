import { EventEmitter } from 'events';

export default class Vulkava extends EventEmitter {
  public readonly clientId: string;

  constructor(options: VulkavaOptions) {
    super();

    this.clientId = options.clientId;
    // TODO:
  }
}