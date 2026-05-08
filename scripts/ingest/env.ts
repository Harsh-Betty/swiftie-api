import * as z from 'zod';

const IngestEnvSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
});

export type IngestEnv = z.infer<typeof IngestEnvSchema>;

export function parseEnv(): IngestEnv {
  return IngestEnvSchema.parse({
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || undefined,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || undefined,
  });
}
