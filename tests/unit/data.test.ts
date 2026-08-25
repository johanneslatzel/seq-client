import { afterEach, describe, it, expect, vi } from 'vitest';
import { DataClient } from '../../src/resources/data.js';
import { SeqClient } from '../../src/client.js';
import { json, pathOf, searchParamsOf, stubFetch } from '../helper/mock.js';

const result = {
    Columns: ['Timestamp', 'Count'],
    Rows: [['2026-01-01T00:00:00Z', 3]]
};

function makeClient(): DataClient {
    return new DataClient(new SeqClient({ url: 'http://seq.test' }));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('DataClient', () => {
    it('executes a SQL query as a POST with JSON result', async () => {
        const calls = stubFetch(() => json(result));
        const client = makeClient();
        const queryResult = await client.query({ q: 'select count(*) from stream' });
        expect(calls[0]?.init.method).toBe('POST');
        expect(pathOf(calls[0]!)).toBe('/api/data');
        expect(searchParamsOf(calls[0]!).get('q')).toBe('select count(*) from stream');
        expect(JSON.parse(String(calls[0]?.init.body))).toEqual({});
        expect(queryResult.Columns).toEqual(['Timestamp', 'Count']);
    });

    it('serializes ranges, signal, timeout and trace', async () => {
        const calls = stubFetch(() => json(result));
        const client = makeClient();
        await client.query({
            q: 'select count(*) from stream',
            rangeStartUtc: new Date('2026-01-01T00:00:00.000Z'),
            rangeEndUtc: new Date('2026-01-02T00:00:00.000Z'),
            signal: 'signal-1',
            timeoutMs: 5000,
            trace: true
        });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('rangeStartUtc')).toBe('2026-01-01T00:00:00.000Z');
        expect(params.get('rangeEndUtc')).toBe('2026-01-02T00:00:00.000Z');
        expect(params.get('signal')).toBe('signal-1');
        expect(params.get('timeoutMS')).toBe('5000');
        expect(params.get('trace')).toBe('true');
    });

    it('surfaces a syntax error result instead of throwing on 400', async () => {
        stubFetch(() => json({ Error: 'syntax error', Reasons: ['bad token'] }, 400));
        const client = makeClient();
        const queryResult = await client.query({ q: 'select * from' });
        expect(queryResult.Error).toBe('syntax error');
        expect(queryResult.Reasons).toEqual(['bad token']);
    });

    it('returns CSV text with the format parameter', async () => {
        const calls = stubFetch(() => new Response('Timestamp,Count\n2026-01-01T00:00:00Z,3'));
        const client = makeClient();
        const csv = await client.queryCsv({ q: 'select count(*) from stream' });
        expect(calls[0]?.init.method).toBe('POST');
        expect(searchParamsOf(calls[0]!).get('format')).toBe('text/csv');
        expect(csv).toBe('Timestamp,Count\n2026-01-01T00:00:00Z,3');
    });
});
