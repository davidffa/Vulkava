import { SearchResult } from '../@types';
import { Vulkava } from '../Vulkava';

export abstract class AbstractExternalSource {
  protected readonly vulkava: Vulkava;

  constructor(vulkava: Vulkava) {
    this.vulkava = vulkava;
  }

  abstract loadItem(query: string): Promise<SearchResult | null>;
}