import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { LyricsService } from './lyrics.service';

describe('LyricsService', () => {
  const service = new LyricsService();

  it('findBySong("cruel-summer") throws NotFoundException when lyrics are unavailable', async () => {
    // Seeded data ships song metadata without lyric sections, so this path
    // exercises the LYRICS_UNAVAILABLE branch.
    await expect(service.findBySong('cruel-summer')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findBySong("does-not-exist") throws NotFoundException for an unknown song', async () => {
    await expect(service.findBySong('does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('search returns an array (contract)', async () => {
    const results = await service.search('summer', 10);
    expect(Array.isArray(results)).toBe(true);
  });
});
