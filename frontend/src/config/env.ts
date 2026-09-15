const API_PATH_SUFFIX = '/api/v1';

export interface DemoCredentials {
  email: string;
  password: string;
}

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is required. Copy .env.example to .env.local.',
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be an absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL cannot include credentials, a query, or a fragment.',
    );
  }

  const normalizedPath = url.pathname.replace(/\/+$/, '');

  if (!normalizedPath.endsWith(API_PATH_SUFFIX)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must end with ${API_PATH_SUFFIX}.`,
    );
  }

  url.pathname = normalizedPath;
  return url.toString().replace(/\/$/, '');
}

export function getDemoCredentials(): DemoCredentials | null {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim();
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

  if (!email && !password) return null;
  if (!email || !password) {
    throw new Error(
      'NEXT_PUBLIC_DEMO_EMAIL and NEXT_PUBLIC_DEMO_PASSWORD must be set together.',
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    throw new Error('NEXT_PUBLIC_DEMO_EMAIL must be a valid email address.');
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error(
      'NEXT_PUBLIC_DEMO_PASSWORD must be between 12 and 128 characters.',
    );
  }

  return { email, password };
}
