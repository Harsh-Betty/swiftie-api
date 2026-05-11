import { describe, it } from 'vitest';

describe('GET /api/v1/lyrics/search', () => {
  it.todo('returns hits sorted by score with nested song/album refs');
  it.todo('includes matches[] with half-open ranges for each query term');
  it.todo('caps results at the provided ?limit');
  it.todo('400s when `q` is missing or empty');
});

describe('GET /api/v1/lyrics/:songSlug', () => {
  it.todo('returns structured lyrics grouped by section for a known song');
  it.todo('404s for an unknown song slug');
  it.todo('400s when slug is not kebab-case');
});
