import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Albums e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/albums returns an enveloped paginated list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/albums');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.meta.total).toBe('number');
  });

  it('GET /api/v1/albums/lover returns the Lover album', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/albums/lover');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('lover');
    expect(res.body.data.title).toBe('Lover');
  });

  it('GET /api/v1/albums/does-not-exist returns 404 with the error envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/albums/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.error.requestId).toBe('string');
  });
});
