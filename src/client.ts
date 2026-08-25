import type { ResourceGroup, RootEntity } from './models/root.js';
import { missingLinks } from './links.js';
import { SeqApiError, SeqTimeoutError } from './errors.js';
import { EventsClient } from './resources/events.js';
import { SignalsClient } from './resources/signals.js';
import { DataClient } from './resources/data.js';
import { QueriesClient } from './resources/queries.js';

const DEFAULT_ACCEPT = 'application/vnd.datalust.seq.v14+json';

const REQUIRED_LINKS: Record<string, readonly string[]> = {
    Events: ['Items', 'InSignal', 'Item', 'Stream', 'Scan'],
    Signals: ['Items', 'Item', 'Template'],
    SqlQueries: ['Items', 'Item', 'Template'],
    Data: ['Query']
};

export interface SeqClientOptions {
    url: string;
    apiKey?: string;
    accept?: string;
    timeoutMs?: number;
}

export type SeqRequestMethod = 'GET' | 'POST';

export interface SeqRequestOptions {
    method?: SeqRequestMethod;
    query?: Record<string, unknown>;
    body?: unknown;
    responseType?: 'json' | 'text';
    nonThrowingStatus?: number;
    timeoutMs?: number;
}

export interface SeqRequestContext {
    request<T>(path: string, options?: SeqRequestOptions): Promise<T>;
    resourceGroup(name: string): Promise<ResourceGroup>;
}

export class SeqClient implements SeqRequestContext {
    readonly events: EventsClient;
    readonly signals: SignalsClient;
    readonly data: DataClient;
    readonly queries: QueriesClient;

    readonly #base: string;
    readonly #apiKey: string | undefined;
    readonly #accept: string;
    readonly #timeoutMs: number | undefined;
    #root: RootEntity | undefined;
    readonly #groups = new Map<string, ResourceGroup>();

    constructor(options: SeqClientOptions) {
        this.#base = options.url.endsWith('/') ? options.url : `${options.url}/`;
        this.#apiKey = options.apiKey;
        this.#accept = options.accept ?? DEFAULT_ACCEPT;
        this.#timeoutMs = options.timeoutMs;
        this.events = new EventsClient(this);
        this.signals = new SignalsClient(this);
        this.data = new DataClient(this);
        this.queries = new QueriesClient(this);
    }

    async root(): Promise<RootEntity> {
        this.#root ??= await this.request<RootEntity>('api');
        return this.#root;
    }

    async discover(): Promise<RootEntity> {
        const root = await this.root();
        await Promise.all(Object.keys(REQUIRED_LINKS).map((name) => this.resourceGroup(name)));
        return root;
    }

    async resourceGroup(name: string): Promise<ResourceGroup> {
        const cached = this.#groups.get(name);
        if (cached !== undefined) {
            return cached;
        }
        const root = await this.root();
        const link = root.Links[`${name}Resources`];
        if (link === undefined) {
            throw new SeqApiError(
                `Seq API does not expose the ${name}Resources link; this Seq version is not supported`,
                0,
                undefined
            );
        }
        const group = await this.request<ResourceGroup>(link);
        const missing = missingLinks(group, REQUIRED_LINKS[name] ?? []);
        if (missing.length > 0) {
            throw new SeqApiError(
                `Seq API resource group ${name} is missing links: ${missing.join(', ')}`,
                0,
                undefined
            );
        }
        this.#groups.set(name, group);
        return group;
    }

    async request<T>(path: string, options: SeqRequestOptions = {}): Promise<T> {
        const url = new URL(path, this.#base);
        for (const [key, value] of Object.entries(options.query ?? {})) {
            if (value === undefined || value === null) {
                continue;
            }
            url.searchParams.set(key, toQueryValue(value));
        }

        const headers: Record<string, string> = { Accept: this.#accept };
        if (this.#apiKey !== undefined) {
            headers['X-Seq-ApiKey'] = this.#apiKey;
        }

        const init: RequestInit = { method: options.method ?? 'GET', headers };
        if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }

        const timeoutMs = options.timeoutMs ?? this.#timeoutMs ?? 0;
        const controller = timeoutMs > 0 ? new AbortController() : undefined;
        const timer =
            controller !== undefined ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
        const signal = controller?.signal;
        const fetchInit = signal !== undefined ? { ...init, signal } : init;

        try {
            const response = await fetch(url, fetchInit);
            if (!response.ok && response.status !== options.nonThrowingStatus) {
                throw await toSeqApiError(response);
            }

            if (options.responseType === 'text') {
                return (await response.text()) as T;
            }
            return (await response.json()) as T;
        } catch (error) {
            if (controller !== undefined && controller.signal.aborted) {
                throw new SeqTimeoutError(timeoutMs);
            }
            throw error;
        } finally {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
        }
    }
}

function toQueryValue(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    return String(value);
}

async function toSeqApiError(response: Response): Promise<SeqApiError> {
    let serverError: string | undefined;
    try {
        const body = (await response.json()) as { Error?: unknown };
        if (typeof body.Error === 'string') {
            serverError = body.Error;
        }
    } catch {
        // Non-JSON error bodies fall back to the status text.
    }
    const message =
        serverError !== undefined
            ? `Seq API error (${response.status}): ${serverError}`
            : `Seq API error (${response.status}/${response.statusText})`;
    return new SeqApiError(message, response.status, serverError);
}
