import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Throttler e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('hammering /api/v1/meta past the short-throttle limit yields a 429 with the error envelope', async () => {
    const server = app.getHttpServer();
    // Short throttler is 10 req / 1s. Fire 20 rapid sequential requests to
    // guarantee at least one trips the throttle inside the same window.
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) {
      const res = await request(server).get('/api/v1/meta');
      statuses.push(res.status);
      if (res.status === 429) {
        expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
        return;
      }
    }
    throw new Error(`Expected at least one 429, got statuses: ${statuses.join(', ')}`);
  });
});
