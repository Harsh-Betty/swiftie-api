import { describe, it } from 'vitest';

// @TODO: Implement these later.

describe('GET /api/v1/images/album/:slug', () => {
  it.todo('defaults source=cover and returns a CAA URL when the album has an MBID');
  it.todo('returns [] for source=cover when the album lacks an MBID');
  it.todo('source=auto walks cover -> spotify -> pexels -> unsplash -> reddit');
  it.todo('returns 503 with structured details when an unavailable source is requested');
  it.todo('404s for an unknown album slug');
  it.todo('400s when slug is not kebab-case');
});

describe('GET /api/v1/images/song/:slug', () => {
  it.todo('falls back to album cover for source=cover and source=spotify');
  it.todo('uses song title + " taylor swift" as query for search-capable sources');
  it.todo('404s for an unknown song slug');
});

describe('GET /api/v1/images/search', () => {
  it.todo('returns 400 when source=cover or source=spotify');
  it.todo('returns 400 when q is missing or shorter than 2 chars');
  it.todo('returns 503 with structured details when the chosen source is not configured');
});
