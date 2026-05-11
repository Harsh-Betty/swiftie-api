import { describe, it } from 'vitest';

describe('GET /api/v1/eras', () => {
  it.todo('returns every era with album slugs');
});

describe('GET /api/v1/eras/:slug', () => {
  it.todo('returns the era with full hydrated album objects');
  it.todo('404s for an unknown era slug');
  it.todo('400s when slug is not kebab-case');
});
