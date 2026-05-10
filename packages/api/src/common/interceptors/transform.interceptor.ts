import { Readable } from 'node:stream';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { map, type Observable } from 'rxjs';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

export interface ResponseEnvelope<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const requestId = (request.id as string | undefined) ?? 'unknown';

    return next.handle().pipe(
      map((payload) => {
        if (isRaw) return payload;
        if (this.isStreamingPayload(payload)) return payload;
        if (this.isAlreadyEnveloped(payload)) return payload;

        return {
          data: payload,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        } satisfies ResponseEnvelope<T>;
      }),
    );
  }

  private isStreamingPayload(value: unknown): boolean {
    if (value instanceof Readable) return true;
    if (Buffer.isBuffer(value)) return true;
    if (value instanceof ArrayBuffer) return true;
    if (value instanceof Uint8Array) return true;
    return false;
  }

  private isAlreadyEnveloped(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'data' in value && 'meta' in value;
  }
}
