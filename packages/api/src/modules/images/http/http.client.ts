import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export interface HttpClientOptions {
  userAgent: string;
  timeoutMs?: number;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
    readonly retryAfter: string | null = null,
  ) {
    super(`HTTP ${status} for ${url}: ${body.slice(0, 200)}`);
  }
}

const DEFAULT_TIMEOUT_MS = 8000;
const RETRY_5XX_BACKOFF_MS = 250;
const RETRY_AFTER_FALLBACK_MS = 250;
const RETRY_AFTER_CAP_MS = 5000;

// Retry-After can be either delta-seconds or an HTTP-date (RFC 7231).
// Returns a clamped millisecond delay, or a small fallback on missing/invalid.
export function parseRetryAfterMs(value: string | null, cap = RETRY_AFTER_CAP_MS): number {
  if (!value) return RETRY_AFTER_FALLBACK_MS;
  const trimmed = value.trim();
  if (!trimmed) return RETRY_AFTER_FALLBACK_MS;

  if (/^\d+$/.test(trimmed)) {
    return clamp(Number.parseInt(trimmed, 10) * 1000, 0, cap);
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return RETRY_AFTER_FALLBACK_MS;
  return clamp(parsed - Date.now(), 0, cap);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  constructor(private readonly opts: HttpClientOptions) {}

  async request<T>(url: string, init: RequestInit = {}, attempt = 0): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: { 'User-Agent': this.opts.userAgent, ...init.headers },
      });

      if (attempt === 0 && (res.status >= 500 || res.status === 429)) {
        const wait =
          res.status === 429
            ? parseRetryAfterMs(res.headers.get('retry-after'))
            : RETRY_5XX_BACKOFF_MS;
        clearTimeout(timer);
        if (wait > 0) await sleep(wait);
        return this.request<T>(url, init, attempt + 1);
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new HttpError(res.status, url, body, res.headers.get('retry-after'));
      }
      return (await res.json()) as T;
    } catch (err) {
      throw this.toHttpException(err, url);
    } finally {
      clearTimeout(timer);
    }
  }

  private toHttpException(err: unknown, url: string): Error {
    if (err instanceof HttpException) return err;
    if (err instanceof HttpError) {
      if (err.status === HttpStatus.TOO_MANY_REQUESTS) {
        return new HttpException(
          {
            message: 'Upstream rate limit hit.',
            upstreamStatus: err.status,
            upstreamUrl: url,
            ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return new BadGatewayException(`Upstream returned ${err.status} for ${url}.`);
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return new GatewayTimeoutException(`Upstream timed out: ${url}.`);
    }
    if (err instanceof Error) {
      return new BadGatewayException(`Upstream unreachable: ${err.message}`);
    }
    return new BadGatewayException('Upstream unreachable.');
  }
}
