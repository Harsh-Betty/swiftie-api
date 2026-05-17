import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './_setup';

describe('Songs e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/songs/cruel-summer returns the song with hasLyrics', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/songs/cruel-summer');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('cruel-summer');
    expect(typeof res.body.data.hasLyrics).toBe('boolean');
  });

  it('GET /api/v1/songs/cruel-summer?withLyrics=false omits the lyrics payload', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/songs/cruel-summer?withLyrics=false',
    );
    expect(res.status).toBe(200);
    expect('lyrics' in res.body.data).toBe(false);
  });
});
