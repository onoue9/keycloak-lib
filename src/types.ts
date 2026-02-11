// ============================================================================
// Types & Interfaces for @keycloak-lib/next
// ============================================================================

/**
 * Configuração do Keycloak
 */
export interface KeycloakConfig {
  /** URL base do Keycloak (ex: https://keycloak.example.com) */
  url: string;
  /** Nome do realm */
  realm: string;
  /** ID do client */
  clientId: string;
  /** Client secret (opcional, para confidential clients) */
  clientSecret?: string;
  /** Scopes adicionais além de 'openid profile email' */
  scopes?: string[];
  /** URL de redirect após login (default: /api/auth/callback) */
  redirectUri?: string;
  /** URL de redirect após logout (default: /) */
  postLogoutRedirectUri?: string;
  /** Prefixo das rotas de auth (default: /api/auth) */
  authBasePath?: string;
  /** Nome do cookie de sessão (default: kc_session) */
  cookieName?: string;
  /** Tempo em segundos antes da expiração para renovar o token (default: 60) */
  refreshMarginSeconds?: number;
}

/**
 * Dados do usuário extraídos do ID Token
 */
export interface KeycloakUser {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  roles: string[];
  realm_roles: string[];
  client_roles: string[];
  raw_claims: Record<string, unknown>;
}

/**
 * Tokens retornados pelo Keycloak
 */
export interface KeycloakTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  /** Timestamp (epoch seconds) de quando o access token expira */
  access_token_expires_at: number;
  /** Timestamp (epoch seconds) de quando o refresh token expira */
  refresh_token_expires_at: number;
}

/**
 * Sessão do usuário autenticado
 */
export interface KeycloakSession {
  user: KeycloakUser;
  accessToken: string;
  idToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

/**
 * Valor fornecido pelo KeycloakContext
 */
export interface KeycloakContextValue {
  /** Se o usuário está autenticado */
  authenticated: boolean;
  /** Se está carregando a sessão */
  loading: boolean;
  /** Dados do usuário (null se não autenticado) */
  user: KeycloakUser | null;
  /** Access token atual (null se não autenticado) */
  accessToken: string | null;
  /** Redireciona para a página de login do Keycloak */
  login: (returnTo?: string) => void;
  /** Faz logout e redireciona */
  logout: (returnTo?: string) => void;
  /** Verifica se o usuário tem uma role específica */
  hasRole: (role: string) => boolean;
  /** Verifica se o usuário tem uma realm role específica */
  hasRealmRole: (role: string) => boolean;
  /** Verifica se o usuário tem uma client role específica */
  hasClientRole: (role: string) => boolean;
  /** Atualiza a sessão (rebusca do servidor) */
  refreshSession: () => Promise<void>;
}

/**
 * Props do KeycloakProvider
 */
export interface KeycloakProviderProps {
  children: React.ReactNode;
  /** URL base do Keycloak */
  url?: string;
  /** Nome do realm */
  realm?: string;
  /** Client ID */
  clientId?: string;
  /** Prefixo das rotas de auth (default: /api/auth) */
  authBasePath?: string;
  /** Componente de loading enquanto verifica sessão */
  loadingComponent?: React.ReactNode;
  /** Se deve redirecionar automaticamente para login se não autenticado */
  loginRequired?: boolean;
  /** Callback quando a sessão é carregada */
  onSessionLoaded?: (session: KeycloakSession | null) => void;
  /** Callback quando ocorre erro de autenticação */
  onError?: (error: Error) => void;
  /** Intervalo de refresh em ms (default: 30000 = 30s) */
  refreshInterval?: number;
}

/**
 * Endpoints OIDC descobertos do Keycloak
 */
export interface OIDCEndpoints {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  introspection_endpoint: string;
  issuer: string;
}

/**
 * Resposta raw do Token Endpoint
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  scope: string;
  session_state?: string;
}
