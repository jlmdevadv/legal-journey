# Design Spec — Histórico de Eventos de Contratos

**Data:** 2026-03-30
**Status:** Aprovado
**Branch alvo:** `visualizacao-e-download`

---

## Contexto

O sistema atual registra marcos de auditoria como campos soltos em `saved_contracts` (`submitted_for_review_at`, `reviewed_at`, etc.). Esses campos são sobrescritos a cada ciclo de revisão, impossibilitando o rastreamento de múltiplos ciclos. O cabeçalho da página `MasterReview` exibe apenas "Template" e "Enviado em". O card de contratos compartilhados em `MeusContratos` não possui botão de visualização para contratos aprovados nem exibe histórico.

---

## Objetivo

Implementar um histórico de eventos imutável por contrato, exibido em uma timeline visual para Master e preenchedor, e redesenhar o card de contratos compartilhados para suportar o histórico e corrigir ações ausentes (visualização/download para aprovados).

---

## Fora do escopo

- Retroalimentação de contratos existentes (histórico começa do zero na data de deploy)
- Notificações ou alertas baseados em eventos (feature futura, independente desta tabela)
- Painel de auditoria separado para admins

---

## 1. Banco de dados

### Tabela `contract_events`

```sql
CREATE TABLE contract_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid NOT NULL REFERENCES saved_contracts(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   text NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb
);

CREATE INDEX ON contract_events (contract_id, occurred_at);
```

### RLS

- **Leitura:** permitida ao dono do contrato (`saved_contracts.user_id = auth.uid()`) e ao master da organização do contrato.
- **Escrita:** apenas via código autenticado (service role ou funções com `auth.uid()` validado). O usuário não insere eventos diretamente.

### Tipos de evento (`event_type`)

| Valor | Descrição | Ator | `metadata` |
|---|---|---|---|
| `link_created` | Share link gerado pelo Master | Master | — |
| `contract_accessed` | Primeiro acesso do preenchedor ao contrato via link | Preenchedor | — |
| `submitted_for_review` | Preenchedor enviou para revisão (inclui reenvio) | Preenchedor | — |
| `review_approved` | Master aprovou | Master | — |
| `review_rejected` | Master reprovou | Master | `{ notes: "..." }` |
| `document_downloaded` | Download do documento gerado | Master ou Preenchedor | `{ downloaded_by_role: "master" \| "user" }` |

### Pontos de inserção no código

| Evento | Arquivo | Função |
|---|---|---|
| `link_created` | `src/components/master/GenerateLinkModal.tsx` | Após insert em `share_links` |
| `contract_accessed` | `src/pages/SharedTemplate.tsx` (ou container equivalente) | No load inicial do contrato via link; só insere se ainda não existe evento `contract_accessed` para o contrato |
| `submitted_for_review` | `src/contexts/ContractContext.tsx` | `handleSubmitForReview` e `resubmitForReview`, após update de status |
| `review_approved` / `review_rejected` | `src/pages/MasterReview.tsx` | `handleReview`, após update de status |
| `document_downloaded` | `src/components/DocumentDownloader.tsx` | No momento do download |

---

## 2. Componente `ContractTimeline`

**Arquivo:** `src/components/contracts/ContractTimeline.tsx`

Componente de apresentação pura — não faz fetch, recebe eventos via prop.

### Interface

```typescript
interface ContractEvent {
  id: string;
  event_type: string;
  occurred_at: string;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
}

interface ContractTimelineProps {
  events: ContractEvent[];
  loading?: boolean;
  collapsed?: boolean;        // se true, exibe máx. 3 eventos com "ver mais"
  onToggleCollapse?: () => void;
}
```

### Visual

Lista vertical com linha conectora. Cada item:
- Ícone colorido (Lucide) por tipo de evento
- Label em português
- Data/hora formatada em pt-BR (`dd/MM/yyyy HH:mm`)
- Eventos `review_rejected` expandem bloco com `metadata.notes`

### Ícones por tipo

| Evento | Ícone | Cor |
|---|---|---|
| `link_created` | `Link2` | muted-foreground |
| `contract_accessed` | `Eye` | muted-foreground |
| `submitted_for_review` | `Send` | primary |
| `review_approved` | `CheckCircle` | verde (success) |
| `review_rejected` | `XCircle` | destrutivo |
| `document_downloaded` | `Download` | muted-foreground |

### Labels em português

| Evento | Label |
|---|---|
| `link_created` | Link gerado pelo escritório |
| `contract_accessed` | Preenchedor acessou o contrato |
| `submitted_for_review` | Enviado para revisão |
| `review_approved` | Aprovado pelo revisor |
| `review_rejected` | Reprovado pelo revisor |
| `document_downloaded` | Download realizado |

---

## 3. Componente `SharedContractCard`

**Arquivo:** `src/components/contracts/SharedContractCard.tsx`

Substitui o `div` inline do loop de compartilhados em `MeusContratos`. Estrutura visual alinhada ao `ContractCard` existente.

### Interface

```typescript
interface SharedContractCardProps {
  contract: SavedContract;
  events: ContractEvent[];
  eventsLoading: boolean;
  onOpen: () => void;
  onDownload: () => void;
}
```

### Anatomia

```
┌─────────────────────────────────────────────┐
│ Nome do contrato              [STATUS BADGE] │
├─────────────────────────────────────────────┤
│ Template: Nome do Template                   │
│                                              │
│  ContractTimeline (colapsada, máx 3 eventos) │
├─────────────────────────────────────────────┤
│  Ações condicionadas ao status:              │
│  - approved  → [Visualizar e Baixar]         │
│  - draft     → [Continuar Preenchimento]     │
│  - rejected  → [Editar e Reenviar]           │
│               + bloco de feedback do revisor │
└─────────────────────────────────────────────┘
```

### Botão "Visualizar e Baixar" (status `approved`)

Abre o `ContractPreviewModal` existente com o `generated_document`. O download ocorre dentro do modal via `DocumentDownloader` já existente.

---

## 4. Alterações em `MeusContratos`

- Fetch de eventos em batch: um único `select * from contract_events where contract_id in (ids)` após carregar os contratos compartilhados.
- Agrupar eventos por `contract_id` em um `Map<string, ContractEvent[]>` antes de passar para os cards.
- Substituir o `div` inline do loop de compartilhados por `<SharedContractCard>`.

---

## 5. Alterações em `MasterReview`

- Fetch de eventos: `select * from contract_events where contract_id = documentId order by occurred_at asc` junto ao fetch do documento.
- Renderizar `<ContractTimeline>` no Card de cabeçalho, abaixo das informações de Template e data de envio.
- Modo não colapsado (Master precisa do histórico completo visível).

---

## 6. Tipos TypeScript

Adicionar interface `ContractEvent` em `src/types/document.ts` (ou arquivo equivalente de tipos compartilhados). Não depende de atualização do arquivo gerado `src/integrations/supabase/types.ts` — a atualização desse arquivo ocorre via Supabase CLI após a migration, mas a interface pode ser declarada manualmente enquanto isso.

---

## 7. Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `src/components/contracts/ContractTimeline.tsx` | Componente de timeline de eventos |
| `src/components/contracts/SharedContractCard.tsx` | Card redesenhado para contratos compartilhados |

## 8. Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/components/master/GenerateLinkModal.tsx` | Insert de `link_created` |
| `src/pages/SharedTemplate.tsx` | Insert de `contract_accessed` |
| `src/contexts/ContractContext.tsx` | Insert de `submitted_for_review` |
| `src/pages/MasterReview.tsx` | Insert de `review_approved`/`review_rejected` + renderiza `ContractTimeline` |
| `src/components/DocumentDownloader.tsx` | Insert de `document_downloaded` |
| `src/pages/MeusContratos.tsx` | Fetch batch de eventos + usa `SharedContractCard` |
| `src/types/document.ts` | Adiciona interface `ContractEvent` |
