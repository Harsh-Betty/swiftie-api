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
