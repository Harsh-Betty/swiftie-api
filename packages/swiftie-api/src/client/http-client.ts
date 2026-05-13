import { SwiftieApiError } from './errors.js';
import type { CreateClientOptions, SwiftieApiFetch } from './types.js';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ResolvedClientOptions {
  baseUrl: string;
  fetchImpl: SwiftieApiFetch;
  timeoutMs: number;
  headers: Record<string, string>;
}

export function resolveOptions(opts: CreateClientOptions): ResolvedClientOptions {
  if (!opts.baseUrl) {
    throw new TypeError('createClient: `baseUrl` is required.');
  }
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('createClient: no fetch implementation available.');
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...opts.headers,
  };
  if (opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }
  return {
    baseUrl: opts.baseUrl.replace(/\/+$/, ''),
    fetchImpl,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    headers,
  };
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, unknown>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalized}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await res.json().catch(() => null);
  }
  const text = await res.text().catch(() => '');
  return text;
}

interface RequestEnvelope<T> {
  data: T;
}

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as RequestEnvelope<T>).data;
  }
  return body as T;
}

export class SwiftieHttpClient {
  constructor(private readonly opts: ResolvedClientOptions) {}

  /**
   * GET wrapper that returns the response body as-is (envelope retained).
   * Use this for paginated endpoints that return `{ data, meta }`.
   */
  async getRaw<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(this.opts.baseUrl, path, query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    try {
      const res = await this.opts.fetchImpl(url, {
        method: 'GET',
        headers: this.opts.headers,
        signal: controller.signal,
      });
      const body = await parseBody(res);
      if (!res.ok) {
        throw new SwiftieApiError(
          res.status,
          url,
          body,
          `Swiftie API request failed: ${res.status} ${res.statusText} at ${url}`,
        );
      }
      return body as T;
    } catch (err) {
      if (err instanceof SwiftieApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SwiftieApiError(
          0,
          url,
          null,
          `Request timed out after ${this.opts.timeoutMs}ms: ${url}`,
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new SwiftieApiError(0, url, null, `Network error: ${message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * GET wrapper for single-resource endpoints. Unwraps the response from the
   * server's `{ data, meta }` envelope when present, otherwise returns the
   * body verbatim.
   */
  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    const body = await this.getRaw<unknown>(path, query);
    return unwrap<T>(body);
  }
}
