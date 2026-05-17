import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status = this.resolveStatus(exception);
    const { code: payloadCode, message, details } = this.resolveBody(exception, status);
    const code = payloadCode ?? STATUS_CODE_MAP[status] ?? 'INTERNAL_ERROR';
    const requestId = (request.id as string | undefined) ?? 'unknown';

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} → ${status} ${code}: ${message}`);
    }

    const envelope: ErrorEnvelope = {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    void response.status(status).send(envelope);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveBody(
    exception: unknown,
    status: number,
  ): { code?: string; message: string; details?: unknown } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') return { message: res };
      if (res && typeof res === 'object') {
        const obj = res as { code?: unknown; message?: unknown; error?: unknown };
        const code = typeof obj.code === 'string' && obj.code.length > 0 ? obj.code : undefined;
        const message = this.coerceMessage(obj.message) ?? exception.message;
        const details = Array.isArray(obj.message) ? obj.message : undefined;
        return { ...(code ? { code } : {}), message, ...(details ? { details } : {}) };
      }
      return { message: exception.message };
    }

    if (exception instanceof Error) {
      return {
        message:
          status >= 500
            ? 'An unexpected error occurred. Please try again later.'
            : exception.message,
      };
    }

    return { message: 'Unknown error.' };
  }

  private coerceMessage(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      return value.join('; ');
    }
    return undefined;
  }
}
