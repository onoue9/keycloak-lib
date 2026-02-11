// ============================================================================
// Callback Route Handler — recebe o code e troca por tokens
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { KeycloakConfig } from '../types';
import { exchangeCodeForTokens } from '../oidc/token';
import { getPKCECookies, clearPKCECookies, setTokenCookies } from '../session/cookies';

/**
 * Cria o handler GET para /api/auth/callback
 *
 * 1. Valida state contra CSRF
 * 2. Recupera code_verifier dos cookies
 * 3. Troca authorization code por tokens
 * 4. Salva tokens em cookies HttpOnly
 * 5. Redireciona para a página original
 */
export function createCallbackHandler(config: KeycloakConfig) {
  return async function callbackHandler(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Verificar se houve erro do Keycloak
    if (error) {
      const baseUrl = new URL(request.url).origin;
      const errorUrl = new URL('/auth/error', baseUrl);
      errorUrl.searchParams.set('error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('description', errorDescription);
      }
      return NextResponse.redirect(errorUrl.toString());
    }

    // Verificar se o code foi recebido
    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    const cookiePrefix = config.cookieName ?? 'kc';
    const pkceCookies = await getPKCECookies(cookiePrefix);

    // Validar state contra CSRF
    if (!state || !pkceCookies.state || state !== pkceCookies.state) {
      return NextResponse.json(
        { error: 'Invalid state parameter — possible CSRF attack' },
        { status: 403 }
      );
    }

    // Verificar se o code_verifier existe
    if (!pkceCookies.codeVerifier) {
      return NextResponse.json(
        { error: 'Missing PKCE code verifier — session may have expired' },
        { status: 400 }
      );
    }

    // Construir redirect URI (deve ser o mesmo usado no login)
    const baseUrl = new URL(request.url).origin;
    const authBasePath = config.authBasePath ?? '/api/auth';
    const redirectUri = config.redirectUri ?? `${baseUrl}${authBasePath}/callback`;

    try {
      // Trocar code por tokens
      const tokens = await exchangeCodeForTokens(
        config,
        code,
        pkceCookies.codeVerifier,
        redirectUri
      );

      // Salvar tokens em cookies
      await setTokenCookies(tokens, { prefix: cookiePrefix });

      // Limpar cookies temporários de PKCE
      await clearPKCECookies(cookiePrefix);

      // Redirecionar para a página original
      const returnTo = pkceCookies.returnTo ?? '/';
      return NextResponse.redirect(new URL(returnTo, baseUrl).toString());
    } catch (err) {
      console.error('[keycloak-lib] Token exchange failed:', err);
      return NextResponse.json(
        {
          error: 'Token exchange failed',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}
