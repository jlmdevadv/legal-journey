

## Fase 1.5 - Compartilhamento e Revisao

Esta e uma fase grande. Sera dividida em 3 sub-fases para implementacao incremental e segura.

---

### Sub-fase 1.5.1 - Database e Infraestrutura

**Migrations SQL:**

1. Criar tabela `share_links` com colunas: `id`, `template_id` (TEXT, FK para contract_templates), `organization_id` (UUID, FK para organizations), `created_by_user_id`, `token` (unico, gerado automaticamente), `expires_at` (default 10 dias), `is_revoked`, `revoked_at`, `created_at`
2. RLS: Masters podem SELECT/INSERT/UPDATE links da sua organizacao. Adicionalmente, uma policy SELECT para usuarios autenticados que permite leitura via token (necessario para validacao)
3. Criar funcao `validate_share_link(link_token TEXT)` como SECURITY DEFINER que retorna validade, template_id, organization_id, nomes e mensagem de erro
4. Expandir `saved_contracts`:
   - Adicionar colunas: `organization_id`, `share_link_id`, `reviewed_by_user_id`, `reviewed_at`, `review_notes`, `submitted_for_review_at`
   - Nota: a coluna `status` ja existe com default 'draft'. Os novos valores `pending_review`, `approved`, `rejected` serao tratados no codigo sem CHECK constraint (para nao conflitar com valores existentes `completed`/`archived`)
5. Atualizar RLS de `saved_contracts`: mestre pode SELECT documentos da sua organizacao; mestre pode UPDATE status de documentos da sua organizacao
6. Indices para performance

**Atencao tecnica:** `contract_templates.id` e do tipo TEXT (nao UUID). A FK de `share_links.template_id` sera TEXT para corresponder.

---

### Sub-fase 1.5.2 - Fluxo do Mestre (Gerar Link + Revisao)

**Arquivos novos:**

1. `src/components/master/GenerateLinkModal.tsx` - Modal para gerar link com botao copiar. Insere em `share_links` e monta URL `/s/{token}`
2. `src/pages/MasterReview.tsx` - Tela de revisao: carrega documento + template, mostra preview do contrato, campo de observacoes, botoes Aprovar/Reprovar

**Arquivos modificados:**

3. `src/pages/MasterDashboard.tsx`:
   - Ativar botao "Gerar Link" (remover `disabled`)
   - Adicionar secao "Documentos Pendentes" com filtros (todos/pendentes/aprovados/rejeitados)
   - Buscar documentos via `saved_contracts` filtrado por `organization_id`
   - Contadores reais nos cards de estatisticas
4. `src/App.tsx` - Adicionar rota `/master/review/:documentId` protegida por MasterProtectedRoute

---

### Sub-fase 1.5.3 - Fluxo do Preenchedor (Link Compartilhado)

**Arquivos novos:**

1. `src/pages/SharedTemplate.tsx` - Pagina `/s/:token` que valida link via RPC, redireciona para auth se necessario, e carrega o questionario no contexto compartilhado
2. `src/components/shared/SharedQuestionnaireContainer.tsx` - Container que encapsula o fluxo do questionario com banner da organizacao, cria/carrega documento em `saved_contracts` com `organization_id` e `share_link_id`, e substitui botoes de download por "Enviar para Revisao"

**Arquivos modificados:**

3. `src/pages/Auth.tsx` - Adicionar suporte a `redirect=shared` usando `sessionStorage.pendingShareToken`, redirecionando para `/s/{token}` apos login
4. `src/components/questionnaire/QuestionnaireSummary.tsx` - Aceitar props opcionais `isSharedContext` e `onSubmitForReview` para condicionar botoes (enviar para revisao vs download)
5. `src/components/QuestionnaireForm.tsx` - Aceitar e propagar `isSharedContext` e `onSubmitForReview` para o QuestionnaireSummary
6. `src/pages/MeusContratos.tsx` - Separar documentos B2C (sem organization_id) e B2B2C (com organization_id), mostrando status de revisao e acoes condicionais
7. `src/App.tsx` - Adicionar rota `/s/:token`

---

### O que NAO sera implementado nesta fase

- Sistema de notificacoes por email (placeholder para fase futura)
- Revogacao de links na UI (estrutura no banco pronta)
- Historico de versoes do documento
- Multiplos mestres por organizacao
- Timeout automatico de revisao
- Cron job para lembretes

---

### Secao Tecnica

**Fluxo de dados do link compartilhado:**

```text
/s/:token
  -> validate_share_link(token) [RPC SECURITY DEFINER]
  -> Se invalido: tela de erro
  -> Se valido + nao logado: /auth?redirect=shared (token em sessionStorage)
  -> Se valido + logado: SharedQuestionnaireContainer
    -> Busca/cria saved_contract com organization_id + share_link_id
    -> Renderiza questionario existente com flag isSharedContext
    -> No sumario: "Enviar para Revisao" ao inves de download
    -> UPDATE saved_contracts SET status='pending_review'
```

**Compatibilidade com fluxo B2C existente:**
- QuestionnaireForm continua funcionando normalmente quando `isSharedContext` e `false`/`undefined`
- MeusContratos separa visualmente documentos proprios vs compartilhados
- Nenhuma alteracao no ContractContext principal

**RLS critica:**
- Masters veem documentos onde `organization_id` pertence a sua organizacao
- Preenchedores veem seus proprios documentos (policy existente `user_id = auth.uid()`)
- A policy de UPDATE de saved_contracts sera expandida para permitir que masters alterem status

