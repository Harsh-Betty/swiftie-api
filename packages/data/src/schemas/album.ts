import * as z from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SlugSchema = z.string().regex(slugPattern);

export const AlbumTypeSchema = z.enum(['studio', 'taylors_version', 'ep', 'compilation']);

export const TaylorsVersionStatusSchema = z.enum(['released', 'unreleased', 'not_applicable']);

export const TaylorsVersionSchema = z.strictObject({
  status: TaylorsVersionStatusSchema,
  originalAlbumSlug: SlugSchema.optional(),
  taylorsVersionAlbumSlug: SlugSchema.optional(),
});

export const CoverArtSourcesSchema = z.strictObject({
  coverArtArchive: z.url().optional(),
  spotify: z.url().optional(),
  manual: z.url().optional(),
});

export const CoverArtSchema = z.strictObject({
  primary: z.union([z.url(), z.literal('')]),
  sources: CoverArtSourcesSchema,
});

export const AlbumSchema = z.strictObject({
  slug: SlugSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  type: AlbumTypeSchema,
  era: SlugSchema,
  releaseDate: z.iso.date(),
  producers: z.array(z.string()),
  writers: z.array(z.string()),
  label: z.string(),
  totalTracks: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative().optional(),
  taylorsVersion: TaylorsVersionSchema,
  musicbrainzReleaseGroupId: z.string().optional(),
  spotifyAlbumId: z.string().optional(),
  coverArt: CoverArtSchema,
  description: z.string(),
  trivia: z.array(z.string()),
});

export type AlbumType = z.infer<typeof AlbumTypeSchema>;
export type TaylorsVersionStatus = z.infer<typeof TaylorsVersionStatusSchema>;
export type TaylorsVersion = z.infer<typeof TaylorsVersionSchema>;
export type CoverArtSources = z.infer<typeof CoverArtSourcesSchema>;
export type CoverArt = z.infer<typeof CoverArtSchema>;
export type Album = z.infer<typeof AlbumSchema>;
