import { randomBytes } from 'node:crypto';

export const testBaseUrl = process.env.TEST_DATABASE_URL;
if (!testBaseUrl)
  throw new Error(
    'Set TEST_DATABASE_URL to a local/CI PostgreSQL role with CREATEDB permission.',
  );
const url = new URL(testBaseUrl);
if (!['localhost', '127.0.0.1', '[::1]', 'db'].includes(url.hostname))
  throw new Error('Tests only allow a local/Compose PostgreSQL host.');
export const testDatabaseName = `rasid_test_${randomBytes(8).toString('hex')}`;
url.pathname = `/${testDatabaseName}`;
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.COOKIE_SECURE = 'false';
