import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Images e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/images/search?q=lover&source=cover returns 400 (cover does not support search)', async () => {
    // `cover` and `spotify` are not free-form-search-capable. This 400 path
    // doesn't depend on which provider env vars happen to be configured.
    const res = await request(app.getHttpServer()).get(
      '/api/v1/images/search?q=lover&source=cover',
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
