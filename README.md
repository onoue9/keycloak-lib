# @keycloak-lib/next

Biblioteca de autenticação Keycloak para **Next.js 16** (App Router). Implementa o fluxo **OAuth2 Authorization Code + PKCE** do zero, sem dependência de `keycloak-js`.

## Features

- 🔐 **PKCE completo** — Authorization Code Flow com Proof Key for Code Exchange
- 🍪 **Cookies HttpOnly** — Tokens armazenados de forma segura (proteção contra XSS)
- 🔄 **Refresh automático** — Renovação transparente de access tokens
- 🛡️ **Proteção CSRF** — Validação de state parameter
- ⚡ **Zero keycloak-js** — Implementação própria com `fetch` direto nos endpoints OIDC
- 🎯 **React Context + Hook** — API simples e familiar para componentes
- 📦 **Server + Client** — Session management no server, estado reativo no client
- 🏷️ **TypeScript** — Tipos completos para toda a API

## Instalação

```bash
npm install @keycloak-lib/next
```

## Configuração

### 1. Criar os Route Handlers

Crie o arquivo `app/api/auth/[...auth]/route.ts`:

```ts
import { createAuthHandlers } from '@keycloak-lib/next';

const handlers = createAuthHandlers({
  url: process.env.KEYCLOAK_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  // Opcional: clientSecret para confidential clients
  // clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
});

export const GET = handlers.GET;
```

### 2. Configurar variáveis de ambiente

Crie ou atualize o `.env.local`:

```env
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=my-realm
KEYCLOAK_CLIENT_ID=my-client
# KEYCLOAK_CLIENT_SECRET=my-secret  # apenas para confidential clients
```

### 3. Adicionar o Provider no Layout

```tsx
// app/layout.tsx
import { KeycloakProvider } from '@keycloak-lib/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <KeycloakProvider>{children}</KeycloakProvider>
      </body>
    </html>
  );
}
```

## Uso

### useKeycloak Hook

```tsx
'use client';
import { useKeycloak } from '@keycloak-lib/next';

export function UserMenu() {
  const { authenticated, user, login, logout, loading, hasRole } =
    useKeycloak();

  if (loading) return <span>Carregando...</span>;

  if (!authenticated) {
    return <button onClick={() => login()}>Entrar</button>;
  }

  return (
    <div>
      <p>
        Olá, {user?.name ?? user?.preferred_username}!
      </p>
      {hasRole('admin') && <span>👑 Admin</span>}
      <button onClick={() => logout()}>Sair</button>
    </div>
  );
}
```

### Login com returnTo

```tsx
// Após o login, redireciona para a página específica
<button onClick={() => login('/dashboard')}>Entrar</button>
```

### Login obrigatório

```tsx
// Redireciona automaticamente para o Keycloak se não autenticado
<KeycloakProvider loginRequired>
  {children}
</KeycloakProvider>
```

### Verificar roles

```tsx
const { hasRole, hasRealmRole, hasClientRole } = useKeycloak();

hasRole('admin');         // realm OU client role
hasRealmRole('admin');    // apenas realm role
hasClientRole('editor');  // apenas client role
```

### Acessar sessão no Server (Server Components / API Routes)

```ts
import { getSession } from '@keycloak-lib/next';

// Em um Server Component ou Route Handler
const session = await getSession({
  url: process.env.KEYCLOAK_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
});

if (session) {
  console.log('Usuário:', session.user.name);
  console.log('Token:', session.accessToken);
}
```

## Props do KeycloakProvider

| Prop               | Tipo            | Default       | Descrição                                         |
| ------------------- | --------------- | ------------- | ------------------------------------------------- |
| `authBasePath`     | `string`        | `/api/auth`   | Prefixo das rotas de auth                         |
| `loginRequired`    | `boolean`       | `false`       | Requer autenticação (redireciona para login)      |
| `loadingComponent` | `ReactNode`     | `undefined`   | Componente exibido durante carregamento            |
| `refreshInterval`  | `number`        | `30000` (30s) | Intervalo de polling da sessão (ms)                |
| `onSessionLoaded`  | `function`      | `undefined`   | Callback quando sessão é carregada                 |
| `onError`          | `function`      | `undefined`   | Callback quando ocorre erro                        |

## Opções do createAuthHandlers

| Opção                    | Tipo       | Default        | Descrição                                  |
| ------------------------- | ---------- | -------------- | ------------------------------------------ |
| `url`                    | `string`   | **Obrigatório** | URL base do Keycloak                       |
| `realm`                  | `string`   | **Obrigatório** | Nome do realm                               |
| `clientId`               | `string`   | **Obrigatório** | ID do client                                |
| `clientSecret`           | `string`   | `undefined`    | Secret (confidential clients)              |
| `scopes`                 | `string[]` | `[]`           | Scopes adicionais                           |
| `postLogoutRedirectUri`  | `string`   | `/`            | URL após logout                             |
| `cookieName`             | `string`   | `kc`           | Prefixo dos cookies                         |
| `refreshMarginSeconds`   | `number`   | `60`           | Margem para refresh do token               |

## Configuração no Keycloak

1. Crie um **Client** no seu realm
2. Defina o **Access Type** como `public` (ou `confidential` se usar `clientSecret`)
3. Configure os **Valid Redirect URIs**:
   - `http://localhost:3000/api/auth/callback` (desenvolvimento)
   - `https://seusite.com/api/auth/callback` (produção)
4. Configure **Valid Post Logout Redirect URIs**:
   - `http://localhost:3000`
   - `https://seusite.com`

## Rotas Criadas

| Rota                  | Método | Descrição                          |
| ---------------------- | ------ | ---------------------------------- |
| `/api/auth/login`     | GET    | Inicia o fluxo de login            |
| `/api/auth/callback`  | GET    | Recebe o callback do Keycloak      |
| `/api/auth/logout`    | GET    | Encerra a sessão                    |
| `/api/auth/session`   | GET    | Retorna o estado da sessão (JSON)  |

## Licença

MIT
