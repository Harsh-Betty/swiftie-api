import * as z from 'zod';
import { type Quote, QuoteSchema } from '../schemas/quote';
import { fnv1a } from '../util/hash';

let cache: Quote[] | null = null;

const QuoteArraySchema = z.array(QuoteSchema);

export interface ListQuotesFilter {
  albumSlug?: string;
  songSlug?: string;
  mood?: string;
  featured?: boolean;
}

export async function getAllQuotes(): Promise<Quote[]> {
  if (cache) return cache;
  const path: string = './data/quotes.json';
  const mod = (await import(path, { with: { type: 'json' } })) as { default: unknown };
  cache = QuoteArraySchema.parse(mod.default);
  return cache;
}

export async function getRandomQuote(): Promise<Quote> {
  const quotes = await getAllQuotes();
  if (quotes.length === 0) {
    throw new Error('No quotes available.');
  }
  const index = Math.floor(Math.random() * quotes.length);
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return quotes[index]!;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDailyQuote(date: Date = new Date()): Promise<Quote> {
  const quotes = await getAllQuotes();
  const featured = quotes.filter((q) => q.featured);
  const pool = featured.length > 0 ? featured : quotes;
  if (pool.length === 0) {
    throw new Error('No quotes available.');
  }
  // FNV-1a over the UTC YYYY-MM-DD key keeps the selection deterministic
  // across processes and runtimes for the same calendar day.
  const index = fnv1a(toUtcDateKey(date)) % pool.length;
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return pool[index]!;
}

export async function listQuotes(filter: ListQuotesFilter = {}): Promise<Quote[]> {
  const quotes = await getAllQuotes();
  const moodNeedle = filter.mood?.trim().toLowerCase();
  return quotes.filter((q) => {
    if (filter.albumSlug !== undefined && q.albumSlug !== filter.albumSlug) return false;
    if (filter.songSlug !== undefined && q.songSlug !== filter.songSlug) return false;
    if (filter.featured !== undefined && q.featured !== filter.featured) return false;
    if (moodNeedle && q.mood?.toLowerCase() !== moodNeedle) return false;
    return true;
  });
}
