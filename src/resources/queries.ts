import type { QueryEntity } from '../models/query.js';
import type { SeqRequestContext } from '../client.js';

export interface QueryListOptions {
    ownerId?: string;
    shared?: boolean;
}

export class QueriesClient {
    constructor(private readonly context: SeqRequestContext) {}

    async list(options: QueryListOptions = {}): Promise<QueryEntity[]> {
        const query: Record<string, unknown> = {};
        if (options.ownerId !== undefined) {
            query.ownerId = options.ownerId;
        }
        if (options.shared === true) {
            query.shared = true;
        }
        return this.context.request<QueryEntity[]>('api/sqlqueries', { query });
    }

    async findById(id: string): Promise<QueryEntity> {
        return this.context.request<QueryEntity>(`api/sqlqueries/${encodeURIComponent(id)}`);
    }
}
