// ============================================================================
// PKCE — Proof Key for Code Exchange
// Implementação usando Web Crypto API (funciona em Node.js 20+ e browser)
// ============================================================================

/**
 * Gera um code_verifier aleatório (43-128 caracteres, URL-safe)
 * RFC 7636: https://tools.ietf.org/html/rfc7636#section-4.1
 */
export function generateCodeVerifier(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Gera o code_challenge a partir do code_verifier usando SHA-256
 * RFC 7636: https://tools.ietf.org/html/rfc7636#section-4.2
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Gera o par code_verifier + code_challenge
 */
export async function generatePKCEPair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Gera um string aleatório para usar como state parameter
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Encode Uint8Array para Base64 URL-safe (sem padding)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
