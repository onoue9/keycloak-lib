'use client';

// ============================================================================
// KeycloakProvider — React Context Provider para autenticação
// ============================================================================

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  KeycloakContextValue,
  KeycloakProviderProps,
  KeycloakUser,
} from '../types';

export const KeycloakContext = createContext<KeycloakContextValue | null>(null);

/**
 * KeycloakProvider — encapsula a lógica de autenticação e fornece via Context
 *
 * Busca o estado de sessão do server via /api/auth/session e mantém atualizado
 * via polling periódico (para detectar expiração de token).
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { KeycloakProvider } from '@keycloak-lib/next';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <KeycloakProvider>
 *           {children}
 *         </KeycloakProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function KeycloakProvider({
  children,
  authBasePath = '/api/auth',
  loadingComponent,
  loginRequired = false,
  onSessionLoaded,
  onError,
  refreshInterval = 30000,
}: KeycloakProviderProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * Busca o estado de sessão do server
   */
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`${authBasePath}/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`);
      }

      const data = await response.json();

      setAuthenticated(data.authenticated);
      setUser(data.user ?? null);
      setAccessToken(data.accessToken ?? null);

      onSessionLoaded?.(
        data.authenticated
          ? {
              user: data.user,
              accessToken: data.accessToken,
              idToken: '',
              accessTokenExpiresAt: data.accessTokenExpiresAt,
              refreshTokenExpiresAt: data.refreshTokenExpiresAt,
            }
          : null
      );

      // Se loginRequired e não autenticado, redirecionar para login
      if (loginRequired && !data.authenticated) {
        const returnTo = window.location.pathname + window.location.search;
        window.location.href = `${authBasePath}/login?returnTo=${encodeURIComponent(returnTo)}`;
      }
    } catch (err) {
      console.error('[keycloak-lib] Failed to fetch session:', err);
      setAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      onError?.(err instanceof Error ? err : new Error('Session check failed'));
    } finally {
      setLoading(false);
    }
  }, [authBasePath, loginRequired, onSessionLoaded, onError]);

  /**
   * Redireciona para a página de login
   */
  const login = useCallback(
    (returnTo?: string) => {
      const target =
        returnTo ?? window.location.pathname + window.location.search;
      window.location.href = `${authBasePath}/login?returnTo=${encodeURIComponent(target)}`;
    },
    [authBasePath]
  );

  /**
   * Faz logout e redireciona
   */
  const logout = useCallback(
    (returnTo?: string) => {
      const params = returnTo
        ? `?returnTo=${encodeURIComponent(returnTo)}`
        : '';
      window.location.href = `${authBasePath}/logout${params}`;
    },
    [authBasePath]
  );

  /**
   * Verifica se o usuário tem uma role (realm ou client)
   */
  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user]
  );

  /**
   * Verifica se o usuário tem uma realm role
   */
  const hasRealmRole = useCallback(
    (role: string) => user?.realm_roles.includes(role) ?? false,
    [user]
  );

  /**
   * Verifica se o usuário tem uma client role
   */
  const hasClientRole = useCallback(
    (role: string) => user?.client_roles.includes(role) ?? false,
    [user]
  );

  /**
   * Atualiza a sessão manualmente
   */
  const refreshSession = useCallback(async () => {
    setLoading(true);
    await fetchSession();
  }, [fetchSession]);

  // Buscar sessão ao montar
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Polling periódico para manter sessão atualizada
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchSession();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchSession, refreshInterval]);

  // Context value
  const contextValue = useMemo<KeycloakContextValue>(
    () => ({
      authenticated,
      loading,
      user,
      accessToken,
      login,
      logout,
      hasRole,
      hasRealmRole,
      hasClientRole,
      refreshSession,
    }),
    [
      authenticated,
      loading,
      user,
      accessToken,
      login,
      logout,
      hasRole,
      hasRealmRole,
      hasClientRole,
      refreshSession,
    ]
  );

  // Mostrar componente de loading enquanto verifica sessão
  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return (
    <KeycloakContext.Provider value={contextValue}>
      {children}
    </KeycloakContext.Provider>
  );
}
