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

/**
 * Optional server-side origin for a same-origin proxy. This lets a Vercel
 * deployment keep browser requests at its own origin while forwarding the API
 * path to a separately hosted NestJS service. It is deliberately not named
 * NEXT_PUBLIC_: the browser never needs the upstream host.
 */
export function getApiProxyOrigin(): string | null {
  const value = process.env.RASID_API_PROXY_ORIGIN?.trim();
  if (!value) return null;

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('RASID_API_PROXY_ORIGIN must be an absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('RASID_API_PROXY_ORIGIN must use HTTP or HTTPS.');
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'RASID_API_PROXY_ORIGIN must contain an origin only, without credentials, a path, a query, or a fragment.',
    );
  }

  return url.origin;
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
