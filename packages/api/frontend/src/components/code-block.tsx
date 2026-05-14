import { useState } from 'preact/hooks';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
}

export function CodeBlock({ code, language = 'bash', label }: Readonly<CodeBlockProps>) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div class="group relative overflow-hidden rounded-lg border border-stone-200 bg-stone-900">
      <div class="flex items-center justify-between border-b border-stone-800 px-4 py-2 text-xs text-stone-400">
        <span class="font-mono uppercase tracking-wider">{label ?? language}</span>
        <button
          type="button"
          onClick={copy}
          class="rounded px-2 py-1 text-xs text-stone-300 transition-colors hover:bg-stone-800 hover:text-cream"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre class="overflow-x-auto p-4 text-sm leading-relaxed text-stone-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
