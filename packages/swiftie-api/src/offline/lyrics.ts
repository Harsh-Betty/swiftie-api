import MiniSearch from 'minisearch';

import { ALBUM_SLUGS } from '../__generated__/meta.js';
import type {
  AlbumWithSongs,
  LyricMatch,
  LyricSearchResult,
  SearchLyricsOptions,
} from '../shared/types.js';

interface LyricSearchDocument {
  id: string;
  songSlug: string;
  albumSlug: string;
  songTitle: string;
  section: string;
  lineNumber: number;
  text: string;
}

let indexPromise: Promise<MiniSearch<LyricSearchDocument>> | null = null;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/u).filter(Boolean);
}

async function loadAlbumWithSongs(slug: string): Promise<AlbumWithSongs> {
  const mod = (await import(`./albums/${slug}.js`)) as { default: AlbumWithSongs };
  return mod.default;
}

async function buildIndex(): Promise<MiniSearch<LyricSearchDocument>> {
  const docs: LyricSearchDocument[] = [];

  await Promise.all(
    ALBUM_SLUGS.map(async (albumSlug) => {
      const album = await loadAlbumWithSongs(albumSlug);
      for (const song of album.songs) {
        for (const section of song.lyrics.sections) {
          section.lines.forEach((line, lineIdx) => {
            if (line.length === 0) return;
            docs.push({
              id: `${song.slug}::${section.name}::${lineIdx}`,
              songSlug: song.slug,
              albumSlug,
              songTitle: song.title,
              section: section.name,
              lineNumber: lineIdx,
              text: line,
            });
          });
        }
      }
    }),
  );

  const search = new MiniSearch<LyricSearchDocument>({
    fields: ['text', 'songTitle'],
    storeFields: ['songSlug', 'albumSlug', 'songTitle', 'section', 'lineNumber', 'text'],
    tokenize,
    processTerm: (term) => term.toLowerCase(),
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { text: 2 },
    },
  });

  search.addAll(docs);
  return search;
}

function getIndex(): Promise<MiniSearch<LyricSearchDocument>> {
  indexPromise ??= buildIndex();
  return indexPromise;
}

// Find every case-insensitive occurrence of `term` in `text` and return
// half-open character ranges. Whole-string indexOf (rather than word-boundary
// regex) keeps multi-word phrases and partial-token matches highlightable in
// line with MiniSearch's prefix/fuzzy behavior.
function findRanges(text: string, term: string): Array<[number, number]> {
  if (!term) return [];
  const haystack = text.toLowerCase();
  const needle = term.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let from = 0;
  while (from <= haystack.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    ranges.push([idx, idx + needle.length]);
    from = idx + needle.length;
  }
  return ranges;
}

function buildMatches(text: string, terms: string[]): LyricMatch[] {
  const out: LyricMatch[] = [];
  for (const term of terms) {
    const ranges = findRanges(text, term);
    if (ranges.length > 0) out.push({ term, ranges });
  }
  return out;
}

export async function searchLyrics(
  query: string,
  opts: SearchLyricsOptions = {},
): Promise<LyricSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const index = await getIndex();
  const tokens = Array.from(new Set(tokenize(trimmed)));
  const hits = index.search(trimmed);

  const mapped: LyricSearchResult[] = hits.map((hit) => {
    const text = hit.text as string;
    return {
      id: hit.id as string,
      songSlug: hit.songSlug as string,
      albumSlug: hit.albumSlug as string,
      songTitle: hit.songTitle as string,
      section: hit.section as string,
      lineNumber: hit.lineNumber as number,
      text,
      score: hit.score,
      matches: buildMatches(text, tokens),
    };
  });

  if (opts.limit !== undefined && opts.limit >= 0) {
    return mapped.slice(0, opts.limit);
  }
  return mapped;
}
