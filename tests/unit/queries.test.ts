import { afterEach, describe, it, expect, vi } from 'vitest';
import { QueriesClient } from '../../src/resources/queries.js';
import { SeqClient } from '../../src/client.js';
import { json, pathOf, searchParamsOf, stubFetch } from '../helper/mock.js';

const queries = [{ Title: 'Count by Hour', Sql: 'select count(*) from stream', Id: 'sqlquery-2' }];

function makeClient(): QueriesClient {
    return new QueriesClient(new SeqClient({ url: 'http://seq.test' }));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('QueriesClient', () => {
    it('lists saved queries against the SqlQueries endpoint', async () => {
        const calls = stubFetch(() => json(queries));
        const client = makeClient();
        const result = await client.list({ shared: true });
        expect(calls[0]?.init.method).toBe('GET');
        expect(pathOf(calls[0]!)).toBe('/api/sqlqueries');
        expect(searchParamsOf(calls[0]!).get('shared')).toBe('true');
        expect(result).toEqual(queries);
    });

    it('lists queries filtered by ownerId', async () => {
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

    it('finds a query by id', async () => {
        const calls = stubFetch(() => json(queries[0]));
        const client = makeClient();
        const result = await client.findById('sqlquery-2');
        expect(calls[0]?.init.method).toBe('GET');
        expect(pathOf(calls[0]!)).toBe('/api/sqlqueries/sqlquery-2');
        expect(result?.Id).toBe('sqlquery-2');
    });
});
