/**
 * djb2 string hash. Stable across runtimes, browser-safe (no crypto module).
 * Produces an unsigned 32-bit integer.
 */
export const djb2 = (input: string): number => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = Math.trunc((hash << 5) + hash + (input.codePointAt(i) ?? 0));
  }
  return hash >>> 0;
};

/**
 * FNV-1a 32-bit string hash. Used for deterministic date-keyed selection
 * (e.g. daily quote). Math.imul keeps the multiplication 32-bit even when
 * intermediate values exceed Number's safe integer range.
 */
export const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.codePointAt(i) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};
