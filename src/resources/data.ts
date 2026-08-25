import type { QueryResult } from '../models/data.js';
import type { SeqRequestContext } from '../client.js';

export interface DataQueryOptions {
    q: string;
    rangeStartUtc?: Date;
    rangeEndUtc?: Date;
    signal?: string;
    timeoutMs?: number;
    trace?: boolean;
}

export class DataClient {
    constructor(private readonly context: SeqRequestContext) {}

    async query(options: DataQueryOptions): Promise<QueryResult> {
        return this.context.request<QueryResult>('api/data', {
            method: 'POST',
            query: this.#params(options),
            body: {},
            nonThrowingStatus: 400
        });
    }

    async queryCsv(options: DataQueryOptions): Promise<string> {
        return this.context.request<string>('api/data', {
            method: 'POST',
            query: { ...this.#params(options), format: 'text/csv' },
            body: {},
            responseType: 'text',
            nonThrowingStatus: 400
        });
    }

    #params(options: DataQueryOptions): Record<string, unknown> {
        const query: Record<string, unknown> = { q: options.q };
        if (options.rangeStartUtc !== undefined) {
            query.rangeStartUtc = options.rangeStartUtc;
        }
        if (options.rangeEndUtc !== undefined) {
            query.rangeEndUtc = options.rangeEndUtc;
        }
        if (options.signal !== undefined) {
            query.signal = options.signal;
        }
        if (options.timeoutMs !== undefined) {
            query.timeoutMS = options.timeoutMs;
        }
        if (options.trace === true) {
            query.trace = true;
        }
        return query;
    }
}
