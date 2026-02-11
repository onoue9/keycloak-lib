'use client';

// ============================================================================
// useKeycloak — Hook para consumir o KeycloakContext
// ============================================================================

import { useContext } from 'react';
import type { KeycloakContextValue } from '../types';
import { KeycloakContext } from './KeycloakProvider';

/**
 * Hook para acessar o estado de autenticação do Keycloak
 *
 * Deve ser usado dentro de um `<KeycloakProvider>`.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useKeycloak } from '@keycloak-lib/next';
 *
 * export function UserInfo() {
 *   const { authenticated, user, login, logout, hasRole } = useKeycloak();
 *
 *   if (!authenticated) {
 *     return <button onClick={() => login()}>Entrar</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Olá, {user?.name}</p>
 *       {hasRole('admin') && <p>Você é admin!</p>}
 *       <button onClick={() => logout()}>Sair</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @throws Error se usado fora do KeycloakProvider
 */
export function useKeycloak(): KeycloakContextValue {
  const context = useContext(KeycloakContext);

  if (!context) {
    throw new Error(
      '[keycloak-lib] useKeycloak() must be used within a <KeycloakProvider>. ' +
        'Wrap your application with <KeycloakProvider> in your root layout.'
    );
  }

  return context;
}
