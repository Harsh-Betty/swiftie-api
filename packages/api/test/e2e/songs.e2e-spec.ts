import { describe, it } from 'vitest';

describe('GET /api/v1/songs', () => {
  it.todo('returns canonical-only songs by default (matches meta.songs.canonical)');
  it.todo("includes Taylor's Version tracks when ?includeTaylorsVersions=true");
  it.todo('filters by album, vault, bonus, feature');
  it.todo('respects limit/offset and reports total in meta');
});

describe('GET /api/v1/songs/:slug', () => {
  it.todo('returns the song with lyrics by default');
  it.todo('omits lyrics when ?withLyrics=false');
  it.todo('404s for an unknown slug');
  it.todo('400s when slug is not kebab-case');
});
