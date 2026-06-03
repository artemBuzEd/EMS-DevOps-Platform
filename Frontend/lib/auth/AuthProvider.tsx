"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
} from "keycloak-js";
import { keycloak } from "./keycloak";
import { toAuthUser, type AuthUser, type EmsToken } from "./types";

interface AuthState {
  /** false until keycloak.init() resolves — we don't yet know if there's an SSO session. */
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  login: (options?: KeycloakLoginOptions) => void;
  logout: (options?: KeycloakLogoutOptions) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// keycloak.init() must run exactly once per instance. React StrictMode mounts
// effects twice in dev, so the promise is memoized at module scope.
let initPromise: Promise<boolean> | null = null;

function initOnce(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: "S256",
      checkLoginIframe: true,
    });
  }
  return initPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    if (!keycloak) return; // SSR / no window
    let cancelled = false;

    const sync = () => {
      if (cancelled) return;
      setState({
        ready: true,
        authenticated: !!keycloak.authenticated,
        user: toAuthUser(keycloak.tokenParsed as EmsToken | undefined),
      });
    };

    // Refresh on expiry instead of polling on a timer; fall back to re-login
    // if the refresh token is also gone.
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    };
    keycloak.onAuthSuccess = sync;
    keycloak.onAuthRefreshSuccess = sync;
    keycloak.onAuthLogout = sync;

    initOnce()
      .then(sync)
      .catch(() => {
        if (!cancelled) {
          setState({ ready: true, authenticated: false, user: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((options?: KeycloakLoginOptions) => {
    keycloak?.login(options);
  }, []);

  const logout = useCallback((options?: KeycloakLogoutOptions) => {
    keycloak?.logout(options);
  }, []);

  if (!state.ready) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used within <AuthProvider>");
  }
  return ctx;
}

// Single global splash while we resolve the SSO session — not a per-page
// "sign in to view" message, since we don't yet know the auth state.
function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-indigo" />
        <span className="text-sm text-muted">Loading…</span>
      </div>
    </div>
  );
}
