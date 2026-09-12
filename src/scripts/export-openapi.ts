import { writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../app.module';
import { createOpenApi, setupApp } from '../setup-app';

async function run() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: false,
  });
  try {
    setupApp(app);
    await app.init();
    await writeFile(
      'docs/openapi.json',
      JSON.stringify(createOpenApi(app), null, 2) + '\n',
    );
    console.log('Exported docs/openapi.json');
  } finally {
    await app.close();
  }
}
void run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'OpenAPI export failed',
  );
  process.exitCode = 1;
});
