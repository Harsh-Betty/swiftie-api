import * as z from 'zod';

export const LyricLineSchema = z.string();

export const LyricSectionSchema = z.strictObject({
  name: z.string().min(1),
  lines: z.array(LyricLineSchema),
});

export const LyricsSchema = z.strictObject({
  sections: z.array(LyricSectionSchema),
});

export type LyricLine = z.infer<typeof LyricLineSchema>;
export type LyricSection = z.infer<typeof LyricSectionSchema>;
export type Lyrics = z.infer<typeof LyricsSchema>;
