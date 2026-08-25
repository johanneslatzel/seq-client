import { afterEach, describe, it, expect, vi } from 'vitest';
import { SeqClient } from '../../src/client.js';

interface Call {
    url: string;
    init: RequestInit;
}

function stubFetch(route: (url: string) => Response, calls: Call[] = []): Call[] {
    vi.stubGlobal(
        'fetch',
        async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
            const url = String(input);
            calls.push({ url, init: init ?? {} });
            return route(url);
        }
    );
    return calls;
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function searchParamsOf(call: Call): URLSearchParams {
    return new URL(call.url).searchParams;
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

function stubHangingFetch(calls: Call[] = []): Call[] {
    vi.stubGlobal(
        'fetch',
        (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
            calls.push({ url: String(input), init: init ?? {} });
            return new Promise<Response>((_resolve, reject) => {
                const signal = init?.signal;
                if (signal instanceof AbortSignal) {
                    signal.addEventListener('abort', () =>
                        reject(new DOMException('The operation was aborted.', 'AbortError'))
                    );
                }
            });
        }
    );
    return calls;
}

describe('request', () => {
    it('normalizes the base url and joins relative paths', async () => {
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test' });
        await client.request('api');
        expect(calls[0]?.url).toBe('http://seq.test/api');
    });

    it('handles a base url with a trailing slash', async () => {
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test/' });
        await client.request('api/events');
        expect(calls[0]?.url).toBe('http://seq.test/api/events');
    });

    it('sends the Accept and X-Seq-ApiKey headers', async () => {
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test', apiKey: 'secret' });
        await client.request('api');
        const headers = calls[0]?.init.headers as Record<string, string>;
        expect(headers?.Accept).toBe('application/vnd.datalust.seq.v14+json');
        expect(headers?.['X-Seq-ApiKey']).toBe('secret');
    });

    it('omits null and undefined query parameters', async () => {
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test' });
        await client.request('api/events', {
            query: { count: 2, filter: 'x', startAtId: null, afterId: undefined }
        });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('count')).toBe('2');
        expect(params.get('filter')).toBe('x');
        expect(params.has('startAtId')).toBe(false);
        expect(params.has('afterId')).toBe(false);
    });

    it('serializes Date and boolean query values', async () => {
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test' });
        const from = new Date('2026-01-01T00:00:00.000Z');
        await client.request('api/events', { query: { fromDateUtc: from, render: true, trace: false } });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('fromDateUtc')).toBe('2026-01-01T00:00:00.000Z');
        expect(params.get('render')).toBe('true');
        expect(params.get('trace')).toBe('false');
    });

    it('sends a JSON body on POST', async () => {
        const calls = stubFetch(() => json({ Events: [] }));
        const client = new SeqClient({ url: 'http://seq.test' });
        const result = await client.request('api/events/signal', { method: 'POST', body: {} });
        expect(calls[0]?.init.method).toBe('POST');
        const headers = calls[0]?.init.headers as Record<string, string>;
        expect(headers?.['Content-Type']).toBe('application/json');
        expect(JSON.parse(String(calls[0]?.init.body))).toEqual({});
        expect(result).toEqual({ Events: [] });
    });

    it('returns raw text when requested', async () => {
        stubFetch(() => new Response('a,b\n1,2'));
        const client = new SeqClient({ url: 'http://seq.test' });
        const result = await client.request('api/data', { query: { q: 'select 1' }, responseType: 'text' });
        expect(result).toBe('a,b\n1,2');
    });
});

describe('request timeout', () => {
    it('aborts the request and throws SeqTimeoutError when the client timeout elapses', async () => {
        vi.useFakeTimers();
        const calls = stubHangingFetch();
        const client = new SeqClient({ url: 'http://seq.test', timeoutMs: 5000 });
        const promise = client.request('api/events');
        const assertion = expect(promise).rejects.toMatchObject({ name: 'SeqTimeoutError', timeoutMs: 5000 });
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
        expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
    });

    it('honours a per-request timeoutMs override', async () => {
        vi.useFakeTimers();
        stubHangingFetch();
        const client = new SeqClient({ url: 'http://seq.test', timeoutMs: 5000 });
        const promise = client.request('api/events', { timeoutMs: 100 });
        const assertion = expect(promise).rejects.toMatchObject({ name: 'SeqTimeoutError', timeoutMs: 100 });
        await vi.advanceTimersByTimeAsync(100);
        await assertion;
    });

    it('clears the timer when the request succeeds', async () => {
        vi.useFakeTimers();
        stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test', timeoutMs: 5000 });
        await client.request('api/events');
        expect(vi.getTimerCount()).toBe(0);
    });

    it('clears the timer when the request fails', async () => {
        vi.useFakeTimers();
        stubFetch(() => json({ Error: 'bad' }, 400));
        const client = new SeqClient({ url: 'http://seq.test', timeoutMs: 5000 });
        await client.request('api/events').catch(() => {});
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not create a timer or abort signal when no timeout is configured', async () => {
        vi.useFakeTimers();
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test' });
        await client.request('api/events');
        expect(calls[0]?.init.signal).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('treats a zero timeout as disabled', async () => {
        vi.useFakeTimers();
        const calls = stubFetch(() => json({}));
        const client = new SeqClient({ url: 'http://seq.test', timeoutMs: 5000 });
        await client.request('api/events', { timeoutMs: 0 });
        expect(calls[0]?.init.signal).toBeUndefined();
    });
});

describe('error handling', () => {
    it('throws SeqApiError with the server error message', async () => {
        stubFetch(() => json({ Error: 'bad filter' }, 400));
        const client = new SeqClient({ url: 'http://seq.test' });
        await expect(client.request('api/events')).rejects.toMatchObject({
            status: 400,
            serverError: 'bad filter'
        });
    });

    it('falls back to status text when the body is not JSON', async () => {
        stubFetch(() => new Response('boom', { status: 500 }));
        const client = new SeqClient({ url: 'http://seq.test' });
        const error = await client.request('api/events').catch((e: unknown) => e);
        expect(error).toMatchObject({ status: 500, serverError: undefined });
        expect((error as Error).message).toContain('500');
    });

    it('falls back when the JSON body has no Error string', async () => {
        stubFetch(() => json({ Error: 42 }, 400));
        const client = new SeqClient({ url: 'http://seq.test' });
        const error = await client.request('api/events').catch((e: unknown) => e);
        expect(error).toMatchObject({ status: 400, serverError: undefined });
    });
});

describe('root', () => {
    it('fetches and caches the root entity', async () => {
        const root = { Product: 'Seq', Version: '1', InstanceName: null, Links: {} };
        const calls = stubFetch(() => json(root));
        const client = new SeqClient({ url: 'http://seq.test' });
        expect(await client.root()).toEqual(root);
        expect(await client.root()).toEqual(root);
        expect(calls).toHaveLength(1);
    });
});

describe('resourceGroup', () => {
    const root = {
        Product: 'Seq',
        Version: '1',
        InstanceName: null,
        Links: { EventsResources: 'api/events/resources' }
    };

    it('loads and caches a group', async () => {
        const calls = stubFetch((url) => {
            if (url.endsWith('/api')) {
                return json(root);
            }
            return json({ Links: { Items: 'api/events', InSignal: 'api/events/signal', Item: 'api/events/{id}', Stream: 'api/events/stream', Scan: 'api/events/scan' } });
        });
        const client = new SeqClient({ url: 'http://seq.test' });
        const group = await client.resourceGroup('Events');
        expect(group.Links.Items).toBe('api/events');
        await client.resourceGroup('Events');
        expect(calls).toHaveLength(2);
    });

    it('throws when the root lacks the group link', async () => {
        stubFetch(() => json({ Product: 'Seq', Version: '1', InstanceName: null, Links: {} }));
        const client = new SeqClient({ url: 'http://seq.test' });
        await expect(client.resourceGroup('Events')).rejects.toThrow('does not expose');
    });

    it('throws when the group is missing required links', async () => {
        stubFetch((url) => {
            if (url.endsWith('/api')) {
                return json(root);
            }
            return json({ Links: { Items: 'api/events' } });
        });
        const client = new SeqClient({ url: 'http://seq.test' });
        await expect(client.resourceGroup('Events')).rejects.toThrow('missing links');
    });

    it('accepts groups that are not in the required set', async () => {
        const rootWithBogus = {
            Product: 'Seq',
            Version: '1',
            InstanceName: null,
            Links: { BogusResources: 'api/bogus/resources' }
        };
        stubFetch((url) => {
            if (url.endsWith('/api')) {
                return json(rootWithBogus);
            }
            return json({ Links: { Self: 'api/bogus/resources' } });
        });
        const client = new SeqClient({ url: 'http://seq.test' });
        const group = await client.resourceGroup('Bogus');
        expect(group.Links.Self).toBe('api/bogus/resources');
    });
});

describe('discover', () => {
    const links = {
        EventsResources: 'api/events/resources',
        SignalsResources: 'api/signals/resources',
        SqlQueriesResources: 'api/sqlqueries/resources',
        DataResources: 'api/data/resources'
    };
    const groups: Record<string, Record<string, string>> = {
        '/api/events/resources': {
            Items: 'api/events',
            InSignal: 'api/events/signal',
            Item: 'api/events/{id}',
            Stream: 'api/events/stream',
            Scan: 'api/events/scan'
        },
        '/api/signals/resources': { Items: 'api/signals', Item: 'api/signals/{id}', Template: 'api/signals/template' },
        '/api/sqlqueries/resources': { Items: 'api/sqlqueries', Item: 'api/sqlqueries/{id}', Template: 'api/sqlqueries/template' },
        '/api/data/resources': { Query: 'api/data' }
    };

    it('loads all required resource groups', async () => {
        const calls = stubFetch((url) => {
            const path = new URL(url).pathname;
            if (path === '/api') {
                return json({ Product: 'Seq', Version: '1', InstanceName: null, Links: links });
            }
            return json({ Links: groups[path] });
        });
        const client = new SeqClient({ url: 'http://seq.test' });
        const root = await client.discover();
        expect(root.Version).toBe('1');
        expect(calls).toHaveLength(5);
    });

    it('throws when a required group is not exposed', async () => {
        stubFetch(() =>
            json({
                Product: 'Seq',
                Version: '1',
                InstanceName: null,
                Links: { EventsResources: 'api/events/resources' }
            })
        );
        const client = new SeqClient({ url: 'http://seq.test' });
        await expect(client.discover()).rejects.toThrow('does not expose');
    });
});


    it('returns the body for a matching nonThrowingStatus', async () => {
        stubFetch(() => json({ Error: 'syntax error', Reasons: ['bad token'] }, 400));
        const client = new SeqClient({ url: 'http://seq.test' });
        const result = await client.request('api/data', { query: { q: 'select' }, nonThrowingStatus: 400 });
        expect(result).toEqual({ Error: 'syntax error', Reasons: ['bad token'] });
    });
