import { getApiBaseUrl } from "@/config/env";

import type { ApiFailure } from "./contracts";
import { ApiClientError, ApiNetworkError, isApiFailure } from "./errors";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  accessToken?: string | null;
  body?: BodyInit | object | null;
}

function isNativeBody(body: ApiRequestOptions["body"]): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream ||
    ArrayBuffer.isView(body)
  );
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    accessToken,
    body,
    headers: initialHeaders,
    ...requestOptions
  } = options;
  const headers = new Headers(initialHeaders);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let requestBody: BodyInit | null | undefined;

  if (body && !isNativeBody(body)) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestOptions,
      body: requestBody,
      headers,
    });
  } catch (error) {
    throw new ApiNetworkError({ cause: error });
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure: ApiFailure = isApiFailure(payload)
      ? payload
      : {
          error: {
            code: "UNEXPECTED_RESPONSE",
            message: "The API returned an unexpected response.",
            messageAr: "أعاد الخادم استجابة غير متوقعة.",
          },
          requestId: response.headers.get("x-request-id") ?? "unavailable",
          timestamp: new Date().toISOString(),
        };

    throw new ApiClientError(
      failure,
      response.status,
      response.headers.get("retry-after") ?? undefined,
    );
  }

  return payload as T;
}
