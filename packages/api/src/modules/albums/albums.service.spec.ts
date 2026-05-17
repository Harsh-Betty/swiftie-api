import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AlbumsService } from './albums.service';

describe('AlbumsService', () => {
  const service = new AlbumsService();

  it('findOne("lover") returns the Lover album', async () => {
    const album = await service.findOne('lover');
    expect(album.slug).toBe('lover');
    expect(album.title).toBe('Lover');
  });

  it('findOne("does-not-exist") throws NotFoundException', async () => {
    await expect(service.findOne('does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });
});
