import { config } from 'dotenv';

config({ quiet: true });

export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  JWT_SECRET: string;
  ACCESS_TOKEN_TTL_SECONDS: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  CORS_ORIGINS: string[];
  TRUST_PROXY_HOPS: number;
  COOKIE_SECURE: boolean;
  LOG_LEVEL: 'log' | 'warn' | 'error';
}

export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const string = (key: string, fallback = '') => {
    const value = raw[key] ?? fallback;
    if (typeof value !== 'string') throw new Error(`${key} must be a string`);
    return value;
  };
  const nodeEnv = string('NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const value = Number(raw[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer from ${min} to ${max}`);
    }
    return value;
  };
  const boolean = (key: string, fallback: boolean) => {
    const value = raw[key] ?? String(fallback);
    if (value !== 'true' && value !== 'false') {
      throw new Error(`${key} must be true or false`);
    }
    return value === 'true';
  };
  const databaseUrl = string('DATABASE_URL');
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.pathname.slice(1)
  ) {
    throw new Error('DATABASE_URL must include a PostgreSQL database name');
  }
  const secret = string('JWT_SECRET');
  if (
    secret.length < 32 ||
    (nodeEnv === 'production' &&
      /example|change-me|development|test-secret/i.test(secret))
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters; use a random secret in production',
    );
  }
  const origins = string('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (
        parsed.origin !== origin ||
        !['http:', 'https:'].includes(parsed.protocol)
      )
        throw new Error();
      if (nodeEnv === 'production' && parsed.protocol !== 'https:')
        throw new Error();
    } catch {
      throw new Error(
        'CORS_ORIGINS must be comma-separated exact origins (HTTPS in production)',
      );
    }
  }
  const cookieSecure = boolean('COOKIE_SECURE', nodeEnv === 'production');
  if (nodeEnv === 'production' && !cookieSecure)
    throw new Error('Production refresh cookies require COOKIE_SECURE=true');
  const logLevel = string('LOG_LEVEL', 'log');
  if (!['log', 'warn', 'error'].includes(logLevel))
    throw new Error('LOG_LEVEL must be log, warn, or error');
  return {
    NODE_ENV: nodeEnv as Environment['NODE_ENV'],
    PORT: integer('PORT', 3000, 1, 65535),
    DATABASE_URL: databaseUrl,
    DATABASE_SSL: boolean('DATABASE_SSL', false),
    JWT_SECRET: secret,
    ACCESS_TOKEN_TTL_SECONDS: integer(
      'ACCESS_TOKEN_TTL_SECONDS',
      900,
      60,
      3600,
    ),
    REFRESH_TOKEN_TTL_DAYS: integer('REFRESH_TOKEN_TTL_DAYS', 14, 1, 30),
    CORS_ORIGINS: origins,
    TRUST_PROXY_HOPS: integer('TRUST_PROXY_HOPS', 0, 0, 3),
    COOKIE_SECURE: cookieSecure,
    LOG_LEVEL: logLevel as Environment['LOG_LEVEL'],
  };
}
