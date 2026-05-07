import MiniSearch from 'minisearch';
import { ALBUM_SLUGS } from '../__generated__/album-index';
import { getSongsByAlbum } from './song';

export interface LyricSearchDocument {
  id: string;
  songSlug: string;
  albumSlug: string;
  songTitle: string;
  section: string;
  lineNumber: number;
  text: string;
}

export interface LyricSearchResult extends LyricSearchDocument {
  score: number;
}

let indexPromise: Promise<MiniSearch<LyricSearchDocument>> | null = null;

async function buildIndex(): Promise<MiniSearch<LyricSearchDocument>> {
  const docs: LyricSearchDocument[] = [];

  await Promise.all(
    ALBUM_SLUGS.map(async (albumSlug) => {
      const songs = await getSongsByAlbum(albumSlug);
      for (const song of songs) {
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
    tokenize: (text) => text.toLowerCase().split(/\W+/u).filter(Boolean),
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

export async function searchLyrics(query: string): Promise<LyricSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const index = await getIndex();
  return index.search(trimmed).map((hit) => ({
    id: hit.id as string,
    songSlug: hit.songSlug as string,
    albumSlug: hit.albumSlug as string,
    songTitle: hit.songTitle as string,
    section: hit.section as string,
    lineNumber: hit.lineNumber as number,
    text: hit.text as string,
    score: hit.score,
  }));
}
