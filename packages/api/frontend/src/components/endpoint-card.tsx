import { useState } from 'preact/hooks';
import { ApiError, api } from '../lib/api';
import { CodeBlock } from './code-block';

export interface EndpointSpec {
  method: 'GET';
  path: string;
  summary: string;
  description?: string;
}

type RunState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; status: number; body: unknown; ms: number }
  | { kind: 'err'; status: number; body: unknown; ms: number };

function curlFor(path: string) {
  return `curl -s http://localhost:3000/api/v1${path} | jq`;
}

export function EndpointCard({ method, path, summary, description }: Readonly<EndpointSpec>) {
  const [state, setState] = useState<RunState>({ kind: 'idle' });
  const [open, setOpen] = useState(false);

  async function run() {
    setState({ kind: 'loading' });
    setOpen(true);
    const started = performance.now();
    try {
      const body = await api<unknown>(path);
      setState({ kind: 'ok', status: 200, body, ms: Math.round(performance.now() - started) });
    } catch (err) {
      const ms = Math.round(performance.now() - started);
      if (err instanceof ApiError) {
        setState({ kind: 'err', status: err.status, body: err.body, ms });
      } else {
        setState({ kind: 'err', status: 0, body: (err as Error).message, ms });
      }
    }
  }

  return (
    <article class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
              {method}
            </span>
            <code class="truncate font-mono text-sm text-stone-900">/api/v1{path}</code>
          </div>
          <p class="mt-1.5 text-sm text-stone-600">{summary}</p>
          {description ? <p class="mt-1 text-xs text-stone-500">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={state.kind === 'loading'}
          class="shrink-0 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-stone-800 disabled:opacity-50"
        >
          {state.kind === 'loading' ? 'Running…' : 'Run'}
        </button>
      </header>

      <div class="mt-4">
        <CodeBlock code={curlFor(path)} language="bash" label="curl" />
      </div>

      {state.kind !== 'idle' && (
        <div class="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            class="flex w-full items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 hover:bg-stone-100"
          >
            <span>
              {state.kind === 'loading' ? (
                <>Fetching response…</>
              ) : state.kind === 'ok' ? (
                <>
                  <span class="font-mono font-semibold text-emerald-700">{state.status}</span>{' '}
                  <span class="text-stone-500">· {state.ms}ms</span>
                </>
              ) : (
                <>
                  <span class="font-mono font-semibold text-red-700">{state.status || 'ERR'}</span>{' '}
                  <span class="text-stone-500">· {state.ms}ms</span>
                </>
              )}
            </span>
            <span class="text-stone-500">{open ? '▾' : '▸'}</span>
          </button>
          {open && state.kind !== 'loading' && (
            <pre class="mt-2 max-h-72 overflow-auto rounded-md border border-stone-200 bg-stone-950 p-3 font-mono text-xs leading-relaxed text-stone-100">
              {JSON.stringify(state.body, null, 2)}
            </pre>
          )}
        </div>
      )}
    </article>
  );
}
