import { coordinatedRefresh } from "@/features/auth/refresh-coordinator";
import { tokenStore } from "@/features/auth/token-store";

import { ApiClientError } from "./errors";
import {
  apiRequest,
  type ApiRequestOptions,
} from "./transport";

export { apiRequest } from "./transport";

export async function protectedApiRequest<T>(
  path: `/${string}`,
  options: Omit<ApiRequestOptions, "accessToken"> = {},
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

    const refreshedSession = await coordinatedRefresh();
    return apiRequest<T>(path, {
      ...options,
      accessToken: refreshedSession.accessToken,
    });
  }
}
