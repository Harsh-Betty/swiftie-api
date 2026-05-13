import { QUOTES } from '../__generated__/meta.js';
import type { ListQuotesFilter, Quote } from '../shared/types.js';

export function getQuotes(filter: ListQuotesFilter = {}): Quote[] {
  const moodNeedle = filter.mood?.trim().toLowerCase();
  return QUOTES.filter((q) => {
    if (filter.albumSlug !== undefined && q.albumSlug !== filter.albumSlug) return false;
    if (filter.songSlug !== undefined && q.songSlug !== filter.songSlug) return false;
    if (filter.featured !== undefined && q.featured !== filter.featured) return false;
    if (moodNeedle && q.mood?.toLowerCase() !== moodNeedle) return false;
    return true;
  });
}

export function getRandomQuote(): Quote {
  if (QUOTES.length === 0) {
    throw new Error('No quotes available.');
  }
  const index = Math.floor(Math.random() * QUOTES.length);
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return QUOTES[index]!;
}

// FNV-1a 32-bit hash over a UTC YYYY-MM-DD key. Math.imul keeps the
// multiplication 32-bit even when intermediate values exceed Number's safe
// integer range. Mirrors `@swiftie-api/data`'s daily-quote algorithm so server
// and library agree on the quote-of-the-day for any given UTC date.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.codePointAt(i) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyQuote(date: Date = new Date()): Quote {
  const featured = QUOTES.filter((q) => q.featured);
  const pool = featured.length > 0 ? featured : QUOTES;
  if (pool.length === 0) {
    throw new Error('No quotes available.');
  }
  const index = fnv1a(toUtcDateKey(date)) % pool.length;
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return pool[index]!;
}
