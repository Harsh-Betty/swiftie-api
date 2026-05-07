import * as z from 'zod';

export const MusicVideoSchema = z.strictObject({
  title: z.string().min(1),
  director: z.array(z.string().min(1)),
  releaseDate: z.iso.date(),
  runtimeSeconds: z.number().int().nonnegative(),
  youtubeUrl: z.url().optional(),
  vimeoUrl: z.url().optional(),
});

export type MusicVideo = z.infer<typeof MusicVideoSchema>;
