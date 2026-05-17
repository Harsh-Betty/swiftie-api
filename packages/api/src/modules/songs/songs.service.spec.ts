import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { SongsService } from './songs.service';

describe('SongsService', () => {
  const service = new SongsService();

  it('findOne("cruel-summer", true) returns the song with a hasLyrics flag', async () => {
    const result = await service.findOne('cruel-summer', true);
    expect(result.slug).toBe('cruel-summer');
    expect(typeof result.hasLyrics).toBe('boolean');
    expect('lyrics' in result).toBe(true);
  });

  it('findOne("cruel-summer", false) omits the lyrics payload', async () => {
    const result = await service.findOne('cruel-summer', false);
    expect('lyrics' in result).toBe(false);
  });

  it('findOne("does-not-exist", true) throws NotFoundException', async () => {
    await expect(service.findOne('does-not-exist', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});
