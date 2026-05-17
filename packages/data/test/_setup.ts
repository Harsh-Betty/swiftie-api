import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The loaders use dist-relative dynamic JSON imports (e.g. `./data/albums/x.json`)
// so that the published bundle can pick up the JSON files copied next to it by
// tsdown. When tests exercise the source files directly (for accurate coverage),
// Node resolves those paths against `src/loaders/`, which has no `data/` sibling.
// This global setup mirrors `src/data` next to the loaders before tests run.
const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const source = join(packageRoot, 'src/data');
const target = join(packageRoot, 'src/loaders/data');

export function setup(): void {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
  cpSync(source, target, { recursive: true });
}

export function teardown(): void {
  rmSync(target, { recursive: true, force: true });
}
