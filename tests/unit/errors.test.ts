import { describe, it, expect } from 'vitest';
import { SeqApiError } from '../../src/errors.js';

describe('SeqApiError', () => {
    it('is an Error with name, status and serverError', () => {
        const error = new SeqApiError('boom', 401, 'unauthorized');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('SeqApiError');
        expect(error.message).toBe('boom');
        expect(error.status).toBe(401);
        expect(error.serverError).toBe('unauthorized');
    });

    it('carries undefined serverError when absent', () => {
        const error = new SeqApiError('nope', 500, undefined);
        expect(error.serverError).toBeUndefined();
        expect(error.status).toBe(500);
    });
});
