import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface MinimalPackageJson {
  name?: string;
  version?: string;
}

function findPackageJson(startDir: string, expectedName: string): MinimalPackageJson {
  let current = startDir;
  for (let depth = 0; depth < 6; depth++) {
    const candidate = join(current, 'package.json');
    if (existsSync(candidate)) {
      try {
        const parsed = JSON.parse(readFileSync(candidate, 'utf-8')) as MinimalPackageJson;
        if (parsed.name === expectedName) return parsed;
      } catch {
        // ignore malformed package.json on the way up
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return {};
}

const serverPkg = findPackageJson(__dirname, '@swiftie-api/server');

export const SERVER_VERSION: string = serverPkg.version ?? '0.0.0';
export const SERVER_PACKAGE_NAME = '@swiftie-api/server';
export const DATA_PACKAGE_NAME = '@swiftie-api/data';

export function readDataPackageVersion(): string {
  try {
    const entry = require.resolve('@swiftie-api/data');
    const dataPkg = findPackageJson(dirname(entry), '@swiftie-api/data');
    return dataPkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
