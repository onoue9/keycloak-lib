// ============================================================================
// Factory — cria todos os route handlers com uma única config
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { KeycloakConfig } from '../types';
import { createLoginHandler } from './login';
import { createCallbackHandler } from './callback';
import { createLogoutHandler } from './logout';
import { createSessionHandler } from './session-api';

/**
 * Cria todos os auth route handlers com a configuração do Keycloak.
 *
 * Uso no projeto Next.js:
 *
 * ```ts
 * // app/api/auth/[...auth]/route.ts
 * import { createAuthHandlers } from '@keycloak-lib/next';
 *
 * const handlers = createAuthHandlers({
 *   url: process.env.KEYCLOAK_URL!,
 *   realm: process.env.KEYCLOAK_REALM!,
 *   clientId: process.env.KEYCLOAK_CLIENT_ID!,
 * });
 *
 * export const GET = handlers.GET;
 * ```
 */
export function createAuthHandlers(config: KeycloakConfig) {
  const loginHandler = createLoginHandler(config);
  const callbackHandler = createCallbackHandler(config);
  const logoutHandler = createLogoutHandler(config);
  const sessionHandler = createSessionHandler(config);

  const authBasePath = config.authBasePath ?? '/api/auth';

  async function GET(
    request: NextRequest,
    context: { params: Promise<{ auth: string[] }> }
  ): Promise<NextResponse> {
    const params = await context.params;
    const route = params.auth?.[0];

    switch (route) {
      case 'login':
        return loginHandler(request);

      case 'callback':
        return callbackHandler(request);

      case 'logout':
        return logoutHandler(request);

      case 'session':
        return sessionHandler();

      default:
        return NextResponse.json(
          {
            error: 'Not found',
            availableRoutes: [
              `${authBasePath}/login`,
              `${authBasePath}/callback`,
              `${authBasePath}/logout`,
              `${authBasePath}/session`,
            ],
          },
          { status: 404 }
        );
    }
  }

  return { GET };
}
