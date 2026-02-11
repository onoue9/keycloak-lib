// ============================================================================
// @keycloak-lib/next — Barrel Export
// ============================================================================

// React Components
export { KeycloakProvider } from './react/KeycloakProvider';
export { useKeycloak } from './react/useKeycloak';

// Route Handlers Factory
export { createAuthHandlers } from './handlers/create-auth-handlers';

// Individual Route Handlers (para uso avançado)
export { createLoginHandler } from './handlers/login';
export { createCallbackHandler } from './handlers/callback';
export { createLogoutHandler } from './handlers/logout';
export { createSessionHandler } from './handlers/session-api';

// Session (server-side)
export { getSession } from './session/session';

// OIDC Utilities (para uso avançado)
export { discoverEndpoints, clearDiscoveryCache } from './oidc/discovery';
export { generatePKCEPair, generateCodeVerifier, generateCodeChallenge, generateState } from './oidc/pkce';
export { exchangeCodeForTokens, refreshAccessToken } from './oidc/token';
export { verifyToken, decodeToken, extractUser, isTokenExpired } from './oidc/jwt';

// Cookie Utilities (para uso avançado)
export { getTokenCookies, clearTokenCookies } from './session/cookies';

// Types
export type {
  KeycloakConfig,
  KeycloakUser,
  KeycloakTokens,
  KeycloakSession,
  KeycloakContextValue,
  KeycloakProviderProps,
  OIDCEndpoints,
  TokenResponse,
} from './types';
