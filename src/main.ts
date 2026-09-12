import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createOpenApi, setupApp } from './setup-app';
import { validateEnvironment } from './config/environment';

async function bootstrap() {
  const env = validateEnvironment(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: new ConsoleLogger({
      json: true,
      logLevels:
        env.LOG_LEVEL === 'error'
          ? ['error']
          : env.LOG_LEVEL === 'warn'
            ? ['error', 'warn']
            : ['log', 'error', 'warn'],
    }),
  });
  setupApp(app);
  SwaggerModule.setup('docs', app, createOpenApi(app), {
    jsonDocumentUrl: 'openapi.json',
    swaggerOptions: { persistAuthorization: false },
  });
  await app.listen(env.PORT, '0.0.0.0');
}
void bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error({
    event: 'startup_failed',
    message: error instanceof Error ? error.message : 'Startup failed',
  });
  process.exitCode = 1;
});
