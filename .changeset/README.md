# Changesets

This folder is how we ship versions of [`swiftie-api`](../packages/swiftie-api) to npm. Every PR that should reach npm consumers must include a changeset file here.

## When you need a changeset

- **Source change inside `packages/swiftie-api/`** (any TS, any export, any tsdown config) → changeset required. Run `pnpm changeset`, pick `swiftie-api`, pick the bump type (`patch` / `minor` / `major`), and commit the generated `.md` alongside your code.

- **Change inside `packages/data/` that affects bundled output** (any JSON under `src/data/`, any schema in `src/schemas/`, any loader in `src/loaders/`) → **also requires a `swiftie-api` patch changeset**. The public package's `__generated__/meta.ts` and per-album modules are produced at build time from `@swiftie-api/data` by [`packages/swiftie-api/scripts/generate-bundled-data.ts`](../packages/swiftie-api/scripts/generate-bundled-data.ts). Without a changeset the new data lands on `main` but never ships to npm.

- **Internal-only change inside `packages/data/`** that doesn't affect what `generate-bundled-data.ts` consumes (for example, renaming a private helper that isn't re-exported, fixing a typo in a test, or bumping a `packages/data/` devDependency) → no changeset.

- **Change inside `packages/api/` or `packages/api/frontend/`** → no changeset. Those packages are private and deploy via Railway, not npm.

## How releases happen

1. You merge a PR that includes a changeset.
2. The `release.yml` workflow opens (or updates) a "Version Packages" PR with the version bumps and `CHANGELOG.md` entries.
3. A maintainer reviews and merges that PR.
4. Merging it triggers `release.yml` again, which tags the release and publishes `swiftie-api` to npm via OIDC trusted publishing.

`@swiftie-api/data`, `@swiftie-api/server`, and `@swiftie-api/server-frontend` are listed under `ignore` in [`config.json`](./config.json) and are never published.

See the [Changesets docs](https://github.com/changesets/changesets) for more on the format.
