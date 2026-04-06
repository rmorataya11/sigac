import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const { method, originalUrl } = req;
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = http.getResponse<Response>();
          const ms = Date.now() - started;
          this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${ms}ms`);
        },
        error: (err: { status?: number }) => {
          const ms = Date.now() - started;
          const status = typeof err?.status === 'number' ? err.status : 500;
          this.logger.warn(`${method} ${originalUrl} ${status} ${ms}ms`);
        },
      }),
    );
  }
}
