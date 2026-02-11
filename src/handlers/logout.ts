// ============================================================================
// Logout Route Handler — limpa sessão e redireciona para o Keycloak logout
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { KeycloakConfig } from '../types';
import { discoverEndpoints } from '../oidc/discovery';
import { getTokenCookies, clearTokenCookies } from '../session/cookies';

/**
 * Cria o handler GET para /api/auth/logout
 *
 * 1. Lê o id_token dos cookies (necessário para o logout do Keycloak)
 * 2. Limpa todos os cookies de sessão
 * 3. Redireciona para o End Session Endpoint do Keycloak
 */
export function createLogoutHandler(config: KeycloakConfig) {
  return async function logoutHandler(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo');
    const baseUrl = new URL(request.url).origin;
    const postLogoutRedirectUri =
      returnTo ?? config.postLogoutRedirectUri ?? baseUrl;

    const cookiePrefix = config.cookieName ?? 'kc';

    // Ler o id_token antes de limpar cookies
    const tokenCookies = await getTokenCookies(cookiePrefix);
    const idToken = tokenCookies.idToken;

    // Limpar todos os cookies de sessão
    await clearTokenCookies(cookiePrefix);

    // Se tiver endpoints do Keycloak, redirecionar para logout lá também
    try {
      const endpoints = await discoverEndpoints(config.url, config.realm);

      const logoutUrl = new URL(endpoints.end_session_endpoint);
      logoutUrl.searchParams.set(
        'post_logout_redirect_uri',
        postLogoutRedirectUri
      );
      logoutUrl.searchParams.set('client_id', config.clientId);

      if (idToken) {
        logoutUrl.searchParams.set('id_token_hint', idToken);
      }

      return NextResponse.redirect(logoutUrl.toString());
    } catch {
      // Se não conseguir contatar Keycloak, apenas redireciona para home
      return NextResponse.redirect(postLogoutRedirectUri);
    }
  };
}
