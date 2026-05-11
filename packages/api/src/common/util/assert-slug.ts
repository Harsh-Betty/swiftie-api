import { BadRequestException } from '@nestjs/common';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSlug(value: string, label: string): void {
  if (!SLUG_RE.test(value)) {
    throw new BadRequestException(`${label} must be kebab-case (got "${value}").`);
  }
}
