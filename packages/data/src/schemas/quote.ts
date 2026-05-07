import * as z from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SlugSchema = z.string().regex(slugPattern);

export const QuoteSchema = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1).max(300),
  songSlug: SlugSchema,
  albumSlug: SlugSchema,
  section: z.string().optional(),
  lineNumbers: z.array(z.number().int().nonnegative()).optional(),
  mood: z.string().optional(),
  featured: z.boolean().default(false),
});

export type Quote = z.infer<typeof QuoteSchema>;
