# Credits

swiftie-api wouldn't exist without the work of the people and projects listed here. Thank you.

If you believe something is missing or incorrectly attributed, please [open an issue](https://github.com/Harsh-Betty/swiftie-api/issues).

---

## Data sources

### sagesolar / Corpus-of-Taylor-Swift

| | |
|---|---|
| **Link** | https://github.com/sagesolar/Corpus-of-Taylor-Swift |
| **What we use it for** | Primary lyrics dataset. The corpus covers albums through *The Tortured Poets Department* and *The Eras Tour*, and is the foundation for the lyrics and quotes data in `packages/data/src/data/`. |
| **License** | Not explicitly licensed — used for fan/non-commercial purposes. Original lyrics are the intellectual property of Taylor Swift and her co-writers. |

---

### wjakethompson / taylor

| | |
|---|---|
| **Link** | https://github.com/wjakethompson/taylor |
| **What we use it for** | Cross-reference for track metadata (album membership, vault track flags, Taylor's Version mappings, BPM, time signatures). Used during manual data entry to verify accuracy. |
| **License** | MIT |

---

### MusicBrainz

| | |
|---|---|
| **Link** | https://musicbrainz.org |
| **What we use it for** | Authoritative source for release metadata — release dates, track ISRCs, recording IDs, label info. The ingestion script (`scripts/ingest.ts`) queries the MusicBrainz JSON API at runtime using album MBIDs stored in the data files. |
| **License** | Data: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain) |

---

### Cover Art Archive

| | |
|---|---|
| **Link** | https://coverartarchive.org |
| **What we use it for** | Album cover art URLs. The ingestion script resolves `coverArt.sources.coverArtArchive` via the Cover Art Archive API, keyed by MusicBrainz release-group MBID. Individual image licenses vary by submission. |
| **License** | API: free to use. Individual images: per-submission (see https://musicbrainz.org/doc/Cover_Art_Archive) |

---

## Libraries

> This section will grow as the project matures. Key runtime dependencies will be acknowledged here once the full stack is built out (Phases 2–10).

| Library | Used for | License |
|---|---|---|
| [NestJS](https://nestjs.com) | API framework (`@swiftie-api/server`) | MIT |
| [Zod](https://zod.dev) | Schema validation across all packages | MIT |
| [MiniSearch](https://lucaong.github.io/minisearch/) | In-memory full-text lyric search | MIT |
| [Preact](https://preactjs.com) | Frontend UI (`packages/api/frontend`) | MIT |
| [Vite](https://vitejs.dev) | Frontend build tooling | MIT |
| [Tailwind CSS](https://tailwindcss.com) | Frontend styling | MIT |
| [Biome](https://biomejs.dev) | Linting and formatting | MIT |
| [tsdown](https://github.com/sxzz/tsdown) | npm package bundling | MIT |
| [Changesets](https://github.com/changesets/changesets) | Versioning and changelog | MIT |
| [pino](https://getpino.io) | Structured logging | MIT |
| [lru-cache](https://github.com/isaacs/node-lru-cache) | In-process LRU cache for image providers | ISC |

---

## Inspiration

### MitanshiKshatriya / taylor-swift-api

| | |
|---|---|
| **Link** | https://github.com/MitanshiKshatriya/taylor-swift-api |
| **What it is** | An earlier Taylor Swift REST API project that demonstrated the appetite for this kind of resource in the developer community. |
| **How it helped** | Served as a reference point for endpoint design and data shape decisions early in the planning of swiftie-api. |
| **License** | MIT |

---

*swiftie-api is an independent, fan-made project. It is not affiliated with, endorsed by, or connected to Taylor Swift, Taylor Swift Productions, Republic Records, or any related rights-holders. All song titles, lyrics, and album names are the intellectual property of their respective owners.*
