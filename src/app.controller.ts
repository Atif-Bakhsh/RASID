import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from './modules/auth/auth.decorators';

@ApiTags('System')
@Public()
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly db: DataSource) {}

  @Get()
  info() {
    return {
      name: 'RASID',
      version: '1.0.0',
      dataMode: 'DEMO_ONLY',
      description: 'Arabic-first financial clarity portfolio backend',
      docs: '/docs',
      health: '/api/v1/health/live',
      readiness: '/api/v1/health/ready',
    };
  }

  @Get('health/live') live() {
    return { status: 'ok', service: 'rasid', dataMode: 'DEMO_ONLY' };
  }

  @Get('health/ready') async ready() {
    try {
      const rows = await this.db.query<{ ready: boolean }[]>(
        `SELECT EXISTS(SELECT 1 FROM migrations WHERE name = 'InitialSchema1788998400000') AS ready`,
      );
      if (!rows[0]?.ready) throw new Error('Migrations pending');
      return { status: 'ready', service: 'rasid' };
    } catch {
      throw new ServiceUnavailableException({
        code: 'NOT_READY',
        message: 'Database or schema is not ready.',
        messageAr: 'قاعدة البيانات أو مخططها غير جاهز.',
      });
    }
  }
}
