import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Environment } from '../../config/environment';
import { fail, notFound, pgCode, unauthorized } from '../../common/errors';
import { User } from './user.entity';
import { Session } from './session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  hashPassword,
  hashToken,
  tokenMatches,
  verifyPassword,
} from './password';

// A missing user still pays the same scrypt cost as an incorrect password.
const dummyHash = `scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(128)}`;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly db: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await hashPassword(dto.password);
    try {
      return await this.db.transaction(async (manager) => {
        const user = await manager.save(
          User,
          manager.create(User, {
            email: dto.email,
            passwordHash,
            locale: dto.locale,
            timezone: dto.timezone,
          }),
        );
        return this.createSession(user, manager);
      });
    } catch (error) {
      if (pgCode(error) === '23505')
        fail(
          409,
          'EMAIL_IN_USE',
          'Email is already registered.',
          'البريد الإلكتروني مسجل مسبقاً.',
        );
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email })
      .getOne();
    const valid = await verifyPassword(
      dto.password,
      user?.passwordHash ?? dummyHash,
    );
    if (!user || !valid)
      fail(
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect.',
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      );
    return this.createSession(user, this.db.manager);
  }

  private async createSession(user: User, manager: EntityManager) {
    const id = randomUUID();
    const refreshToken = `${id}.${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(
      Date.now() +
        this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 86400000,
    );
    const session = await manager.save(
      Session,
      manager.create(Session, {
        id,
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt,
        revokedAt: null,
      }),
    );
    return this.tokens(user, session, refreshToken);
  }

  private async tokens(user: User, session: Session, refreshToken: string) {
    const expiresIn = this.config.get('ACCESS_TOKEN_TTL_SECONDS', {
      infer: true,
    });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, sid: session.id },
      { expiresIn, issuer: 'rasid', audience: 'rasid-api', algorithm: 'HS256' },
    );
    return {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn,
      sessionId: session.id,
      user: this.profile(user),
      refreshToken,
      refreshExpiresAt: session.expiresAt,
    };
  }

  async refresh(token: string) {
    const id = token.split('.')[0];
    if (!isUUID(id, '4') || !/^[\da-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(token))
      unauthorized();
    const result = await this.db.transaction(async (manager) => {
      const session = await manager
        .getRepository(Session)
        .createQueryBuilder('s')
        .addSelect('s.refreshTokenHash')
        .where('s.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();
      if (!session || session.revokedAt || session.expiresAt <= new Date())
        return null;
      if (!tokenMatches(token, session.refreshTokenHash)) {
        // Return, then throw OUTSIDE the transaction so revocation commits.
        await manager.update(Session, { id }, { revokedAt: new Date() });
        return null;
      }
      const user = await manager.findOneByOrFail(User, { id: session.userId });
      const refreshToken = `${session.id}.${randomBytes(32).toString('base64url')}`;
      await manager.update(
        Session,
        { id },
        { refreshTokenHash: hashToken(refreshToken) },
      );
      return this.tokens(user, session, refreshToken);
    });
    if (!result) unauthorized();
    return result;
  }

  async logout(token: string | undefined) {
    if (!token || token.length > 100) return;
    const id = token.split('.')[0];
    if (!isUUID(id, '4')) return;
    await this.sessions.update(
      { id, refreshTokenHash: hashToken(token) },
      { revokedAt: new Date() },
    );
  }

  async me(userId: string) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) unauthorized();
    return this.profile(user);
  }

  listSessions(userId: string) {
    return this.sessions.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 50,
    });
  }

  async revokeSession(userId: string, id: string) {
    const result = await this.sessions.update(
      { id, userId },
      { revokedAt: new Date() },
    );
    if (!result.affected) notFound();
  }

  private profile(user: User) {
    return {
      id: user.id,
      email: user.email,
      locale: user.locale,
      timezone: user.timezone,
      createdAt: user.createdAt,
      dataMode: 'DEMO_ONLY' as const,
    };
  }
}
