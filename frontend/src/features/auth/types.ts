import type { AuthSession, Locale } from "@/lib/api/contracts";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  locale?: Locale;
  timezone?: string;
}

export type AuthStatus =
  | "bootstrapping"
  | "authenticated"
  | "anonymous"
  | "unavailable";

export interface AuthState {
  session: AuthSession | null;
  status: AuthStatus;
}
