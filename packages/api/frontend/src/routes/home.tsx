import { QuoteCard } from '../components/quote-card';

const FEATURES = [
  {
    title: 'Quotes & Metadata',
    body: 'Curated quotes, explicit lyrics-availability metadata, and a deterministic quote-of-the-day.',
    color: 'var(--color-era-lover)',
  },
  {
    title: 'Albums & Songs',
    body: "Every studio album and Taylor's Version, with full filtering by era, year, and re-recording status.",
    color: 'var(--color-era-midnights)',
  },
  {
    title: 'Album Art & Images',
    body: 'Cover art and search-based imagery sourced from Cover Art Archive, Spotify, Pexels, Unsplash, and Reddit.',
    color: 'var(--color-era-evermore)',
  },
];

export function Home() {
  return (
    <div class="mx-auto max-w-6xl px-6">
      <section class="pt-20 pb-12 sm:pt-28">
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">
          Fan-made · MIT · Open source
        </p>
        <h1 class="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-stone-900 sm:text-6xl">
          A free, open-source API for the entire Taylor Swift discography.
        </h1>
        <p class="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
          Albums, songs, eras, curated quotes, and metadata — served as a small REST API and an npm
          package with offline-bundled data.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="/examples"
            class="inline-flex items-center rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-stone-800"
          >
            Try the API
          </a>
          <a
            href="https://www.npmjs.com/package/swiftie-api"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center rounded-md border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
          >
            View on npm
          </a>
        </div>
      </section>

      <section class="pb-16">
        <QuoteCard />
      </section>

      <section class="grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.title} class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <span
              class="inline-block h-10 w-10 rounded-lg"
              style={{ backgroundColor: f.color }}
              aria-hidden="true"
            />
            <h3 class="mt-4 font-display text-xl text-stone-900">{f.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-600">{f.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
