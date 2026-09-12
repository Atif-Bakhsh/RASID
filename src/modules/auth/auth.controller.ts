import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Environment } from '../../config/environment';
import { fail, unauthorized } from '../../common/errors';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './auth.decorators';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a demo-data user and start a session' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.setSession(res, await this.auth.register(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.setSession(res, await this.auth.login(dto));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('rasid_refresh')
  @ApiHeader({
    name: 'X-RASID-Client',
    required: true,
    schema: { type: 'string', enum: ['web'] },
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.cookieToken(req);
    if (!token) unauthorized();
    return this.setSession(res, await this.auth.refresh(token));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth('rasid_refresh')
  @ApiHeader({
    name: 'X-RASID-Client',
    required: true,
    schema: { type: 'string', enum: ['web'] },
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookieToken(req));
    res.clearCookie('rasid_refresh', this.cookieOptions());
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() userId: string) {
    return this.auth.me(userId);
  }

  @ApiBearerAuth()
  @Get('sessions')
  sessions(@CurrentUser() userId: string) {
    return this.auth.listSessions(userId);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  @HttpCode(204)
  revoke(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.auth.revokeSession(userId, id);
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: 'strict' as const,
      path: '/api/v1/auth',
    };
  }
  private setSession(
    res: Response,
    tokens: Awaited<ReturnType<AuthService['login']>>,
  ) {
    const { refreshToken, refreshExpiresAt, ...body } = tokens;
    res.cookie('rasid_refresh', refreshToken, {
      ...this.cookieOptions(),
      expires: refreshExpiresAt,
    });
    return body;
  }
  private cookieToken(req: Request): string | undefined {
    const origin = req.get('origin');
    if (
      req.get('x-rasid-client') !== 'web' ||
      (origin &&
        !this.config.get('CORS_ORIGINS', { infer: true }).includes(origin))
    ) {
      fail(
        403,
        'CSRF_REJECTED',
        'Cookie requests require an allowed origin and X-RASID-Client: web.',
        'مصدر الطلب أو ترويسة الحماية غير صالح.',
      );
    }
    const value: unknown = (req.cookies as Record<string, unknown> | undefined)
      ?.rasid_refresh;
    return typeof value === 'string' ? value : undefined;
  }
}
