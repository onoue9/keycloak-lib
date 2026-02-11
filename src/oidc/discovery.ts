// ============================================================================
// OIDC Discovery — busca e cacheia os endpoints do Keycloak
// ============================================================================

import type { OIDCEndpoints } from '../types';

const cache = new Map<string, { endpoints: OIDCEndpoints; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Constrói a URL base do realm
 */
export function getRealmUrl(url: string, realm: string): string {
  const base = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${base}/realms/${realm}`;
}

/**
 * Descobre os endpoints OIDC do Keycloak via .well-known
 * Os resultados são cacheados por 5 minutos
 */
export async function discoverEndpoints(
  url: string,
  realm: string
): Promise<OIDCEndpoints> {
  const cacheKey = `${url}:${realm}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.endpoints;
  }

  const realmUrl = getRealmUrl(url, realm);
  const wellKnownUrl = `${realmUrl}/.well-known/openid-configuration`;

  const response = await fetch(wellKnownUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to discover OIDC endpoints from ${wellKnownUrl}: ${response.status} ${response.statusText}`
    );
  }

  const config = await response.json();

  const endpoints: OIDCEndpoints = {
    authorization_endpoint: config.authorization_endpoint,
    token_endpoint: config.token_endpoint,
    userinfo_endpoint: config.userinfo_endpoint,
    end_session_endpoint: config.end_session_endpoint,
    jwks_uri: config.jwks_uri,
    introspection_endpoint: config.introspection_endpoint,
    issuer: config.issuer,
  };

  // Validar que todos os endpoints necessários existem
  const requiredFields: (keyof OIDCEndpoints)[] = [
    'authorization_endpoint',
    'token_endpoint',
    'end_session_endpoint',
    'jwks_uri',
    'issuer',
  ];

  for (const field of requiredFields) {
    if (!endpoints[field]) {
      throw new Error(
        `Missing required OIDC endpoint '${field}' in discovery document from ${wellKnownUrl}`
      );
    }
  }

  cache.set(cacheKey, {
    endpoints,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return endpoints;
}

/**
 * Limpa o cache de discovery (útil para testes)
 */
export function clearDiscoveryCache(): void {
  cache.clear();
}
