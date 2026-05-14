import { useLocation } from 'preact-iso';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/examples', label: 'Examples' },
  { href: '/api/v1/docs', label: 'API Reference', external: true },
];

export function Nav() {
  const { path } = useLocation();

  return (
    <header class="border-b border-stone-200 bg-parchment/90 backdrop-blur sticky top-0 z-10">
      <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" class="flex items-center gap-2 font-display text-xl font-semibold">
          <span class="inline-block h-7 w-7 rounded-md" aria-hidden="true">
            <img src="/logo.png" alt="Swiftie API" class="h-7 w-7" />
          </span>
          <span>Swiftie API</span>
        </a>
        <ul class="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = !link.external && path === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  class={`rounded-md px-3 py-1.5 transition-colors ${
                    active
                      ? 'bg-stone-900 text-cream'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
