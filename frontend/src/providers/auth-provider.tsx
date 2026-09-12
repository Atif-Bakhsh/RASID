"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { logout } from "@/features/auth/api";
import {
  coordinatedRefresh,
  publishLogout,
  publishSession,
  subscribeToAuthEvents,
} from "@/features/auth/refresh-coordinator";
import { tokenStore } from "@/features/auth/token-store";
import type { AuthState } from "@/features/auth/types";
import type { AuthSession } from "@/lib/api/contracts";
import { ApiClientError } from "@/lib/api/errors";

interface AuthContextValue extends AuthState {
  acceptSession: (session: AuthSession) => void;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    session: null,
    status: "bootstrapping",
  });

  const acceptSession = useCallback((session: AuthSession) => {
    tokenStore.set(session.accessToken);
    setState({ session, status: "authenticated" });
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    setState({ session: null, status: "anonymous" });
  }, [queryClient]);

  const restoreSession = useCallback(async () => {
    setState((current) => ({ ...current, status: "bootstrapping" }));

    try {
      acceptSession(await coordinatedRefresh());
    } catch (error) {
      tokenStore.clear();
      setState({
        session: null,
        status:
          error instanceof ApiClientError && error.status === 401
            ? "anonymous"
            : "unavailable",
      });
    }
  }, [acceptSession]);

  useEffect(() => {
    // Initial state is already `bootstrapping`; state updates happen after I/O.
    void coordinatedRefresh()
      .then(acceptSession)
      .catch((error: unknown) => {
        tokenStore.clear();
        setState({
          session: null,
          status:
            error instanceof ApiClientError && error.status === 401
              ? "anonymous"
              : "unavailable",
        });
      });

    return subscribeToAuthEvents((event) => {
      if (event.type === "session") acceptSession(event.session);
      if (event.type === "logout" || event.type === "refresh-failed") {
        clearSession();
      }
    });
  }, [acceptSession, clearSession]);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      publishLogout();
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      acceptSession: (session) => {
        acceptSession(session);
        publishSession(session);
      },
      restoreSession,
      signOut,
    }),
    [acceptSession, restoreSession, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
