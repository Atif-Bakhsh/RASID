import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './transport';

describe('apiRequest multipart transport', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/v1';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('leaves multipart Content-Type unset so the browser supplies its boundary', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('Content-Type')).toBeNull();
      expect(headers.get('Authorization')).toBe('Bearer access-token');
      expect(init?.body).toBeInstanceOf(FormData);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const form = new FormData();
    form.append('file', new File(['synthetic'], 'synthetic.csv'));

    await expect(
      apiRequest<{ ok: boolean }>('/imports/accounts/account-one/preview', {
        method: 'POST',
        accessToken: 'access-token',
        body: form,
      }),
    ).resolves.toEqual({ ok: true });
  });
});
