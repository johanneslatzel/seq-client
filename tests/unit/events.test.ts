import { afterEach, describe, it, expect, vi } from 'vitest';
import { EventsClient } from '../../src/resources/events.js';
import { SeqClient } from '../../src/client.js';
import { json, pathOf, searchParamsOf, stubFetch } from '../helper/mock.js';

const events = [
    {
        Timestamp: '2026-01-01T00:00:00Z',
        Properties: [{ Name: 'SessionId', Value: 'abc' }],
        Level: 'Error',
        Id: 'event-1'
    }
];

function makeClient(): EventsClient {
    return new EventsClient(new SeqClient({ url: 'http://seq.test' }));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('EventsClient', () => {
    it('queries events with a GET and returns the array', async () => {
        const calls = stubFetch(() => json(events));
        const client = makeClient();
        const result = await client.query({ filter: "SessionId = 'abc'", count: 5 });
        expect(calls[0]?.init.method).toBe('GET');
        expect(pathOf(calls[0]!)).toBe('/api/events');
        const params = searchParamsOf(calls[0]!);
        expect(params.get('filter')).toBe("SessionId = 'abc'");
        expect(params.get('count')).toBe('5');
        expect(result).toEqual(events);
    });

    it('defaults count to 30 and omits falsy booleans', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.query({ filter: 'x', render: false, background: false });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('count')).toBe('30');
        expect(params.has('render')).toBe(false);
        expect(params.has('background')).toBe(false);
    });

    it('serializes date ranges and includes optional params', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.query({
            filter: 'x',
            fromDate: new Date('2026-01-01T00:00:00.000Z'),
            toDate: new Date('2026-01-02T00:00:00.000Z'),
            signal: 'signal-1',
            startAtId: 'event-a',
            afterId: 'event-b',
            render: true
        });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('fromDateUtc')).toBe('2026-01-01T00:00:00.000Z');
        expect(params.get('toDateUtc')).toBe('2026-01-02T00:00:00.000Z');
        expect(params.get('signal')).toBe('signal-1');
        expect(params.get('startAtId')).toBe('event-a');
        expect(params.get('afterId')).toBe('event-b');
        expect(params.get('render')).toBe('true');
    });

    it('pages events with a POST to the InSignal endpoint', async () => {
        const resultSet = {
            Events: events,
            Statistics: { Elapsed: '00:00:00.1', Status: 'Complete' }
        };
        const calls = stubFetch(() => json(resultSet));
        const client = makeClient();
        const result = await client.page({ filter: '@Level = Error' });
        expect(calls[0]?.init.method).toBe('POST');
        expect(pathOf(calls[0]!)).toBe('/api/events/signal');
        expect(JSON.parse(String(calls[0]?.init.body))).toEqual({});
        expect(result.Statistics.Status).toBe('Complete');
    });

    it('finds an event by id with an encoded path', async () => {
        const calls = stubFetch(() => json(events[0]));
        const client = makeClient();
        const result = await client.findById('event-6bc39990fad808de1900000000000000', {
            render: true,
            permalinkId: 'permalink-1',
            background: true,
            trace: true
        });
        expect(pathOf(calls[0]!)).toBe('/api/events/event-6bc39990fad808de1900000000000000');
        const params = searchParamsOf(calls[0]!);
        expect(params.get('render')).toBe('true');
        expect(params.get('permalinkId')).toBe('permalink-1');
        expect(params.get('background')).toBe('true');
        expect(params.get('trace')).toBe('true');
        expect(result?.Id).toBe('event-1');
    });
});


    it('includes permalinkId, background and trace in query', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.query({ filter: 'x', permalinkId: 'permalink-1', background: true, trace: true });
        const params = searchParamsOf(calls[0]!);
        expect(params.get('permalinkId')).toBe('permalink-1');
        expect(params.get('background')).toBe('true');
        expect(params.get('trace')).toBe('true');
    });


    it('finds an event with no extra options', async () => {
        const calls = stubFetch(() => json(events[0]));
        const client = makeClient();
        await client.findById('event-1');
        expect(calls[0]?.init.method).toBe('GET');
        expect(searchParamsOf(calls[0]!).toString()).toBe('');
    });

    it('sends only count when no options are given', async () => {
        const calls = stubFetch(() => json([]));
        const client = makeClient();
        await client.query();
        expect(searchParamsOf(calls[0]!).toString()).toBe('count=30');
    });
