import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from '@/lib/api/contracts';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('./api', () => ({ refresh: mocks.refresh }));

const session: AuthSession = {
  accessToken: 'access-from-other-tab',
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

describe('cross-tab refresh coordination', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('waits on Web Locks and reuses a session broadcast by the tab holding the lock', async () => {
    let channelListener: ((event: MessageEvent) => void) | undefined;
    let runInsideLock: (() => void) | undefined;

    class FakeBroadcastChannel {
      addEventListener(_type: string, listener: (event: MessageEvent) => void) {
        channelListener = listener;
      }

      postMessage() {}
    }

    const requestLock = vi.fn(
      <T>(_name: string, callback: () => Promise<T>): Promise<T> =>
        new Promise<T>((resolve, reject) => {
          runInsideLock = () => void callback().then(resolve, reject);
        }),
    );
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    Object.defineProperty(window, 'BroadcastChannel', {
      configurable: true,
      value: FakeBroadcastChannel,
    });
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request: requestLock },
    });

    const { coordinatedRefresh } = await import('./refresh-coordinator');
    const pendingRefresh = coordinatedRefresh();

    expect(requestLock).toHaveBeenCalledWith(
      'rasid-refresh-v1',
      expect.any(Function),
    );
    channelListener?.({ data: { type: 'session', session } } as MessageEvent);
    runInsideLock?.();

    await expect(pendingRefresh).resolves.toEqual(session);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
