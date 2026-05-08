import * as z from 'zod';
import { type Quote, QuoteSchema } from '../schemas/quote';
import { djb2 } from '../util/hash';

let cache: Quote[] | null = null;

const QuoteArraySchema = z.array(QuoteSchema);

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

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDailyQuote(date: Date = new Date()): Promise<Quote> {
  const quotes = await getAllQuotes();
  const featured = quotes.filter((q) => q.featured);
  const pool = featured.length > 0 ? featured : quotes;
  if (pool.length === 0) {
    throw new Error('No quotes available.');
  }
  const index = djb2(toDateKey(date)) % pool.length;
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return pool[index]!;
}
