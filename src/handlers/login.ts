// ============================================================================
// Login Route Handler — inicia o fluxo OAuth2 Authorization Code + PKCE
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { KeycloakConfig } from '../types';
import { discoverEndpoints } from '../oidc/discovery';
import { generatePKCEPair, generateState } from '../oidc/pkce';
import { setPKCECookies } from '../session/cookies';

/**
 * Cria o handler GET para /api/auth/login
 *
 * 1. Gera PKCE (code_verifier + code_challenge)
 * 2. Gera state para proteção CSRF
 * 3. Salva verifier + state em cookies temporários
 * 4. Redireciona para o Authorization Endpoint do Keycloak
 */
export function createLoginHandler(config: KeycloakConfig) {
  return async function loginHandler(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') ?? '/';

    const endpoints = await discoverEndpoints(config.url, config.realm);
    const { codeVerifier, codeChallenge } = await generatePKCEPair();
    const state = generateState();

    // Construir redirect URI para o callback
    const baseUrl = new URL(request.url).origin;
    const authBasePath = config.authBasePath ?? '/api/auth';
    const redirectUri = config.redirectUri ?? `${baseUrl}${authBasePath}/callback`;

    // Salvar PKCE e state em cookies temporários
    const cookiePrefix = config.cookieName ?? 'kc';
    await setPKCECookies(codeVerifier, state, returnTo, cookiePrefix);

    // Scopes padrão + custom
    const scopes = ['openid', 'profile', 'email', ...(config.scopes ?? [])];
    const scopeString = [...new Set(scopes)].join(' ');

    // Construir URL de autorização
    const authUrl = new URL(endpoints.authorization_endpoint);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopeString);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return NextResponse.redirect(authUrl.toString());
  };
}
