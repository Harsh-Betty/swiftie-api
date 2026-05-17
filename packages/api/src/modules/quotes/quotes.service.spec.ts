import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  const service = new QuotesService();

  it('daily("2026-05-10") is deterministic across calls', async () => {
    const first = await service.daily('2026-05-10');
    const second = await service.daily('2026-05-10');
    expect(first.id).toBe(second.id);
  });

  it('daily("2026-02-30") throws BadRequestException for an invalid calendar date', () => {
    // resolveDate runs synchronously before the Promise is created, so the
    // exception surfaces synchronously rather than as a rejection.
    expect(() => service.daily('2026-02-30')).toThrow(BadRequestException);
  });
});
