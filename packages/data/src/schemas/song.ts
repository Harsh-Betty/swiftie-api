import * as z from 'zod';
import { LyricsSchema } from './lyric';
import { MusicVideoSchema } from './music-video';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SlugSchema = z.string().regex(slugPattern);

export const SongSchema = z.strictObject({
  slug: SlugSchema,
  title: z.string().min(1),
  albumSlug: SlugSchema,
  trackNumber: z.number().int().positive(),
  discNumber: z.number().int().positive().default(1),
  durationSeconds: z.number().int().nonnegative(),
  writers: z.array(z.string()),
  producers: z.array(z.string()),
  features: z.array(z.string()),
  isVaultTrack: z.boolean().default(false),
  isBonusTrack: z.boolean().default(false),
  isPromotionalRelease: z.boolean().default(false),
  releaseDate: z.iso.date().optional(),
  musicbrainzRecordingId: z.string().optional(),
  spotifyTrackId: z.string().optional(),
  isrc: z.string().optional(),
  musicVideo: MusicVideoSchema.optional(),
  moods: z.array(z.string()),
  themes: z.array(z.string()),
  lyrics: LyricsSchema,
  credits: z.string().optional(),
});

export type Song = z.infer<typeof SongSchema>;
