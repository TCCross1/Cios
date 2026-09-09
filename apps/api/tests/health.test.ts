import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/index.js';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns 404 for an unknown route', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' });

    expect(response.statusCode).toBe(404);
  });
});
