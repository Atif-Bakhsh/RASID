import type { AuthSession } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/transport";

import type { LoginInput, RegisterInput } from "./types";

const WEB_HEADERS = { "X-RASID-Client": "web" } as const;

export function login(input: LoginInput): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    credentials: "include",
    body: input,
  });
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    credentials: "include",
    body: input,
  });
}

export function refresh(): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: WEB_HEADERS,
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: WEB_HEADERS,
  });
}
