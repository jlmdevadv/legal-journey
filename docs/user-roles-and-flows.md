# Roles de Usuário, Acesso a Rotas e Jornadas

Este documento descreve os quatro perfis de usuário do Legal Journey, as rotas que cada um pode acessar, como a autenticação e as permissões funcionam tecnicamente, e as jornadas principais de uso.

---

## 1. Visão Geral

O sistema possui quatro perfis de usuário, com diferentes níveis de acesso:

| Perfil | Descrição |
|--------|-----------|
| **Guest** (visitante) | Usuário não autenticado. Pode acessar a página inicial e visualizar templates, mas não pode salvar contratos. |
| **User** (usuário comum) | Usuário autenticado sem role especial. Pode criar e salvar contratos próprios e acessar a página "Meus Contratos". |
| **Admin** | Usuário com a role `admin` na tabela `user_roles`. Possui as mesmas permissões do User, com acesso adicional às funcionalidades de edição de templates na interface. |
| **Master** | Usuário com a role `master` na tabela `user_roles`. Gerencia a organização: cria templates, gera links de preenchimento compartilhado e revisa documentos enviados pelos usuários. |

> **Nota sobre Admin vs. Master:** A role `admin` habilita a edição de templates diretamente na interface pública (na rota `/`). A role `master` dá acesso ao painel exclusivo `/master` e ao fluxo B2B (organização → usuário → revisão). São roles independentes: um usuário pode ter as duas ao mesmo tempo.

---

## 2. Tabela de Roles e Rotas

| Rota | Guest | User | Admin | Master | Guarda |
|------|-------|------|-------|--------|--------|
| `/` | ✅ Acessa, seleciona template e preenche (sem salvar) | ✅ Acessa, preenche e salva automaticamente | ✅ Igual ao User + pode editar templates | ✅ Igual ao User | Pública |
| `/auth` | ✅ Página de login/cadastro | ✅ Redirecionado para `/` se já logado | ✅ | ✅ | Pública |
| `/meus-contratos` | ❌ Redirecionado para `/auth` | ✅ Vê e gerencia contratos próprios | ✅ | ✅ | `ProtectedRoute` |
| `/master` | ❌ Redirecionado para `/auth` | ❌ Redirecionado para `/` | ❌ Redirecionado para `/` | ✅ Painel de gerenciamento da organização | `MasterProtectedRoute` |
| `/master/template/:templateId` | ❌ | ❌ | ❌ | ✅ Editor de template | `MasterProtectedRoute` |
| `/master/review/:documentId` | ❌ | ❌ | ❌ | ✅ Tela de revisão de documento | `MasterProtectedRoute` |
| `/s/:token` | ❌ Redirecionado para `/auth` após validação do link | ✅ Acessa formulário de preenchimento compartilhado | ✅ | ✅ | Pública, mas exige login para preencher |
| `*` (404) | ✅ Página Not Found | ✅ | ✅ | ✅ | Pública |

---

## 3. Como as Roles Funcionam Tecnicamente

### 3.1 Autenticação com Supabase e AuthContext

O estado de autenticação é gerenciado pelo `AuthProvider` em `src/contexts/AuthContext.tsx`. Ao inicializar, o provider:

1. Registra um listener `supabase.auth.onAuthStateChange` para reagir a eventos de login/logout.
2. Chama `supabase.auth.getSession()` para recuperar a sessão já existente.
3. Para cada sessão válida, executa em paralelo `checkAdminStatus` e `checkMasterRole`.

O contexto expõe os seguintes valores:

```ts
{
  user: User | null;       // objeto Supabase Auth
  session: Session | null; // sessão Supabase
  isLoading: boolean;      // true enquanto a sessão inicial está sendo carregada
  isAdmin: boolean;
  isMaster: boolean;
  organization: Organization | null; // preenchida apenas para Master
}
```

### 3.2 Verificação da Role `admin`

A role `admin` é verificada via RPC Supabase:

```ts
// src/contexts/AuthContext.tsx
const { data, error } = await supabase
  .rpc('has_role', { _user_id: userId, _role: 'admin' });

if (!error && data) {
  setIsAdmin(true);
}
```

A função `has_role` consulta a tabela `user_roles` no banco. O valor `isAdmin` é `true` apenas se a RPC retornar `true` sem erros.

### 3.3 Verificação da Role `master`

A role `master` é verificada com consulta direta à tabela `user_roles`:

```ts
// src/contexts/AuthContext.tsx
const { data: roles, error: rolesError } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .eq('role', 'master')
  .maybeSingle();

if (!rolesError && roles) {
  setIsMaster(true);
  // também busca a organização via RPC get_user_organization
}
```

Se o usuário tem role `master`, o provider também busca os dados da organização associada via `supabase.rpc('get_user_organization')` e os armazena em `organization`.

### 3.4 Componente `ProtectedRoute`

`src/components/auth/ProtectedRoute.tsx` — protege rotas que exigem autenticação básica (e opcionalmente role admin).

Comportamento:
- Se `isLoading`: exibe spinner.
- Se sem `user`: redireciona para `/auth`.
- Se `requireAdmin=true` e `!isAdmin`: redireciona para `/`.
- Caso contrário: renderiza os filhos.

```tsx
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};
```

> **Observação:** A prop `requireAdmin` existe no componente, mas nenhuma rota em `App.tsx` a utiliza atualmente. Todas as rotas protegidas por `ProtectedRoute` exigem apenas autenticação básica.

### 3.5 Componente `MasterProtectedRoute`

`src/components/auth/MasterProtectedRoute.tsx` — protege as rotas `/master/*`.

Comportamento:
- Se `isLoading`: exibe spinner.
- Se sem `user`: redireciona para `/auth`.
- Se `!isMaster`: redireciona para `/` (mesmo que seja Admin).
- Caso contrário: renderiza os filhos.

```tsx
const MasterProtectedRoute = ({ children }) => {
  const { user, isMaster, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth" />;
  if (!isMaster) return <Navigate to="/" />;
  return <>{children}</>;
};
```

---

## 4. Jornada do Usuário Comum (User)

### 4.1 Cadastro e Login

1. O usuário acessa `/auth` e escolhe a aba "Cadastrar".
2. Preenche nome, email e senha. O `signUp` do Supabase é chamado com `emailRedirectTo` apontando para `/`.
3. Após confirmação, o usuário faz login na aba "Entrar".
4. O `AuthProvider` detecta a nova sessão e define `user` — a aplicação redireciona para `/`.

### 4.2 Seleção de Template

5. Na página inicial (`/`), o componente `TemplateSelector` lista os templates disponíveis (globais e da organização, se aplicável).
6. O usuário clica em um template para selecioná-lo. O estado `selectedTemplate` é definido no `ContractContext`.

### 4.3 Preenchimento do Questionário

7. O componente `QuestionnaireForm` é exibido ao lado da pré-visualização do contrato (`ContractPreview`).
8. O usuário responde uma pergunta por vez. O auto-save é ativado automaticamente a cada 30 segundos e também ao avançar para a próxima pergunta.
9. O contrato é salvo como `draft` no banco de dados (`saved_contracts`).

### 4.4 Salvar / Finalizar

10. Ao concluir todas as perguntas, o usuário chega à tela de resumo e pode exportar o contrato como PDF.
11. O contrato permanece salvo com status `draft` ou `completed` conforme o fluxo.

### 4.5 Visualização em Meus Contratos

12. O usuário acessa `/meus-contratos` pelo menu.
13. A página lista os contratos próprios (sem `organization_id`) e, se aplicável, documentos compartilhados (com `organization_id`).
14. O usuário pode abrir um contrato para continuar editando ou excluí-lo.

### 4.6 Envio para Revisão (fluxo B2B)

15. Se o contrato foi criado a partir de um link compartilhado (`/s/:token`), ele estará associado a uma organização.
16. Ao concluir o preenchimento, o usuário pode enviar o documento para revisão. O status muda para `pending_review`.
17. Após a revisão, o usuário recebe o resultado (aprovado ou reprovado) visível em "Meus Contratos".
18. Se `rejected`: o usuário vê o feedback do revisor e pode clicar em "Editar e Reenviar" para corrigir e reenviar o documento.

---

## 5. Jornada do Master

### 5.1 Login e Acesso ao Painel

1. O Master faz login normalmente em `/auth`.
2. O `AuthProvider` detecta a role `master` na tabela `user_roles` e carrega os dados da organização via `get_user_organization`.
3. O Master acessa `/master`. O `MasterProtectedRoute` valida `isMaster === true` antes de renderizar o dashboard.

### 5.2 Gerenciamento de Templates

4. No painel `/master`, o Master vê a lista de templates da organização e os contadores de documentos (pendentes, aprovados, reprovados).
5. Para criar um template: clica em "Novo Modelo" → navega para `/master/template/new` → preenche nome, texto do contrato e campos dinâmicos no editor (`MasterTemplateEditor`) → salva.
6. Para editar um template existente: clica em "Editar" na linha do template → navega para `/master/template/:templateId`.
7. Para gerar um link de preenchimento compartilhado: clica em "Gerar Link" → o modal `GenerateLinkModal` cria um token via Supabase e exibe a URL `/s/:token` para distribuição.
8. Para excluir um template: clica no ícone de lixeira e confirma.

> O número máximo de templates é definido pelo campo `templates_limit` da organização. Ao atingir o limite, o botão "Novo Modelo" é desabilitado e um aviso é exibido.

### 5.3 Revisão de Documentos

9. Na seção "Documentos Recebidos" do painel `/master`, o Master vê todos os documentos da organização com seus status.
10. Para revisar: clica em "Revisar" na linha do documento → navega para `/master/review/:documentId`.
11. Na tela de revisão (`MasterReview`), o Master visualiza a prévia do documento gerado.
12. Se o status for `pending_review`: o Master pode adicionar observações no campo de texto e então clicar em:
    - **Aprovar** → status muda para `approved`, com data e hora de revisão registradas.
    - **Reprovar** → status muda para `rejected`, com o texto das observações salvo em `review_notes`.
13. O resultado fica visível para o usuário em `/meus-contratos`.

---

## 6. Status de Contratos

| Status | Rótulo | Descrição | Quem define | O que o usuário pode fazer |
|--------|--------|-----------|-------------|---------------------------|
| `draft` | Rascunho | Contrato em preenchimento, ainda não finalizado. | Sistema (auto-save) | Continuar editando, excluir |
| `completed` | Finalizado | Contrato concluído no fluxo B2C (sem organização). | Sistema (ao finalizar o questionário) | Visualizar, exportar PDF, excluir |
| `pending_review` | Pendente de Revisão | Documento enviado para revisão da organização. | Usuário (ao submeter para revisão) | Aguardar; não pode editar enquanto pendente |
| `approved` | Aprovado | Documento aprovado pelo Master. | Master (via `/master/review/:id`) | Visualizar, exportar PDF |
| `rejected` | Reprovado | Documento reprovado pelo Master, com feedback. | Master (via `/master/review/:id`) | Ler o feedback, editar e reenviar (`pending_review`) |
| `archived` | Arquivado | Status reservado para arquivamento futuro (atualmente não gerado pela UI). | — | — |

---

## 7. Como Atribuir Roles

A atribuição de roles (`admin` e `master`) não é feita pela interface da aplicação — é realizada diretamente no banco de dados via SQL.

Para instruções detalhadas de como promover um usuário a `admin`, consulte:

- [`docs/admin-setup.md`](./admin-setup.md)

Para atribuir a role `master` a um usuário, execute no SQL Editor do Supabase:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'master'
FROM auth.users
WHERE email = 'email-do-usuario@exemplo.com';
```

O usuário também precisará estar associado a uma organização. Consulte a equipe responsável pelo backend para provisionar uma nova organização e vinculá-la ao usuário Master.

Após a atribuição, o usuário deve fazer logout e login novamente para que o `AuthProvider` detecte as novas permissões.
