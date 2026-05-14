import { useEffect, useState } from 'preact/hooks';
import { apiData } from '../lib/api';
import { EraBadge } from './era-badge';

interface Quote {
  id: string;
  text: string;
  songSlug: string;
  albumSlug: string;
  section?: string;
  mood?: string;
  featured: boolean;
}

interface QuoteCardProps {
  endpoint?: string;
  title?: string;
}

export function QuoteCard({
  endpoint = '/quotes/daily',
  title = 'Quote of the day',
}: Readonly<QuoteCardProps>) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiData<Quote>(endpoint)
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  return (
    <figure class="relative rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <p class="text-xs font-medium uppercase tracking-widest text-stone-500">{title}</p>
      {error ? (
        <p class="mt-4 text-sm text-red-700">Could not load quote: {error}</p>
      ) : quote ? (
        <>
          <blockquote class="mt-4 font-display text-2xl leading-snug text-stone-900 sm:text-3xl">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption class="mt-5 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <EraBadge slug={quote.albumSlug} label={quote.albumSlug.replaceAll('-', ' ')} />
            <span class="text-stone-400">&middot;</span>
            <span class="font-medium text-stone-700">{quote.songSlug.replaceAll('-', ' ')}</span>
            {quote.mood ? (
              <>
                <span class="text-stone-400">&middot;</span>
                <span class="italic text-stone-500">{quote.mood}</span>
              </>
            ) : null}
          </figcaption>
        </>
      ) : (
        <div class="mt-4 h-16 animate-pulse rounded-md bg-stone-100" />
      )}
    </figure>
  );
}
