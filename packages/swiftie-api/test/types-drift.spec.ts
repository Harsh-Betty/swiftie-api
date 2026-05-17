/**
 * Build-time drift guard.
 *
 * Asserts at the TYPE level that the hand-rolled public types in
 * `src/shared/types.ts` stay structurally equivalent to the zod-inferred types
 * in `@swiftie-api/data`. If a field is added or changed in the data package
 * schemas without a matching update here, this file fails to compile and the
 * vitest run fails.
 *
 * The file lives in `test/` (not an `entry` of tsdown), so the zod-tainted
 * `.d.ts` of `@swiftie-api/data` is referenced only at typecheck/test time and
 * never leaks into the published bundle.
 */

import type {
  Album as DataAlbum,
  AlbumSlug as DataAlbumSlug,
  Era as DataEra,
  Quote as DataQuote,
  Song as DataSong,
} from '@swiftie-api/data';
import { describe, expect, it } from 'vitest';

import type { Album, AlbumSlug, Era, Quote, Song } from '../src/shared/types.js';

type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Assert<T extends true> = T;

type _AlbumOk = Assert<IsEqual<DataAlbum, Album>>;
type _SongOk = Assert<IsEqual<DataSong, Song>>;
type _QuoteOk = Assert<IsEqual<DataQuote, Quote>>;
type _EraOk = Assert<IsEqual<DataEra, Era>>;
type _AlbumSlugOk = Assert<IsEqual<DataAlbumSlug, AlbumSlug>>;

describe('public type drift guard', () => {
  it('hand-rolled types in src/shared/types.ts match @swiftie-api/data', () => {
    const sentinel: [_AlbumOk, _SongOk, _QuoteOk, _EraOk, _AlbumSlugOk] = [
      true,
      true,
      true,
      true,
      true,
    ];
    expect(sentinel).toEqual([true, true, true, true, true]);
  });
});
