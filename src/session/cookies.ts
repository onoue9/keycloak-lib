// ============================================================================
// Cookies — gerenciamento de cookies HttpOnly para tokens
// ============================================================================

import { cookies } from 'next/headers';
import type { KeycloakTokens } from '../types';

const DEFAULT_COOKIE_PREFIX = 'kc';

interface CookieOptions {
  prefix?: string;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  domain?: string;
}

function getCookieNames(prefix: string) {
  return {
    accessToken: `${prefix}_at`,
    refreshToken: `${prefix}_rt`,
    idToken: `${prefix}_id`,
    expiresAt: `${prefix}_exp`,
    refreshExpiresAt: `${prefix}_rexp`,
    codeVerifier: `${prefix}_cv`,
    state: `${prefix}_state`,
    returnTo: `${prefix}_return`,
  };
}

/**
 * Salva os tokens em cookies HttpOnly
 */
export async function setTokenCookies(
  tokens: KeycloakTokens,
  options: CookieOptions = {}
): Promise<void> {
  const prefix = options.prefix ?? DEFAULT_COOKIE_PREFIX;
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  const baseOptions = {
    httpOnly: true,
    secure: options.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options.sameSite ?? ('lax' as const),
    path: options.path ?? '/',
    domain: options.domain,
  };

  // Access token — expira quando o token expira
  cookieStore.set(names.accessToken, tokens.access_token, {
    ...baseOptions,
    maxAge: tokens.expires_in,
  });

  // Refresh token — expira quando o refresh token expira
  cookieStore.set(names.refreshToken, tokens.refresh_token, {
    ...baseOptions,
    maxAge: tokens.refresh_expires_in,
  });

  // ID token — mesmo tempo do access token
  cookieStore.set(names.idToken, tokens.id_token, {
    ...baseOptions,
    maxAge: tokens.expires_in,
  });

  // Timestamps de expiração (não HttpOnly para que o client possa checar)
  cookieStore.set(names.expiresAt, tokens.access_token_expires_at.toString(), {
    ...baseOptions,
    httpOnly: false,
    maxAge: tokens.refresh_expires_in,
  });

  cookieStore.set(
    names.refreshExpiresAt,
    tokens.refresh_token_expires_at.toString(),
    {
      ...baseOptions,
      httpOnly: false,
      maxAge: tokens.refresh_expires_in,
    }
  );
}

/**
 * Lê os tokens dos cookies
 */
export async function getTokenCookies(
  prefix: string = DEFAULT_COOKIE_PREFIX
): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  refreshExpiresAt: number | null;
}> {
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(names.accessToken)?.value ?? null;
  const refreshToken = cookieStore.get(names.refreshToken)?.value ?? null;
  const idToken = cookieStore.get(names.idToken)?.value ?? null;
  const expiresAtStr = cookieStore.get(names.expiresAt)?.value ?? null;
  const refreshExpiresAtStr =
    cookieStore.get(names.refreshExpiresAt)?.value ?? null;

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
    refreshExpiresAt: refreshExpiresAtStr
      ? parseInt(refreshExpiresAtStr, 10)
      : null,
  };
}

/**
 * Limpa todos os cookies de token
 */
export async function clearTokenCookies(
  prefix: string = DEFAULT_COOKIE_PREFIX,
  options: CookieOptions = {}
): Promise<void> {
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  const deleteOptions = {
    path: options.path ?? '/',
    domain: options.domain,
  };

  cookieStore.delete({ name: names.accessToken, ...deleteOptions });
  cookieStore.delete({ name: names.refreshToken, ...deleteOptions });
  cookieStore.delete({ name: names.idToken, ...deleteOptions });
  cookieStore.delete({ name: names.expiresAt, ...deleteOptions });
  cookieStore.delete({ name: names.refreshExpiresAt, ...deleteOptions });
}

/**
 * Salva o code_verifier e state em cookies temporários (para o callback)
 */
export async function setPKCECookies(
  codeVerifier: string,
  state: string,
  returnTo: string,
  prefix: string = DEFAULT_COOKIE_PREFIX,
  options: CookieOptions = {}
): Promise<void> {
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  const baseOptions = {
    httpOnly: true,
    secure: options.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options.sameSite ?? ('lax' as const),
    path: options.path ?? '/',
    maxAge: 300, // 5 minutos — tempo máximo para completar o login
  };

  cookieStore.set(names.codeVerifier, codeVerifier, baseOptions);
  cookieStore.set(names.state, state, baseOptions);
  cookieStore.set(names.returnTo, returnTo, {
    ...baseOptions,
    httpOnly: false,
  });
}

/**
 * Lê os cookies de PKCE
 */
export async function getPKCECookies(
  prefix: string = DEFAULT_COOKIE_PREFIX
): Promise<{
  codeVerifier: string | null;
  state: string | null;
  returnTo: string | null;
}> {
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  return {
    codeVerifier: cookieStore.get(names.codeVerifier)?.value ?? null,
    state: cookieStore.get(names.state)?.value ?? null,
    returnTo: cookieStore.get(names.returnTo)?.value ?? null,
  };
}

/**
 * Limpa os cookies temporários de PKCE
 */
export async function clearPKCECookies(
  prefix: string = DEFAULT_COOKIE_PREFIX,
  options: CookieOptions = {}
): Promise<void> {
  const names = getCookieNames(prefix);
  const cookieStore = await cookies();

  const deleteOptions = {
    path: options.path ?? '/',
    domain: options.domain,
  };

  cookieStore.delete({ name: names.codeVerifier, ...deleteOptions });
  cookieStore.delete({ name: names.state, ...deleteOptions });
  cookieStore.delete({ name: names.returnTo, ...deleteOptions });
}
