import { BadGatewayException, GatewayTimeoutException, HttpException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient, parseRetryAfterMs } from './http.client';

type Settled<T> = { ok: true; value: T } | { ok: false; err: unknown };

// Attaches handlers eagerly so the rejection isn't seen as "unhandled"
// while we're advancing fake timers between attempts.
function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (err: unknown) => ({ ok: false as const, err }),
  );
}

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => '',
    headers: new Headers(),
  } as unknown as Response;
}

function failResponse(status: number, retryAfter?: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => `status ${status}`,
    headers: retryAfter ? new Headers({ 'retry-after': retryAfter }) : new Headers(),
  } as unknown as Response;
}

describe('parseRetryAfterMs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the fallback when value is null', () => {
    expect(parseRetryAfterMs(null)).toBe(250);
  });

  it('returns the fallback when value is empty', () => {
    expect(parseRetryAfterMs('   ')).toBe(250);
  });

  it('parses delta-seconds', () => {
    expect(parseRetryAfterMs('3')).toBe(3000);
  });

  it('clamps delta-seconds to the cap', () => {
    expect(parseRetryAfterMs('600')).toBe(5000);
  });

  it('respects a custom cap', () => {
    expect(parseRetryAfterMs('60', 10_000)).toBe(10_000);
  });

  it('parses HTTP-date and computes a delta from now', () => {
    const future = new Date('2026-05-12T12:00:02Z').toUTCString();
    expect(parseRetryAfterMs(future)).toBe(2000);
  });

  it('clamps a past HTTP-date to zero', () => {
    const past = new Date('2026-05-12T11:59:50Z').toUTCString();
    expect(parseRetryAfterMs(past)).toBe(0);
  });

  it('returns the fallback for an invalid value', () => {
    expect(parseRetryAfterMs('not-a-date')).toBe(250);
  });
});

describe('HttpClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let client: HttpClient;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.useFakeTimers();
    client = new HttpClient({ userAgent: 'test/1.0' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on 200', async () => {
    fetchSpy.mockResolvedValueOnce(okResponse({ value: 1 }));
    await expect(client.request('https://x')).resolves.toEqual({ value: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries once on 5xx and succeeds on the second try', async () => {
    fetchSpy
      .mockResolvedValueOnce(failResponse(503))
      .mockResolvedValueOnce(okResponse({ retried: true }));

    const promise = client.request('https://x');
    await vi.advanceTimersByTimeAsync(250);
    await expect(promise).resolves.toEqual({ retried: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('retries once on 429 honouring Retry-After', async () => {
    fetchSpy
      .mockResolvedValueOnce(failResponse(429, '1'))
      .mockResolvedValueOnce(okResponse({ ok: true }));

    const promise = client.request('https://x');
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws BadGatewayException after a second 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(failResponse(503)).mockResolvedValueOnce(failResponse(503));

    const settled = settle(client.request('https://x'));
    await vi.advanceTimersByTimeAsync(250);
    const result = await settled;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.err).toBeInstanceOf(BadGatewayException);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws BadGatewayException on 4xx without retrying', async () => {
    fetchSpy.mockResolvedValueOnce(failResponse(401));
    await expect(client.request('https://x')).rejects.toBeInstanceOf(BadGatewayException);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws HttpException with status 429 after a second 429', async () => {
    fetchSpy
      .mockResolvedValueOnce(failResponse(429, '1'))
      .mockResolvedValueOnce(failResponse(429, '1'));

    const settled = settle(client.request('https://x'));
    await vi.advanceTimersByTimeAsync(1000);
    const result = await settled;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.err).toBeInstanceOf(HttpException);
      expect((result.err as HttpException).getStatus()).toBe(429);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws GatewayTimeoutException on an AbortError', async () => {
    const aborted = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchSpy.mockRejectedValueOnce(aborted);
    await expect(client.request('https://x')).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('throws BadGatewayException on a generic network error', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(client.request('https://x')).rejects.toBeInstanceOf(BadGatewayException);
  });
});
