import { BadGatewayException } from '@nestjs/common';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const REFRESH_LEEWAY_MS = 60_000;

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export class SpotifyTokenCache {
  private state: TokenState | null = null;
  private inflight: Promise<string> | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly userAgent: string,
  ) {}

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.state && this.state.expiresAt - REFRESH_LEEWAY_MS > now) {
      return this.state.accessToken;
    }
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: 'grant_type=client_credentials',
      });
      if (!res.ok) {
        throw new BadGatewayException(
          `Spotify token endpoint returned ${res.status} ${res.statusText}.`,
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
