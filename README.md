# Swiftie API

> A free, open-source, fan-made API for Taylor Swift discography, lyrics, eras, and metadata.

[![npm version](https://img.shields.io/npm/v/swiftie-api.svg)](https://www.npmjs.com/package/swiftie-api)
[![Build status](https://img.shields.io/github/actions/workflow/status/Harsh-Betty/swiftie-api/ci.yml?branch=main)](https://github.com/Harsh-Betty/swiftie-api/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Swiftie API is a community-maintained project that exposes a clean, typed interface to Taylor
Swift's discography, lyrics, eras, and related metadata. It ships as both a hosted REST API and
a typed TypeScript npm package, so you can pick whichever fits your project.

## Features

- Albums, tracks, and eras with stable identifiers.
- Lyrics with provenance and licensing metadata.
- Cross-linked metadata via MusicBrainz and the Cover Art Archive.
- Strongly-typed TypeScript client (zero runtime deps for consumers where possible).
- Pluggable image provider interface for cover art.

## Quick start

### Hosted API

```bash
curl https://swiftie-api.hrshvrdhn.com/v1/albums
```

### npm package

```bash
pnpm add swiftie-api
```

```ts
import { createClient } from 'swiftie-api';

const client = createClient();
const albums = await client.albums.list();
```

## Documentation

Full API reference is published at `/api/v1/docs` once the service is deployed.
The OpenAPI schema lives in `packages/server` (@TODO: add later).

## Roadmap

See [FEATURES.md](./FEATURES.md) (@TODO: Add roadmap) for the full roadmap.

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
