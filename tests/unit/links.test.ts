import { describe, it, expect } from 'vitest';
import { missingLinks } from '../../src/links.js';

describe('missingLinks', () => {
    it('returns no names when all links are present', () => {
        const group = { Links: { Items: 'api/events', Item: 'api/events/{id}' } };
        expect(missingLinks(group, ['Items', 'Item'])).toEqual([]);
    });

    it('returns names that are absent', () => {
        const group = { Links: { Items: 'api/events' } };
        expect(missingLinks(group, ['Items', 'Stream'])).toEqual(['Stream']);
    });

    it('returns all required names when the group has no links', () => {
        const group = { Links: {} };
        expect(missingLinks(group, ['Items', 'Stream'])).toEqual(['Items', 'Stream']);
    });
});
