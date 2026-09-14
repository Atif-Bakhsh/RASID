import type { AuthSession } from '@/lib/api/contracts';

import { refresh } from './api';
import { tokenStore } from './token-store';

const CHANNEL_NAME = 'rasid-auth-v1';
const LOCK_NAME = 'rasid-refresh-v1';

type AuthEvent =
  | { type: 'session'; session: AuthSession }
  | { type: 'logout' }
  | { type: 'refresh-failed' };

type AuthEventListener = (event: AuthEvent) => void;

let channel: BroadcastChannel | null = null;
let inFlight: Promise<AuthSession> | null = null;
let observedSequence = 0;
let observedSession: AuthSession | null = null;
const listeners = new Set<AuthEventListener>();

function receive(event: AuthEvent): void {
  observedSequence += 1;

  if (event.type === 'session') {
    observedSession = event.session;
    tokenStore.set(event.session.accessToken);
  } else if (event.type === 'logout' || event.type === 'refresh-failed') {
    observedSession = null;
    tokenStore.clear();
  }

  listeners.forEach((listener) => listener(event));
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', (message: MessageEvent<AuthEvent>) => {
      receive(message.data);
    });
  }

  return channel;
}

function publish(event: AuthEvent): void {
  receive(event);
  getChannel()?.postMessage(event);
}

async function performRefresh(): Promise<AuthSession> {
  try {
    const session = await refresh();
    publish({ type: 'session', session });
    return session;
  } catch (error) {
    publish({ type: 'refresh-failed' });
    throw error;
  }
}

async function refreshWithCrossTabLock(): Promise<AuthSession> {
  getChannel();

  if (typeof navigator === 'undefined' || !('locks' in navigator)) {
    // Older browsers use a clearly bounded single-tab fallback.
    return performRefresh();
  }

  const sequenceBeforeWaiting = observedSequence;

  return navigator.locks.request(LOCK_NAME, async () => {
    if (observedSequence > sequenceBeforeWaiting && observedSession) {
      return observedSession;
    }

    return performRefresh();
  });
}

export function coordinatedRefresh(): Promise<AuthSession> {
  if (!inFlight) {
    inFlight = refreshWithCrossTabLock().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

export function publishSession(session: AuthSession): void {
  publish({ type: 'session', session });
}

export function publishLogout(): void {
  publish({ type: 'logout' });
}

export function subscribeToAuthEvents(listener: AuthEventListener): () => void {
  getChannel();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
