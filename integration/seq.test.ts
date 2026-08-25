import { describe, it, expect } from 'vitest';
import { SeqClient } from '../src/index.js';

const url = process.env.SEQ_TEST_URL ?? 'http://localhost:5341';

describe('SeqClient live integration', () => {
    const seq = new SeqClient({ url });

    it('discovers the API root and resource groups', async () => {
        const root = await seq.discover();
        expect(root.Product).toContain('Seq');
        expect(root.Version.length).toBeGreaterThan(0);
    });

    it('queries recent events', async () => {
        const events = await seq.events.query({ count: 5 });
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBeLessThanOrEqual(5);
    });

    it('queries events by a filter expression', async () => {
        const events = await seq.events.query({ filter: "@Level = 'Error'", count: 1 });
        expect(Array.isArray(events)).toBe(true);
    });

    it('lists shared signals', async () => {
        const signals = await seq.signals.list({ shared: true });
        expect(Array.isArray(signals)).toBe(true);
    });

    it('lists shared saved queries', async () => {
        const queries = await seq.queries.list({ shared: true });
        expect(Array.isArray(queries)).toBe(true);
    });

    it('executes a bounded data query', async () => {
        const result = await seq.data.query({
            q: 'select count(*) from stream',
            rangeStartUtc: new Date(Date.now() - 3600_000)
        });
        expect(result).toBeDefined();
        expect(Array.isArray(result.Columns)).toBe(true);
    });
});
