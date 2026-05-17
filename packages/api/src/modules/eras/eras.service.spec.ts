import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ErasService } from './eras.service';

describe('ErasService', () => {
  const service = new ErasService();

  it('list() returns at least one era', async () => {
    const eras = await service.list();
    expect(eras.length).toBeGreaterThan(0);
    expect(eras[0]?.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('findOne("does-not-exist") throws NotFoundException', async () => {
    await expect(service.findOne('does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });
});
