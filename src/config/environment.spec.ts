import { validateEnvironment } from './environment';
const valid = {
  DATABASE_URL: 'postgresql://rasid:local@localhost/rasid_test',
  JWT_SECRET: 'a'.repeat(48),
};
describe('Environment contract', () => {
  it('sets typed defaults', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3000,
      COOKIE_SECURE: false,
      TRUST_PROXY_HOPS: 0,
    });
  });
  it.each([
    { JWT_SECRET: 'short' },
    { DATABASE_URL: 'sqlite:///tmp/a' },
    { PORT: 0 },
    { COOKIE_SECURE: '1' },
    { CORS_ORIGINS: '*' },
    { TRUST_PROXY_HOPS: 'true' },
    {
      NODE_ENV: 'production',
      COOKIE_SECURE: 'false',
      CORS_ORIGINS: 'https://demo.example.com',
    },
    { NODE_ENV: 'production', CORS_ORIGINS: 'http://example.com' },
  ])('rejects invalid configuration %j', (override) => {
    expect(() => validateEnvironment({ ...valid, ...override })).toThrow();
  });
});
