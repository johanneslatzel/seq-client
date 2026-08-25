import type { SignalEntity } from '../models/signal.js';
import type { SeqRequestContext } from '../client.js';

export interface SignalListOptions {
    ownerId?: string;
    shared?: boolean;
    partial?: boolean;
}

export interface SignalFindOptions {
    partial?: boolean;
}

export class SignalsClient {
    constructor(private readonly context: SeqRequestContext) {}

    async list(options: SignalListOptions = {}): Promise<SignalEntity[]> {
        const query: Record<string, unknown> = {};
        if (options.ownerId !== undefined) {
            query.ownerId = options.ownerId;
        }
        if (options.shared === true) {
            query.shared = true;
        }
        if (options.partial === true) {
            query.partial = true;
        }
        return this.context.request<SignalEntity[]>('api/signals', { query });
    }

    async findById(id: string, options: SignalFindOptions = {}): Promise<SignalEntity> {
        const query: Record<string, unknown> = {};
        if (options.partial === true) {
            query.partial = true;
        }
        return this.context.request<SignalEntity>(`api/signals/${encodeURIComponent(id)}`, {
            query
        });
    }
}
