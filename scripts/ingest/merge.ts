import type { Album, Song } from '../../packages/data/src/schemas';
import type { Summary } from './diff';

export type MergeOpts = {
  source: string;
  summary?: Summary;
  scope: { kind: 'album' | 'song'; albumSlug: string; songSlug?: string };
};

const NEVER_TOUCH_KEYS = new Set<string>(['lyrics']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUnset(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function mergeFill(
  current: unknown,
  partial: unknown,
  opts: MergeOpts,
  path: string,
): { value: unknown; filled: boolean } {
  if (partial === undefined) return { value: current, filled: false };

  if (isPlainObject(current) && isPlainObject(partial)) {
    const next: Record<string, unknown> = { ...current };
    let anyFilled = false;
    for (const [k, v] of Object.entries(partial)) {
      if (NEVER_TOUCH_KEYS.has(k)) continue;
      const sub = mergeFill(current[k], v, opts, path ? `${path}.${k}` : k);
      if (sub.filled) {
        next[k] = sub.value;
        anyFilled = true;
      }
    }
    return { value: next, filled: anyFilled };
  }

  if (!isUnset(current)) {
    if (!deepEqual(current, partial) && !isUnset(partial)) {
      opts.summary?.recordUnchanged({ scope: opts.scope, source: opts.source, field: path });
    }
    return { value: current, filled: false };
  }
  if (isUnset(partial)) return { value: current, filled: false };
  if (deepEqual(current, partial)) return { value: current, filled: false };

  opts.summary?.recordFill({
    scope: opts.scope,
    source: opts.source,
    field: path,
    before: current,
    after: partial,
  });
  return { value: partial, filled: true };
}

function applyOverrideDeep(
  current: unknown,
  override: unknown,
  opts: MergeOpts,
  path: string,
): unknown {
  if (override === undefined) return current;
  if (isPlainObject(current) && isPlainObject(override)) {
    const next: Record<string, unknown> = { ...current };
    for (const [k, v] of Object.entries(override)) {
      if (NEVER_TOUCH_KEYS.has(k)) continue;
      next[k] = applyOverrideDeep(current[k], v, opts, path ? `${path}.${k}` : k);
    }
    return next;
  }
  if (!deepEqual(current, override)) {
    opts.summary?.recordFill({
      scope: opts.scope,
      source: opts.source,
      field: path,
      before: current,
      after: override,
      forced: true,
    });
  }
  return override;
}

function stripNeverTouch<T extends Record<string, unknown>>(value: Partial<T>): Partial<T> {
  const next: Record<string, unknown> = { ...value };
  for (const k of NEVER_TOUCH_KEYS) {
    delete next[k];
  }
  return next as Partial<T>;
}

export function mergeAlbum(current: Album, partial: Partial<Album>, opts: MergeOpts): Album {
  const cleaned = stripNeverTouch(partial);
  const result = mergeFill(current, cleaned, opts, '');
  return result.value as Album;
}

export function mergeSong(current: Song, partial: Partial<Song>, opts: MergeOpts): Song {
  const cleaned = stripNeverTouch(partial);
  const result = mergeFill(current, cleaned, opts, '');
  return result.value as Song;
}

export function applyAlbumOverride(
  current: Album,
  override: Partial<Album>,
  opts: MergeOpts,
): Album {
  const cleaned = stripNeverTouch(override);
  return applyOverrideDeep(current, cleaned, opts, '') as Album;
}

export function applySongOverride(current: Song, override: Partial<Song>, opts: MergeOpts): Song {
  const cleaned = stripNeverTouch(override);
  return applyOverrideDeep(current, cleaned, opts, '') as Song;
}
