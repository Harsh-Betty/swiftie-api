import { describe, it } from 'vitest';

// @TODO: Implement these later.

describe('GET /api/v1/albums', () => {
  it.todo('returns canonical-only albums by default (matches meta.albums.canonical)');
  it.todo("includes Taylor's Versions when ?includeTaylorsVersions=true");
  it.todo('filters by era, type, taylorsVersion');
  it.todo('respects limit/offset and reports total in meta');
  it.todo('400s on a non-kebab `era` filter value');
});

describe('GET /api/v1/albums/:slug', () => {
  it.todo('returns full album metadata for a known slug');
  it.todo('404s for an unknown slug');
  it.todo('400s when slug is not kebab-case');
});

describe('GET /api/v1/albums/:slug/songs', () => {
  it.todo('returns songs ordered by disc, then track number');
  it.todo('404s for an unknown album slug');
});
