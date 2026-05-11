import { describe, it } from 'vitest';

describe('GET /api/v1/quotes/random', () => {
  it.todo('returns a quote shape matching QuoteResponseDto');
});

describe('GET /api/v1/quotes/daily', () => {
  it.todo('returns the same quote for the same UTC ?date');
  it.todo('returns the same quote for two calls on the same UTC day without ?date');
  it.todo('400s when ?date is not in YYYY-MM-DD format');
  it.todo('400s when ?date is not a real calendar date (e.g. 2026-02-30)');
});

describe('GET /api/v1/quotes', () => {
  it.todo('filters by album, song, mood, featured');
  it.todo('caps results at ?limit');
  it.todo('400s on a non-kebab `album` or `song` filter value');
});
