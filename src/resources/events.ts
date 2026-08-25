import type { ResultSet, SeqEvent } from '../models/event.js';
import type { SeqRequestContext } from '../client.js';

export interface EventQueryOptions {
    signal?: string;
    filter?: string;
    count?: number;
    startAtId?: string;
    afterId?: string;
    render?: boolean;
    fromDate?: Date;
    toDate?: Date;
    permalinkId?: string;
    background?: boolean;
    trace?: boolean;
}

export interface EventFindOptions {
    render?: boolean;
    permalinkId?: string;
    background?: boolean;
    trace?: boolean;
}

export class EventsClient {
    constructor(private readonly context: SeqRequestContext) {}

    async query(options: EventQueryOptions = {}): Promise<SeqEvent[]> {
        return this.context.request<SeqEvent[]>('api/events', {
            query: this.#queryParams(options)
        });
    }

    async page(options: EventQueryOptions = {}): Promise<ResultSet> {
        return this.context.request<ResultSet>('api/events/signal', {
            method: 'POST',
            query: this.#queryParams(options),
            body: {}
        });
    }

    async findById(id: string, options: EventFindOptions = {}): Promise<SeqEvent> {
        const query: Record<string, unknown> = {};
        if (options.render === true) {
            query.render = true;
        }
        if (options.permalinkId !== undefined) {
            query.permalinkId = options.permalinkId;
        }
        if (options.background === true) {
            query.background = true;
        }
        if (options.trace === true) {
            query.trace = true;
        }
        return this.context.request<SeqEvent>(`api/events/${encodeURIComponent(id)}`, { query });
    }

    #queryParams(options: EventQueryOptions): Record<string, unknown> {
        const query: Record<string, unknown> = { count: options.count ?? 30 };
        if (options.signal !== undefined) {
            query.signal = options.signal;
        }
        if (options.filter !== undefined) {
            query.filter = options.filter;
        }
        if (options.startAtId !== undefined) {
            query.startAtId = options.startAtId;
        }
        if (options.afterId !== undefined) {
            query.afterId = options.afterId;
        }
        if (options.fromDate !== undefined) {
            query.fromDateUtc = options.fromDate;
        }
        if (options.toDate !== undefined) {
            query.toDateUtc = options.toDate;
        }
        if (options.permalinkId !== undefined) {
            query.permalinkId = options.permalinkId;
        }
        if (options.render === true) {
            query.render = true;
        }
        if (options.background === true) {
            query.background = true;
        }
        if (options.trace === true) {
            query.trace = true;
        }
        return query;
    }
}
