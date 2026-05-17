# Swiftie API

> A free, open-source, fan-made API for Taylor Swift discography, eras, quotes, and metadata.

[![npm version](https://img.shields.io/npm/v/swiftie-api.svg)](https://www.npmjs.com/package/swiftie-api)
[![Build status](https://img.shields.io/github/actions/workflow/status/Harsh-Betty/swiftie-api/ci.yml?branch=main)](https://github.com/Harsh-Betty/swiftie-api/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Swiftie API is a community-maintained project that exposes a clean, typed interface to Taylor
Swift's discography, eras, quotes, and related metadata. It ships as both a hosted REST API and
a typed TypeScript npm package, so you can pick whichever fits your project.

## Features

- Albums, tracks, and eras with stable identifiers.
- Curated lyric quotes and explicit lyrics-availability metadata.
- Cross-linked metadata via MusicBrainz and the Cover Art Archive.
- Strongly-typed TypeScript client (zero runtime deps for consumers where possible).
- Pluggable image provider interface for cover art.

## Quick start

### Hosted API

```bash
curl https://swiftie-api.hrshvrdhn.com/api/v1/albums
```

### npm package

```bash
pnpm add swiftie-api
```

```ts
import { createClient } from 'swiftie-api';

const client = createClient({
  baseUrl: 'https://swiftie-api.hrshvrdhn.com',
});
const albums = await client.albums.list();
```

## Documentation

Full API reference is published at `/api/v1/docs` once the service is deployed.
The OpenAPI JSON is served by `packages/api` at `/api/v1/docs-json`.

## Updating data

Source-of-truth JSON for albums and songs lives in `packages/data/src/data/`. The
`pnpm ingest` script enriches those files locally from MusicBrainz, Cover Art
Archive, and (optionally) Spotify. It never runs in CI.

1. Edit the album JSON at `packages/data/src/data/albums/<slug>.json` and supply
   `musicbrainzReleaseGroupId`. Adapters skip albums that lack an MBID.
2. Preview the changes:

   ```bash
   pnpm ingest --albums=<slug> --dry-run --verbose
   ```

3. Apply them:

   ```bash
   pnpm ingest --albums=<slug>
   ```

4. Commit the resulting JSON diff and redeploy.

If an external source returns a wrong value, add a manual override at
`packages/data/src/data/overrides/<slug>.json`. Override files have the highest
priority and force-overwrite any defined field:

```json
{
  "album": { "label": "Big Machine Records" },
  "songs": {
    "cruel-summer": { "isrc": "USUG12000xx" }
  }
}
```

Spotify enrichment is optional. Copy `.env.example` to `.env` and fill
`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` to enable it. MusicBrainz and
Cover Art Archive require no credentials.

Other useful flags: `--all` (default), `--only=musicbrainz` to run a single
adapter.

## Roadmap

See [FEATURES.md](./FEATURES.md) for the current roadmap.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull
request.

## Credits

Swiftie API would not be possible without the work of several upstream projects and datasets.
See [CREDITS.md](./CREDITS.md) for a full list with licenses.

## License

[MIT](./LICENSE) © 2026 Harshvardhan Singh.

---

**Disclaimer:** Swiftie API is a fan-made project. Data accuracy is best-effort and contributed
by the community. This project is **not affiliated with, endorsed by, or sponsored by** Taylor
Swift, her management, her record labels, or any rights-holder.
