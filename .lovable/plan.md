

## Fase 1.0.2 - Expandir AuthContext (Roles e Organização) ✅ CONCLUÍDA

### Alterações realizadas em `src/contexts/AuthContext.tsx`
- Interface `Organization` criada com `id`, `name`, `templates_limit`, `created_at`
- `AuthContextType` expandido com `isMaster` e `organization`
- Função `checkMasterRole(userId)` implementada: consulta `user_roles` e `get_user_organization()`
- Integrado em `onAuthStateChange` e `getSession`
- `signOut` reseta `isMaster` e `organization`
- Novos valores expostos no Provider
