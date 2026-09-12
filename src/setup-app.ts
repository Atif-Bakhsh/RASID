import {
  BadRequestException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Environment } from './config/environment';
import { ApiExceptionFilter, requestContext } from './common/http';
import { describeResponses } from './common/openapi-responses';

/** Shared bootstrap means the HTTP tests exercise the same security/validation pipeline. */
export function setupApp(app: NestExpressApplication) {
  const config = app.get(ConfigService<Environment, true>);
  app.setGlobalPrefix('api/v1');
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  app.use(requestContext);
  app.use(helmet());
  const origins = config.get('CORS_ORIGINS', { infer: true });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    if (
      origin &&
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      !origins.includes(origin)
    ) {
      return next(
        new ForbiddenException({
          code: 'ORIGIN_REJECTED',
          message: 'Request origin is not allowed.',
          messageAr: 'مصدر الطلب غير مسموح.',
        }),
      );
    }
    next();
  });
  app.use(json({ limit: '32kb' }));
  app.use(urlencoded({ extended: false, limit: '32kb', parameterLimit: 20 }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-RASID-Client',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RASID-Data'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          messageAr: 'البيانات المدخلة غير صالحة.',
          details: errors.map((error) => ({
            field: error.property,
            rules: Object.keys(error.constraints ?? {}),
          })),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
}

export function createOpenApi(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('RASID API')
    .setVersion('1.0.0')
    .setDescription(
      'Arabic-first backend portfolio. Synthetic/manual/sanitized demo data only. All money values are decimal strings. No banking, payments, investment execution or financial advice. See docs/FRONTEND_HANDOFF.md for browser integration and response examples.',
    )
    .addBearerAuth()
    .addCookieAuth(
      'rasid_refresh',
      { type: 'apiKey', in: 'cookie' },
      'rasid_refresh',
    )
    .build();
  return describeResponses(SwaggerModule.createDocument(app, config));
}
