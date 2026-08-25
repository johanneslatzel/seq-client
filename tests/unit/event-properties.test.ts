import { describe, it, expect } from 'vitest';
import { eventProperties } from '../../src/models/event.js';

describe('eventProperties', () => {
    it('flattens named properties into a record', () => {
        const event = {
            Timestamp: '2026-01-01T00:00:00Z',
            Properties: [
                { Name: 'SessionId', Value: 'abc' },
                { Name: 'UserId', Value: 'user42' },
                { Name: 'Pid', Value: 123 }
            ]
        };
        expect(eventProperties(event)).toEqual({
            SessionId: 'abc',
            UserId: 'user42',
            Pid: 123
        });
    });

    it('lets later properties win on duplicate names', () => {
        const event = {
            Timestamp: '2026-01-01T00:00:00Z',
            Properties: [
                { Name: 'K', Value: 'first' },
                { Name: 'K', Value: 'second' }
            ]
        };
        expect(eventProperties(event)).toEqual({ K: 'second' });
    });

    it('returns an empty record when Properties is absent', () => {
        expect(eventProperties({ Timestamp: '2026-01-01T00:00:00Z' })).toEqual({});
    });

    it('returns an empty record when there are no properties', () => {
        expect(eventProperties({ Timestamp: '2026-01-01T00:00:00Z', Properties: [] })).toEqual({});
    });
});
