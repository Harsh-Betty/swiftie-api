import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Quotes e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/quotes/daily?date=2026-05-10 returns a Quote', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/quotes/daily?date=2026-05-10');
    expect(res.status).toBe(200);
    expect(typeof res.body.data.text).toBe('string');
    expect(typeof res.body.data.songSlug).toBe('string');
  });

  it('GET /api/v1/quotes/daily?date=bogus returns 400', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/quotes/daily?date=bogus');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
