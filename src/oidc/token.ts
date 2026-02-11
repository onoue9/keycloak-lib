// ============================================================================
// Token — troca de código por tokens e refresh
// ============================================================================

import type { KeycloakConfig, KeycloakTokens, TokenResponse } from '../types';
import { discoverEndpoints } from './discovery';

/**
 * Troca o authorization code por tokens via Token Endpoint
 */
export async function exchangeCodeForTokens(
  config: KeycloakConfig,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<KeycloakTokens> {
  const endpoints = await discoverEndpoints(config.url, config.realm);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  if (config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }

  const response = await fetch(endpoints.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token exchange failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  const tokenResponse: TokenResponse = await response.json();
  return normalizeTokenResponse(tokenResponse);
}

/**
 * Renova o access token usando o refresh token
 */
export async function refreshAccessToken(
  config: KeycloakConfig,
  refreshToken: string
): Promise<KeycloakTokens> {
  const endpoints = await discoverEndpoints(config.url, config.realm);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  if (config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }

  const response = await fetch(endpoints.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token refresh failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  const tokenResponse: TokenResponse = await response.json();
  return normalizeTokenResponse(tokenResponse);
}

/**
 * Normaliza a resposta do token endpoint para nosso formato interno
 */
function normalizeTokenResponse(response: TokenResponse): KeycloakTokens {
  const now = Math.floor(Date.now() / 1000);

  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    id_token: response.id_token,
    token_type: response.token_type,
    expires_in: response.expires_in,
    refresh_expires_in: response.refresh_expires_in,
    access_token_expires_at: now + response.expires_in,
    refresh_token_expires_at: now + response.refresh_expires_in,
  };
}
