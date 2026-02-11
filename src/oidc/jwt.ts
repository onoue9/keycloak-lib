// ============================================================================
// JWT — Decodificação e verificação de tokens
// Usa a lib 'jose' para verificação de assinatura via JWKS
// ============================================================================

import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'jose';
import type { KeycloakUser } from '../types';
import { discoverEndpoints } from './discovery';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Obtém (ou cacheia) o JWKS para um Keycloak realm
 */
function getJWKS(jwksUri: string) {
  let jwks = jwksCache.get(jwksUri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUri));
    jwksCache.set(jwksUri, jwks);
  }
  return jwks;
}

/**
 * Verifica e decodifica um JWT (access_token ou id_token)
 * Valida assinatura, expiração e issuer
 */
export async function verifyToken(
  token: string,
  url: string,
  realm: string,
  clientId: string
): Promise<Record<string, unknown>> {
  const endpoints = await discoverEndpoints(url, realm);
  const jwks = getJWKS(endpoints.jwks_uri);

  const { payload } = await jwtVerify(token, jwks, {
    issuer: endpoints.issuer,
    audience: clientId,
  });

  return payload as Record<string, unknown>;
}

/**
 * Decodifica um JWT sem verificar assinatura
 * Útil para extrair claims rapidamente (ex: no client)
 */
export function decodeToken(token: string): Record<string, unknown> {
  return decodeJwt(token) as Record<string, unknown>;
}

/**
 * Extrai informações do usuário a partir do ID Token decodificado
 */
export function extractUser(claims: Record<string, unknown>, clientId: string): KeycloakUser {
  // Roles do realm
  const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
  const realmRoles = realmAccess?.roles ?? [];

  // Roles do client
  const resourceAccess = claims.resource_access as Record<
    string,
    { roles?: string[] }
  > | undefined;
  const clientRoles = resourceAccess?.[clientId]?.roles ?? [];

  // Todas as roles combinadas
  const allRoles = [...new Set([...realmRoles, ...clientRoles])];

  return {
    sub: claims.sub as string,
    name: claims.name as string | undefined,
    given_name: claims.given_name as string | undefined,
    family_name: claims.family_name as string | undefined,
    preferred_username: claims.preferred_username as string | undefined,
    email: claims.email as string | undefined,
    email_verified: claims.email_verified as boolean | undefined,
    roles: allRoles,
    realm_roles: realmRoles,
    client_roles: clientRoles,
    raw_claims: claims,
  };
}

/**
 * Verifica se um token já expirou (com margem de segurança)
 */
export function isTokenExpired(
  expiresAt: number,
  marginSeconds: number = 60
): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt - marginSeconds;
}
