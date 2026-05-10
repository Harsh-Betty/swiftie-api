import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { type Observable, tap } from 'rxjs';

const SKIP_PREFIXES = ['/api/v1/health'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();
    const url = request.url ?? '';

    if (SKIP_PREFIXES.some((p) => url.startsWith(p))) {
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const method = request.method;

    return next.handle().pipe(
      tap({
        next: () => this.log(method, url, response.statusCode, start),
        error: () => this.log(method, url, response.statusCode || 500, start),
      }),
    );
  }

  private log(method: string, url: string, status: number, start: bigint): void {
    const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
    this.logger.log(`${method} ${url} -> ${status} (${durationMs}ms)`);
  }
}
