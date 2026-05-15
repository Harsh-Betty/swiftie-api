# Data Pipeline

The source-of-truth data lives in `packages/data/src/data`.

## Local Env

Use one `.env` file at the repo root. `pnpm ingest` loads it automatically with `--env-file-if-exists=.env`. Spotify credentials are optional; MusicBrainz and Cover Art Archive do not require local credentials.

## Updating Album And Song Metadata

1. Edit the relevant album or song JSON in `packages/data/src/data`.
2. For album enrichment, make sure the album has a `musicbrainzReleaseGroupId`.
3. Preview changes:

   ```bash
   pnpm ingest --albums=<slug> --dry-run --verbose
   ```

4. Apply changes:

   ```bash
   pnpm ingest --albums=<slug>
   ```

5. Review and commit the resulting JSON diff.

Manual overrides can live in `packages/data/src/data/overrides/<slug>.json`. Overrides win over adapter output and should be used when an upstream source returns incorrect metadata.
