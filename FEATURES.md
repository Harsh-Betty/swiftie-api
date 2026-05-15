# Features and Roadmap

Swiftie API currently focuses on a small, typed public surface:

- Albums, songs, eras, quotes, and structured metadata.
- A hosted REST API served by `@swiftie-api/server`.
- The `swiftie-api` npm package with offline metadata and optional hosted-client helpers.
- Local ingestion for MusicBrainz, Cover Art Archive, and optional Spotify enrichment.

Near-term work:

- Fill out endpoint-level e2e coverage.
- Expand data quality checks around album and song metadata.
- Add CI/CD workflows in a future phase.
- Continue improving documentation as the API stabilizes.
