import { useEffect, useState } from 'preact/hooks';
import { apiData } from '../lib/api';

interface Quote {
  text: string;
  songSlug: string;
  albumSlug: string;
}

export function NotFound() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    let active = true;
    apiData<Quote>('/quotes/random')
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch(() => {
        if (active) setQuote(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div class="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">404</p>
      <h1 class="mt-4 font-display text-5xl text-stone-900">
        We are never ever getting back together with this URL.
      </h1>
      {quote ? (
        <figure class="mt-10 max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <blockquote class="font-display text-lg italic text-stone-800">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption class="mt-3 text-xs uppercase tracking-wider text-stone-500">
            {quote.songSlug.replaceAll('-', ' ')} · {quote.albumSlug.replaceAll('-', ' ')}
          </figcaption>
        </figure>
      ) : null}
      <a
        href="/"
        class="mt-10 inline-flex items-center rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-stone-800"
      >
        Back to home
      </a>
    </div>
  );
}
