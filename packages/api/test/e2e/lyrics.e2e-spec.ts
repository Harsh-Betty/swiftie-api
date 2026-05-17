import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Lyrics e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/lyrics/search?q=summer returns 200 with an array body', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/lyrics/search?q=summer');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/lyrics/search without q returns 400', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/lyrics/search');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
