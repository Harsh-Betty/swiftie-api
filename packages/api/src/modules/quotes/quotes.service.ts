import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getDailyQuote,
  getRandomQuote,
  type ListQuotesFilter,
  listQuotes,
  type Quote,
} from '@swiftie-api/data';

@Injectable()
export class QuotesService {
  random(): Promise<Quote> {
    return getRandomQuote();
  }

  daily(dateKey?: string): Promise<Quote> {
    const date = this.resolveDate(dateKey);
    return getDailyQuote(date);
  }

  async list(filter: ListQuotesFilter, limit: number): Promise<Quote[]> {
    const all = await listQuotes(filter);
    return all.slice(0, limit);
  }

  // Parses YYYY-MM-DD as a UTC midnight Date. We reject inputs the regex
  // would let through but that aren't real calendar dates (e.g. 2026-02-30).
  private resolveDate(dateKey?: string): Date {
    if (!dateKey) return new Date();
    const date = new Date(`${dateKey}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) {
      throw new BadRequestException(`date "${dateKey}" is not a valid calendar date.`);
    }
    return date;
  }
}
