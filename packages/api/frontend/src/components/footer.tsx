const LINKS = [
  { href: 'https://github.com/Harsh-Betty/swiftie-api', label: 'GitHub' },
  { href: 'https://www.npmjs.com/package/swiftie-api', label: 'npm' },
  { href: '/api/v1/docs', label: 'API Docs', external: true },
];

export function Footer() {
  return (
    <footer class="mt-24 border-t border-stone-200 bg-stone-50">
      <div class="mx-auto max-w-6xl px-6 py-10">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-stone-600">
            Made with <span>❤️</span> by{' '}
            <a
              href="https://github.com/Harsh-Betty"
              target="_blank"
              rel="noreferrer"
              class="font-medium text-stone-900 hover:underline"
            >
              Harshvardhan Singh
            </a>
            .
          </p>
          <ul class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external || link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.external || link.href.startsWith('http') ? 'noreferrer' : undefined}
                  class="text-stone-600 transition-colors hover:text-stone-900 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p class="mt-8 max-w-3xl text-xs leading-relaxed text-stone-500">
          Swiftie API is a fan-made project. It is not affiliated with, endorsed by, or sponsored by
          Taylor Swift, her management, her record labels, or any rights-holder.
        </p>
      </div>
    </footer>
  );
}
