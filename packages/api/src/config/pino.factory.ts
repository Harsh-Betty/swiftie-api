import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';
import type { AppConfigService } from './config.service';

export const pinoFactory = (cfg: AppConfigService): Params => {
  const isProduction = cfg.isProduction;

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname,req,res,responseTime',
            },
          },
      genReqId: (req) => {
        const incoming = req.headers['x-request-id'];
        if (typeof incoming === 'string' && incoming.length > 0) return incoming;
        return randomUUID();
      },
      customProps: () => ({ service: '@swiftie-api/server' }),
      autoLogging: {
        ignore: (req) => {
          const url = req.url ?? '';
          return url.startsWith('/api/v1/health');
        },
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'req.headers["x-api-key"]',
          '*.password',
          '*.token',
          '*.secret',
          '*.apiKey',
          '*.SPOTIFY_CLIENT_SECRET',
          '*.REDDIT_CLIENT_SECRET',
          '*.PEXELS_API_KEY',
          '*.UNSPLASH_ACCESS_KEY',
        ],
        censor: '[REDACTED]',
        remove: false,
      },
    },
  };
};
