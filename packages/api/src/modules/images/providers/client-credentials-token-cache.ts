import { BadGatewayException } from '@nestjs/common';

const REFRESH_LEEWAY_MS = 60_000;

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export interface ClientCredentialsTokenCacheOptions {
  tokenUrl: string;
  serviceName: string;
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

export class ClientCredentialsTokenCache {
  private state: TokenState | null = null;
  private inflight: Promise<string> | null = null;

  constructor(private readonly opts: ClientCredentialsTokenCacheOptions) {}

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.state && this.state.expiresAt - REFRESH_LEEWAY_MS > now) {
      return this.state.accessToken;
    }
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      const creds = Buffer.from(`${this.opts.clientId}:${this.opts.clientSecret}`).toString(
        'base64',
      );
      const res = await fetch(this.opts.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.opts.userAgent,
        },
        body: 'grant_type=client_credentials',
      });
      if (!res.ok) {
        throw new BadGatewayException(
          `${this.opts.serviceName} token endpoint returned ${res.status} ${res.statusText}.`,
        );
      }
      const json = (await res.json()) as TokenResponse;
      this.state = {
        accessToken: json.access_token,
        expiresAt: Date.now() + json.expires_in * 1000,
      };
      return this.state.accessToken;
    })();

    try {
      return await this.inflight;
    } finally {
      this.inflight = null;
    }
  }
}
