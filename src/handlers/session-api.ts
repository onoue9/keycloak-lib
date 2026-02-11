// ============================================================================
// Session API Route Handler — retorna a sessão atual como JSON
// ============================================================================

import { NextResponse } from 'next/server';
import type { KeycloakConfig } from '../types';
import { getSession } from '../session/session';

/**
 * Cria o handler GET para /api/auth/session
 *
 * Retorna a sessão atual como JSON, incluindo dados do usuário e token.
 * Usado pelo KeycloakProvider no client para hidratar o Context.
 */
export function createSessionHandler(config: KeycloakConfig) {
  return async function sessionHandler(): Promise<NextResponse> {
    try {
      const session = await getSession(config);

      if (!session) {
        return NextResponse.json(
          { authenticated: false, user: null },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          authenticated: true,
          user: session.user,
          accessToken: session.accessToken,
          accessTokenExpiresAt: session.accessTokenExpiresAt,
          refreshTokenExpiresAt: session.refreshTokenExpiresAt,
        },
        { status: 200 }
      );
    } catch (err) {
      console.error('[keycloak-lib] Session check failed:', err);
      return NextResponse.json(
        { authenticated: false, user: null, error: 'Session check failed' },
        { status: 200 }
      );
    }
  };
}
