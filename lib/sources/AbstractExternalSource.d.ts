import { SearchResult } from '../@types';
import { Vulkava } from '../Vulkava';
export declare abstract class AbstractExternalSource {
    protected readonly vulkava: Vulkava;
    constructor(vulkava: Vulkava);
    abstract loadItem(query: string): Promise<SearchResult | null>;
}
