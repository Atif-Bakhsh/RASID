import {
  coordinatedRefresh,
  publishLogout,
} from '@/features/auth/refresh-coordinator';
import { tokenStore } from '@/features/auth/token-store';

import { ApiClientError } from './errors';
import { apiRequest, type ApiRequestOptions } from './transport';

export { apiRequest } from './transport';

export async function protectedApiRequest<T>(
  path: `/${string}`,
  options: Omit<ApiRequestOptions, 'accessToken'> = {},
): Promise<T> {
  let accessToken = tokenStore.get();

  if (!accessToken) {
    accessToken = (await coordinatedRefresh()).accessToken;
  }

  try {
    return await apiRequest<T>(path, { ...options, accessToken });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) {
      throw error;
    }

    // Another waiting request (or tab) may already have refreshed after this
    // request left with its stale token. Reuse that token instead of rotating
    // the cookie a second time.
    const currentToken = tokenStore.get();
    const retryToken =
      currentToken && currentToken !== accessToken
        ? currentToken
        : (await coordinatedRefresh()).accessToken;

    // The retry deliberately uses the raw transport. A second 401 is returned
    // to the caller and can never recurse into another refresh cycle.
    try {
      return await apiRequest<T>(path, {
        ...options,
        accessToken: retryToken,
      });
    } catch (retryError) {
      if (retryError instanceof ApiClientError && retryError.status === 401) {
        publishLogout();
      }
      throw retryError;
    }
  }
}
