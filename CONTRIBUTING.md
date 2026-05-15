# Contributing to swiftie-api

Thanks for taking the time to contribute! This is a fan-made, open-source project and every bit of help is appreciated — whether that's fixing a typo, adding lyrics, or wiring up a new image provider.

Please read this document before opening a PR.

---

## Prerequisites

- **Node.js** 24 — use [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`
- **pnpm** 10 — `npm i -g pnpm@latest`
- **Git** 2.40+

Verify before proceeding:

```bash
node -v   # v24.x.x
pnpm -v   # 10.x.x
```

---

## Local setup

```bash
# 1. Clone the repo
git clone https://github.com/Harsh-Betty/swiftie-api.git
cd swiftie-api

# 2. Install all workspace dependencies
pnpm install

# 3. Copy the example env file and fill in any optional API credentials
cp .env.example .env

# 4. Start everything in dev mode (API server + frontend hot-reload)
pnpm dev
```

Once running:

- **API** → `http://localhost:3000/api/v1`
- **Frontend** → `http://localhost:3000`
- **Swagger docs** → `http://localhost:3000/api/v1/docs`

---

## Project structure overview

```
swiftie-api/
├── packages/
│   ├── data/           # @swiftie-api/data — Zod schemas + all JSON data files (private, never published)
│   ├── api/            # @swiftie-api/server — NestJS API + Preact frontend (private, never published)
│   │   └── frontend/   # Preact + Vite + Tailwind v4 landing page and examples
│   └── swiftie-api/    # swiftie-api — the public npm package
├── scripts/
│   └── ingest.ts       # Local data enrichment script (MusicBrainz, Cover Art Archive, Spotify)
├── docs/
│   └── data-pipeline.md
├── CONTRIBUTING.md     # this file
├── CREDITS.md
└── FEATURES.md
```

The three packages form a one-way dependency chain:

```
@swiftie-api/data  ←  @swiftie-api/server
                   ←  swiftie-api (npm package)
```

`@swiftie-api/data` is the single source of truth. It owns all schemas and JSON files. Nothing else writes to it except you (manually) and the ingestion script.

---

## How to add data

All album, song, lyric, and quote data lives in:

```
packages/data/src/data/
├── albums/        # one JSON file per album (e.g. lover.json)
├── songs/         # one JSON file per album's track list (e.g. lover.json)
├── eras.json
├── quotes.json
└── overrides/     # manual field overrides that survive ingestion runs
```

**Steps:**

1. Edit the relevant JSON file(s). Every field must satisfy the Zod schemas in `packages/data/src/schemas/` — the build will fail on invalid data, so you'll know immediately.
2. If you're adding or updating an album, supply its MusicBrainz release-group MBID in the album JSON, then run the ingestion script to backfill metadata and cover art automatically:
  ```bash
   pnpm ingest --albums=<slug> --dry-run   # preview what would change
   pnpm ingest --albums=<slug>             # apply
  ```
   Full guide: [docs/data-pipeline.md](./docs/data-pipeline.md).
3. Verify the package still builds:
  ```bash
   pnpm --filter @swiftie-api/data build
  ```
4. Open a PR describing what you added or corrected and where the data came from.

> **On lyric accuracy:** only submit lyrics you've verified against the official release. If a line is uncertain, leave it as an empty string — a blank is better than a wrong line.

---

## How to add a new image provider

Image providers live in:

```
packages/api/src/modules/images/providers/
```

Every provider is a NestJS `@Injectable()` that implements the `ImageProvider` interface from `image-provider.interface.ts`. Adding a new source is four mechanical steps — no shared code is mutated:

1. **Create the provider file** — copy `cover-art-archive.provider.ts` as a template. Implement `id`, `missingEnv`, `supportsSearch`, `isAvailable()`, and `fetch()`. Use the `HttpClient` wrapper in `../http/http.client.ts` for outbound calls and the shared `LruCacheService` for response caching. Keep the file under 150 lines — push OAuth token caches and other helpers into a sibling subfolder (see `spotify/token-cache.ts`).
2. **Add env var(s)** — extend `packages/api/src/config/env.schema.ts`, the `providers` getter in `packages/api/src/config/config.service.ts`, and `.env.example`.
3. **Register it** — append the new class to two lists in `packages/api/src/modules/images/providers/provider-registry.ts`: `IMAGE_PROVIDER_CLASSES` and (if applicable) `AUTO_SOURCE_PRIORITY`. The module wiring picks them up automatically.
4. **Extend the DTO enum** — add the new source to `ImageSourceEnum` and `SOURCE_TO_PROVIDER_ID` in `image-query.dto.ts`.

Write a unit test in `<your-provider>.provider.spec.ts` covering `isAvailable()` with env stubbed both ways, and one happy-path `fetch()` call with a mocked HTTP response — see `cover-art-archive.provider.spec.ts` for the simplest template.

> The 503 you get back when calling an unconfigured source carries a `details` array listing which env vars are missing and which providers are currently available. That keeps debugging deploys cheap.

---

## Submitting changes

### Branching

Always work on a feature branch:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-fix-name
```

Never commit directly to `main`.

### Changesets — required for `swiftie-api` package changes

If your change touches anything under `packages/swiftie-api/` (new exports, bug fixes, breaking changes), you **must** include a changeset:

```bash
pnpm changeset
```

Select the `swiftie-api` package, choose the correct bump type (`patch` / `minor` / `major`), and write a concise summary. Commit the generated `.changeset/*.md` file alongside your code.

Changes scoped only to `@swiftie-api/data` or `@swiftie-api/server` do not need a changeset — those packages are private and are not published to npm.

### Pre-PR checklist

Run these locally before pushing:

```bash
pnpm lint          # Biome lint check across all packages
pnpm typecheck     # tsc --noEmit across all packages
pnpm test          # Vitest across all packages
pnpm build         # full production build
```

All four must pass. CI enforces the same checks, but catching failures locally is faster.

### Pull request

- Keep PRs focused — one concern per PR makes reviews much easier.
- Fill in the PR description: what changed, why, and how to test it.
- If the PR fixes an issue, link it with `Closes #<number>`.

---

## Code style

Formatting and linting are handled entirely by [Biome](https://biomejs.dev/). There is no ESLint, no Prettier, and no Husky.

```bash
pnpm lint       # check for issues
pnpm format     # auto-fix formatting
```

VS Code users: install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome). The repo's `.vscode/settings.json` enables format-on-save automatically.

The full config is in `biome.json` at the repo root. If a rule is causing friction, open an issue to discuss it rather than scattering inline disable comments through the codebase.

---

## Releasing

Releases are handled by maintainers. The process is fully automated once a changeset is merged:

1. Merged PRs with changesets cause a "Version Packages" PR to be opened automatically by GitHub Actions.
2. A maintainer reviews and merges the version PR.
3. That merge triggers the release workflow, which publishes `swiftie-api` to npm with [provenance attestation](https://docs.npmjs.com/generating-provenance-statements).

As a contributor, you only need to include the changeset. CI handles the rest.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE) that covers this project.

This project is a fan-made, unofficial API. It is not affiliated with, endorsed by, or connected to Taylor Swift, her management, or any rights-holders. Contributors are responsible for ensuring any data they submit is accurate and sourced appropriately.
