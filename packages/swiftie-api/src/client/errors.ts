/**
 * Thrown by the hosted client (`createClient`) for any non-2xx response or
 * transport-level failure. Offline-mode functions never throw this.
 */
export class SwiftieApiError extends Error {
  override readonly name = 'SwiftieApiError';
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(status: number, url: string, body: unknown, message?: string) {
    super(message ?? `Swiftie API request failed: ${status} ${url}`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}
