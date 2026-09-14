import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tokenStore } from '@/features/auth/token-store';
import { ApiClientError } from '@/lib/api/errors';

import { protectedApiRequest } from './client';

const sessionPayload = {
  accessToken: 'new-access-token',
  expiresIn: 900,
  sessionId: '62aef265-9cce-41d8-a33d-eedd81ef0a1a',
  tokenType: 'Bearer',
  user: {
    createdAt: '2026-09-12T10:00:00.000Z',
    dataMode: 'DEMO_ONLY',
    email: 'atif@example.test',
    id: 'f72afe0a-c153-49b4-b675-c4d6d8ce6c23',
    locale: 'ar',
    timezone: 'Asia/Riyadh',
  },
};

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function unauthorizedResponse() {
  return jsonResponse(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Sign in again to continue.',
        messageAr: 'يرجى تسجيل الدخول مجدداً.',
      },
      requestId: 'request-auth-401',
      timestamp: '2026-09-12T10:00:00.000Z',
    },
    401,
  );
}

describe('protectedApiRequest', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/v1';
    tokenStore.clear();
    vi.unstubAllGlobals();
  });

  it('shares one refresh across waiting 401 requests and retries each once', async () => {
    tokenStore.set('old-access-token');
    let refreshCount = 0;
    let releaseRefresh: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        const authorization = new Headers(init?.headers).get('Authorization');

        if (url.endsWith('/auth/refresh')) {
          refreshCount += 1;
          expect(init?.credentials).toBe('include');
          expect(new Headers(init?.headers).get('X-RASID-Client')).toBe('web');
          await refreshGate;
          return jsonResponse(sessionPayload);
        }
        if (authorization === 'Bearer old-access-token')
          return unauthorizedResponse();
        if (authorization === 'Bearer new-access-token') {
          return jsonResponse({ ok: true });
        }
        throw new Error(`Unexpected request: ${url} ${authorization}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = protectedApiRequest<{ ok: boolean }>('/accounts');
    const second = protectedApiRequest<{ ok: boolean }>('/accounts');
    await vi.waitFor(() => expect(refreshCount).toBe(1));
    releaseRefresh?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(refreshCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('reuses a token refreshed by another waiter when a stale 401 arrives late', async () => {
    tokenStore.set('old-access-token');
    let oldRequestCount = 0;
    let refreshCount = 0;
    let releaseLateResponse: (() => void) | undefined;
    const lateResponseGate = new Promise<void>((resolve) => {
      releaseLateResponse = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        const authorization = new Headers(init?.headers).get('Authorization');
        if (!authorization) {
          refreshCount += 1;
          return jsonResponse(sessionPayload);
        }
        if (authorization === 'Bearer old-access-token') {
          oldRequestCount += 1;
          if (oldRequestCount === 2) await lateResponseGate;
          return unauthorizedResponse();
        }
        return jsonResponse({ ok: true });
      }),
    );

    const first = protectedApiRequest<{ ok: boolean }>('/accounts');
    const second = protectedApiRequest<{ ok: boolean }>('/accounts');
    await vi.waitFor(() => expect(tokenStore.get()).toBe('new-access-token'));
    releaseLateResponse?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(refreshCount).toBe(1);
  });

  it('does not refresh again when the single retry also returns 401', async () => {
    tokenStore.set('old-access-token');
    let refreshCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).endsWith('/auth/refresh')) {
          refreshCount += 1;
          return jsonResponse(sessionPayload);
        }
        return unauthorizedResponse();
      }),
    );

    await expect(protectedApiRequest('/accounts')).rejects.toBeInstanceOf(
      ApiClientError,
    );
    expect(refreshCount).toBe(1);
    expect(tokenStore.get()).toBeNull();
  });
});
