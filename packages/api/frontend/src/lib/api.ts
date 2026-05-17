import type { ApiEnvelope } from '../../../../swiftie-api/src/shared/types';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
    readonly body: unknown,
  ) {
    super(`${status} ${statusText} — ${url}`);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, url, body);
  }

  return body as T;
}

export async function apiData<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await api<ApiEnvelope<T>>(path, init);

  if (!isApiEnvelope<T>(body)) {
    throw new Error(`Expected API response envelope from ${BASE}${path}`);
  }

  return body.data;
}

function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  return typeof body === 'object' && body !== null && 'data' in body;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
