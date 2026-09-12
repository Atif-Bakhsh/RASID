import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { pgCode } from './errors';

export interface Identity {
  userId: string;
  sessionId: string;
}
export type ApiRequest = Request & { requestId: string; identity: Identity };

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const candidate = req.get('x-request-id');
  const requestId =
    candidate && /^[a-zA-Z0-9_-]{8,64}$/.test(candidate)
      ? candidate
      : randomUUID();
  (req as ApiRequest).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-rasid-data', 'demo-only');
  res.setHeader('cache-control', 'no-store');
  const started = performance.now();
  res.on('finish', () => {
    // Only route templates: never query strings, cookies, bodies, or tokens.
    const route = req.route as { path?: string } | undefined;
    new Logger('HTTP').log({
      event: 'request_completed',
      requestId,
      method: req.method,
      route: route?.path ?? 'unmatched',
      status: res.statusCode,
      durationMs: Math.round((performance.now() - started) * 100) / 100,
    });
  });
  next();
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('API');
  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<ApiRequest>();
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let messageAr = 'حدث خطأ غير متوقع.';
    let details: unknown;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      const defaultCodes: Record<number, string> = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHENTICATED',
        403: 'FORBIDDEN',
        404: 'RESOURCE_NOT_FOUND',
        409: 'CONFLICT',
        413: 'PAYLOAD_TOO_LARGE',
        429: 'RATE_LIMITED',
        503: 'NOT_READY',
      };
      code = defaultCodes[status] ?? 'REQUEST_FAILED';
      message = exception.message;
      messageAr =
        status === 429
          ? 'طلبات كثيرة. حاول لاحقاً.'
          : 'تعذر تنفيذ الطلب. تحقق من البيانات المدخلة.';
      if (typeof payload === 'object' && payload !== null) {
        const body = payload as Record<string, unknown>;
        if (typeof body.code === 'string') code = body.code;
        if (typeof body.message === 'string') message = body.message;
        if (typeof body.messageAr === 'string') messageAr = body.messageAr;
        if (Array.isArray(body.message)) {
          details = body.message;
          message = 'Request validation failed.';
        }
        if (body.details !== undefined) details = body.details;
      }
    } else if (['23505', '23503'].includes(pgCode(exception) ?? '')) {
      status = 409;
      code = 'CONFLICT';
      message = 'This change conflicts with an existing record.';
      messageAr = 'يتعارض التغيير مع سجل موجود.';
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      [400, 413].includes(Number(exception.status))
    ) {
      status = Number(exception.status);
      code = status === 413 ? 'PAYLOAD_TOO_LARGE' : 'VALIDATION_ERROR';
      message = 'Invalid or oversized request body.';
      messageAr = 'محتوى الطلب غير صالح أو كبير جداً.';
    }
    if (status >= 500)
      this.logger.error({
        event: 'request_failed',
        requestId: req.requestId,
        code,
        databaseCode: pgCode(exception),
      });
    res.status(status).json({
      error: { code, message, messageAr, ...(details ? { details } : {}) },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
