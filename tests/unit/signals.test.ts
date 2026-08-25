import { afterEach, describe, it, expect, vi } from 'vitest';
import { SignalsClient } from '../../src/resources/signals.js';
import { SeqClient } from '../../src/client.js';
import { json, pathOf, searchParamsOf, stubFetch } from '../helper/mock.js';

const signals = [{ Title: 'Errors', Id: 'signal-m33301', OwnerId: null }];

function makeClient(): SignalsClient {
    return new SignalsClient(new SeqClient({ url: 'http://seq.test' }));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SignalsClient', () => {
    it('lists signals with shared and partial flags', async () => {
        const calls = stubFetch(() => json(signals));
        const client = makeClient();
        const result = await client.list({ shared: true, partial: true });
        expect(calls[0]?.init.method).toBe('GET');
        expect(pathOf(calls[0]!)).toBe('/api/signals');
        const params = searchParamsOf(calls[0]!);
        expect(params.get('shared')).toBe('true');
        expect(params.get('partial')).toBe('true');
        expect(result).toEqual(signals);
    });

    it('lists signals filtered by ownerId', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.list({ ownerId: 'user-1' });
        expect(searchParamsOf(calls[0]!).get('ownerId')).toBe('user-1');
    });

    it('sends no query params by default', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.list();
        expect(searchParamsOf(calls[0]!).toString()).toBe('');
    });

    it('finds a signal by id', async () => {
        const calls = stubFetch(() => json(signals[0]));
        const client = makeClient();
        const result = await client.findById('signal-m33301');
        expect(calls[0]?.init.method).toBe('GET');
        expect(pathOf(calls[0]!)).toBe('/api/signals/signal-m33301');
        expect(searchParamsOf(calls[0]!).toString()).toBe('');
        expect(result?.Id).toBe('signal-m33301');
    });

    it('finds a signal with partial details', async () => {
        const calls = stubFetch(() => json(signals[0]));
        const client = makeClient();
        await client.findById('signal-m33301', { partial: true });
        expect(searchParamsOf(calls[0]!).get('partial')).toBe('true');
    });
});
