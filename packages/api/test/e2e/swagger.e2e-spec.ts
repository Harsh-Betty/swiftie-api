import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Swagger / Scalar e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp({ withSwagger: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/docs serves the Scalar HTML reference', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });
});
