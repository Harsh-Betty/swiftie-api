import * as z from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SlugSchema = z.string().regex(slugPattern);
const HexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const EraSchema = z.strictObject({
  slug: SlugSchema,
  name: z.string().min(1),
  displayName: z.string().min(1),
  color: HexColorSchema,
  description: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date().nullable(),
  albumSlugs: z.array(SlugSchema),
  iconographyKeywords: z.array(z.string()),
});

export type Era = z.infer<typeof EraSchema>;
