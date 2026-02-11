// ============================================================================
// Session — gerenciamento de sessão server-side
// ============================================================================

import type { KeycloakConfig, KeycloakSession } from '../types';
import { getTokenCookies, setTokenCookies } from './cookies';
import { decodeToken, extractUser, isTokenExpired } from '../oidc/jwt';
import { refreshAccessToken } from '../oidc/token';

/**
 * Obtém a sessão atual do usuário a partir dos cookies
 * Se o access token estiver expirado mas o refresh token ainda for válido,
 * faz o refresh automaticamente
 *
 * @returns KeycloakSession ou null se não autenticado
 */
export async function getSession(
  config: KeycloakConfig
): Promise<KeycloakSession | null> {
  const cookiePrefix = config.cookieName ?? 'kc';
  const refreshMargin = config.refreshMarginSeconds ?? 60;

  const tokenCookies = await getTokenCookies(cookiePrefix);

  // Sem tokens = não autenticado
  if (!tokenCookies.accessToken && !tokenCookies.refreshToken) {
    return null;
  }

  // Verificar se o access token expirou
  if (
    tokenCookies.accessToken &&
    tokenCookies.expiresAt &&
    !isTokenExpired(tokenCookies.expiresAt, refreshMargin)
  ) {
    // Access token válido — decodificar e retornar sessão
    return buildSession(tokenCookies.accessToken, tokenCookies.idToken, tokenCookies.expiresAt, tokenCookies.refreshExpiresAt, config.clientId);
  }

  // Access token expirado — tentar refresh
  if (tokenCookies.refreshToken) {
    if (
      tokenCookies.refreshExpiresAt &&
      isTokenExpired(tokenCookies.refreshExpiresAt, 0)
    ) {
      // Refresh token também expirado — sessão inválida
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(config, tokenCookies.refreshToken);

      // Salvar novos tokens nos cookies
      await setTokenCookies(newTokens, { prefix: cookiePrefix });

      return buildSession(
        newTokens.access_token,
        newTokens.id_token,
        newTokens.access_token_expires_at,
        newTokens.refresh_token_expires_at,
        config.clientId
      );
    } catch {
      // Refresh falhou — sessão inválida
      return null;
    }
  }

  return null;
}

/**
 * Constrói o objeto de sessão a partir dos tokens
 */
function buildSession(
  accessToken: string,
  idToken: string | null,
  accessTokenExpiresAt: number | null,
  refreshTokenExpiresAt: number | null,
  clientId: string
): KeycloakSession {
  // Decodificar o token que tiver mais informações
  // O ID token geralmente tem os dados do usuário, mas em caso de ausência usamos o access token
  const tokenToDecode = idToken ?? accessToken;
  const claims = decodeToken(tokenToDecode);

  // Também decodificamos o access token para pegar as roles
  const accessClaims = idToken ? decodeToken(accessToken) : claims;

  // Merge claims para ter roles do access token + dados do id token
  const mergedClaims = { ...claims, ...accessClaims, ...claims };

  const user = extractUser(mergedClaims, clientId);

  return {
    user,
    accessToken,
    idToken: idToken ?? accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt ?? 0,
    refreshTokenExpiresAt: refreshTokenExpiresAt ?? 0,
  };
}
