import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ApiRequest } from '../../common/http';
import { unauthorized } from '../../common/errors';
import { PUBLIC_ROUTE } from './auth.decorators';
import { Session } from './session.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<ApiRequest>();
    const auth = request.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.length > 2048) unauthorized();
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(
        auth.slice(7),
        { algorithms: ['HS256'], issuer: 'rasid', audience: 'rasid-api' },
      );
      if (!isUUID(payload.sub, '4') || !isUUID(payload.sid, '4'))
        unauthorized();
    } catch {
      unauthorized();
    }
    const active = await this.sessions.existsBy({
      id: payload.sid,
      userId: payload.sub,
      revokedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    });
    if (!active) unauthorized();
    request.identity = { userId: payload.sub, sessionId: payload.sid };
    return true;
  }
}
