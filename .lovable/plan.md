

## Fase 1.0.2 - Expandir AuthContext (Roles e Organização)

### Objetivo
Adicionar suporte ao role `master` e dados de organização no AuthContext, sem alterar a lógica existente de admin, signUp ou signIn.

### Arquivo a modificar
`src/contexts/AuthContext.tsx`

### Alterações

**1. Adicionar interface `Organization` e expandir `AuthContextType`**
- Nova interface `Organization` com campos `id`, `name`, `templates_limit`, `created_at`
- Adicionar `isMaster: boolean` e `organization: Organization | null` à interface do contexto

**2. Novos estados**
- `isMaster` (boolean, default `false`)
- `organization` (Organization | null, default `null`)

**3. Nova função `checkMasterRole(userId)`**
- Consulta `user_roles` filtrando por `role = 'master'`
- Se for master, busca dados da organização via `supabase.rpc('get_user_organization')`
- Popula `isMaster` e `organization`
- Em caso de erro, reseta ambos para `false`/`null`

**4. Integrar no fluxo de autenticação**
- No `onAuthStateChange`: chamar `checkMasterRole` junto com `checkAdminStatus` dentro do `setTimeout`
- No `getSession`: chamar `checkMasterRole` junto com `checkAdminStatus`
- No `else` (sem sessão): resetar `isMaster` e `organization`

**5. Atualizar `signOut`**
- Adicionar `setIsMaster(false)` e `setOrganization(null)`

**6. Expor no Provider**
- Adicionar `isMaster` e `organization` ao objeto `value`

### O que NAO muda
- Lógica de `signUp`, `signIn` (intocadas)
- Verificação de admin existente (mantida)
- Nenhum componente de UI criado nesta fase

### Seção Tecnica

Todas as mudanças ocorrem em um unico arquivo. A consulta de master role usa query direta em `user_roles` (SELECT permitido por RLS para o proprio usuario). A busca de organizacao usa a funcao `get_user_organization()` ja criada na Fase 1.0.1 como `SECURITY DEFINER`.

