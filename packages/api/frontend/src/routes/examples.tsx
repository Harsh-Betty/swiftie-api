import { useEffect, useState } from 'preact/hooks';
import { CodeBlock } from '../components/code-block';
import { EndpointCard, type EndpointSpec } from '../components/endpoint-card';
import { apiData } from '../lib/api';

type Tab = 'api' | 'npm';
type Reach = 'pending' | 'ok' | 'down';

const ENDPOINTS: EndpointSpec[] = [
  {
    method: 'GET',
    path: '/health',
    summary: 'Liveness probe.',
    description: 'Cheap health check used by orchestrators.',
  },
  {
    method: 'GET',
    path: '/meta',
    summary: 'Dataset counts + server version.',
    description: 'Albums, songs, quote totals, and the list of era slugs.',
  },
  {
    method: 'GET',
    path: '/eras',
    summary: 'List every era in release order.',
  },
  {
    method: 'GET',
    path: '/eras/lover',
    summary: 'Single era hydrated with full album objects.',
  },
  {
    method: 'GET',
    path: '/albums?era=lover',
    summary: 'List albums, filtered by era.',
  },
  {
    method: 'GET',
    path: '/albums/lover/songs',
    summary: 'Track listing for an album.',
  },
  {
    method: 'GET',
    path: '/songs?album=lover',
    summary: 'Song metadata, optionally scoped to an album.',
  },
  {
    method: 'GET',
    path: '/lyrics/cardigan',
    summary: 'Lyrics payload when structured lyric sections are available.',
    description: 'Returns LYRICS_UNAVAILABLE for known songs without lyric sections.',
  },
  {
    method: 'GET',
    path: '/lyrics/search?q=cruel+summer',
    summary: 'Full-text search across available lyric sections.',
  },
  {
    method: 'GET',
    path: '/quotes/random',
    summary: 'A random curated quote.',
  },
  {
    method: 'GET',
    path: '/quotes/daily',
    summary: 'Deterministic quote-of-the-day (UTC).',
  },
  {
    method: 'GET',
    path: '/images/album/lover',
    summary: 'Cover art for an album.',
    description: 'Resolves through Cover Art Archive, Spotify, and other configured providers.',
  },
];

const NPM_OFFLINE = `import {
  getAlbum,
  getAllAlbums,
  getAlbumWithSongs,
  getSong,
  getDailyQuote,
} from 'swiftie-api';

const lover = getAlbum('lover');                  // sync
const todaysQuote = getDailyQuote();              // sync, deterministic by UTC date
const cardigan = getSong('cardigan');             // sync, SongMeta (no lyrics)

const loverFull = await getAlbumWithSongs('lover');          // async, one album bundle`;

const NPM_HOSTED = `import { createClient, SwiftieApiError } from 'swiftie-api';

const client = createClient({
  baseUrl: 'https://swiftie-api.hrshvrdhn.com',
  timeoutMs: 5000,
});

try {
  const albums = await client.albums.list({ era: 'lover' });
  const cardigan = await client.songs.get('cardigan');
  const quote = await client.quotes.daily();
  console.log(albums.data.length, cardigan.title, quote.text);
} catch (err) {
  if (err instanceof SwiftieApiError) {
    console.error(err.status, err.url, err.body);
  }
}`;

const NPM_SUBPATH = `import lover from 'swiftie-api/albums/lover';

console.log(lover.title, lover.songs.length);
console.log(lover.songs[0].title);`;

export function Examples() {
  const [tab, setTab] = useState<Tab>('api');
  const [reach, setReach] = useState<Reach>('pending');

  useEffect(() => {
    let active = true;
    apiData<unknown>('/meta')
      .then(() => {
        if (active) setReach('ok');
      })
      .catch(() => {
        if (active) setReach('down');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div class="mx-auto max-w-6xl px-6 py-16">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl text-stone-900">Examples</h1>
          <p class="mt-2 text-stone-600">Hit the live API or copy snippets for the npm package.</p>
        </div>
        <ReachPill state={reach} />
      </header>

      <div class="mt-8 inline-flex rounded-lg border border-stone-200 bg-white p-1 text-sm">
        <TabButton current={tab} value="api" onSelect={setTab}>
          API Examples
        </TabButton>
        <TabButton current={tab} value="npm" onSelect={setTab}>
          npm Package
        </TabButton>
      </div>

      <section class="mt-8">
        {tab === 'api' ? (
          <div class="grid gap-4 lg:grid-cols-2">
            {ENDPOINTS.map((e) => (
              <EndpointCard key={e.path} {...e} />
            ))}
          </div>
        ) : (
          <div class="grid gap-6">
            <SnippetBlock
              title="Offline mode (default)"
              body="Bundles album, song, quote, and era metadata and serves most calls synchronously."
            >
              <CodeBlock code={NPM_OFFLINE} language="ts" label="offline.ts" />
            </SnippetBlock>
            <SnippetBlock
              title="Hosted client"
              body="Targets the hosted REST API when you want server-side filtering or shared state."
            >
              <CodeBlock code={NPM_HOSTED} language="ts" label="hosted.ts" />
            </SnippetBlock>
            <SnippetBlock
              title="Per-album subpath"
              body="Only the album you import lands in your bundle — ideal for static sites and edge runtimes."
            >
              <CodeBlock code={NPM_SUBPATH} language="ts" label="lover.ts" />
            </SnippetBlock>
          </div>
        )}
      </section>
    </div>
  );
}

function TabButton({
  current,
  value,
  onSelect,
  children,
}: Readonly<{
  current: Tab;
  value: Tab;
  onSelect: (t: Tab) => void;
  children: preact.ComponentChildren;
}>) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      class={`rounded-md px-4 py-1.5 font-medium transition-colors ${
        active ? 'bg-stone-900 text-cream' : 'text-stone-600 hover:text-stone-900'
      }`}
    >
      {children}
    </button>
  );
}

function ReachPill({ state }: Readonly<{ state: Reach }>) {
  if (state === 'pending') {
    return (
      <span class="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500">
        <span class="h-2 w-2 animate-pulse rounded-full bg-stone-400" />
        Checking api…
      </span>
    );
  }
  if (state === 'ok') {
    return (
      <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
        <span class="h-2 w-2 rounded-full bg-emerald-500" />
        API reachable
      </span>
    );
  }
  return (
    <span class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
      <span class="h-2 w-2 rounded-full bg-red-500" />
      API unreachable
    </span>
  );
}

function SnippetBlock({
  title,
  body,
  children,
}: Readonly<{
  title: string;
  body: string;
  children: preact.ComponentChildren;
}>) {
  return (
    <article class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 class="font-display text-xl text-stone-900">{title}</h3>
      <p class="mt-1 mb-4 text-sm text-stone-600">{body}</p>
      {children}
    </article>
  );
}
