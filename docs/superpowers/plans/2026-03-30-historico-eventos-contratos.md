# Histórico de Eventos de Contratos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar uma tabela `contract_events` no Supabase e uma timeline visual de eventos por contrato, exibida no cabeçalho do `MasterReview` e no redesign do card de contratos compartilhados em `MeusContratos`.

**Architecture:** Nova tabela `contract_events` com FK para `saved_contracts`. Componente `ContractTimeline` de apresentação pura (sem fetch). Componente `SharedContractCard` substitui o `div` inline de compartilhados em `MeusContratos`. Eventos são inseridos nos pontos exatos do código onde cada transição de estado ocorre.

**Tech Stack:** React + TypeScript + Vite + Supabase (PostgreSQL + RLS) + Tailwind + shadcn/ui + Lucide + date-fns

---

## Nota de implementação: evento `link_created`

O link é gerado em `GenerateLinkModal` antes de qualquer contrato existir. O contrato só é criado quando o preenchedor acessa o link pela primeira vez em `SharedQuestionnaireContainer`. Por isso, `link_created` **não** é inserido em `GenerateLinkModal` — é inserido em `SharedQuestionnaireContainer` no momento da criação do contrato, usando `share_links.created_at` e `share_links.created_by_user_id` como `occurred_at` e `user_id`, respectivamente.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/types/document.ts` | Modificar | Adicionar interface `ContractEvent` |
| `src/components/contracts/ContractTimeline.tsx` | Criar | Componente de timeline (apresentação pura) |
| `src/components/contracts/SharedContractCard.tsx` | Criar | Card redesenhado para contratos compartilhados |
| `src/components/shared/SharedQuestionnaireContainer.tsx` | Modificar | Inserir `link_created` + `contract_accessed` |
| `src/contexts/ContractContext.tsx` | Modificar | Inserir `submitted_for_review` em `resubmitForReview` |
| `src/components/shared/SharedQuestionnaireContainer.tsx` | Modificar | Inserir `submitted_for_review` em `handleSubmitForReview` |
| `src/pages/MasterReview.tsx` | Modificar | Inserir `review_approved`/`review_rejected` + renderizar `ContractTimeline` |
| `src/components/DocumentDownloader.tsx` | Modificar | Inserir `document_downloaded` + receber props `contractId` e `actorRole` |
| `src/pages/MeusContratos.tsx` | Modificar | Fetch batch de eventos + usar `SharedContractCard` |

---

## Task 1: Adicionar tipo `ContractEvent` em `src/types/document.ts`

**Files:**
- Modify: `src/types/document.ts`

- [ ] **Step 1: Adicionar a interface ao arquivo**

Abra `src/types/document.ts` e adicione ao final:

```typescript
export interface ContractEvent {
  id: string;
  contract_id: string;
  user_id: string | null;
  event_type:
    | 'link_created'
    | 'contract_accessed'
    | 'submitted_for_review'
    | 'review_approved'
    | 'review_rejected'
    | 'document_downloaded';
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}
```

- [ ] **Step 2: Verificar que o build não quebra**

```bash
cd /c/Users/Nitro/repos/contrato-completo-facil-02 && npm run build 2>&1 | tail -20
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/types/document.ts
git commit -m "Adicionando tipo ContractEvent"
```

---

## Task 2: Criar migration SQL da tabela `contract_events` no Supabase

**Files:**
- Create: `supabase/migrations/20260330000000_contract_events.sql`

> Execute este SQL diretamente no SQL Editor do Supabase Dashboard (projeto de produção/staging). Salve também o arquivo local para controle de versão.

- [ ] **Step 1: Criar o arquivo de migration**

Crie `supabase/migrations/20260330000000_contract_events.sql`:

```sql
-- Tabela de eventos imutáveis por contrato
CREATE TABLE contract_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid NOT NULL REFERENCES saved_contracts(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   text NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb
);

CREATE INDEX ON contract_events (contract_id, occurred_at);

-- RLS
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;

-- Leitura: dono do contrato
CREATE POLICY "contract_events_select_owner"
ON contract_events
FOR SELECT
USING (
  contract_id IN (
    SELECT id FROM saved_contracts WHERE user_id = auth.uid()
  )
);

-- Leitura: master da organização do contrato
CREATE POLICY "contract_events_select_master"
ON contract_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM saved_contracts sc
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE sc.id = contract_events.contract_id
      AND ur.role = 'master'
  )
);

-- Escrita: usuário autenticado dono do contrato
CREATE POLICY "contract_events_insert_owner"
ON contract_events
FOR INSERT
WITH CHECK (
  contract_id IN (
    SELECT id FROM saved_contracts WHERE user_id = auth.uid()
  )
);

-- Escrita: master da organização do contrato
CREATE POLICY "contract_events_insert_master"
ON contract_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM saved_contracts sc
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE sc.id = contract_events.contract_id
      AND ur.role = 'master'
  )
);
```

- [ ] **Step 2: Executar no Supabase Dashboard**

Copie o conteúdo acima, acesse o SQL Editor do projeto Supabase e execute. Verifique que a tabela `contract_events` aparece no Table Editor.

- [ ] **Step 3: Commit do arquivo de migration**

```bash
git add supabase/migrations/20260330000000_contract_events.sql
git commit -m "Adicionando migration da tabela contract_events"
```

---

## Task 3: Criar componente `ContractTimeline`

**Files:**
- Create: `src/components/contracts/ContractTimeline.tsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/contracts/ContractTimeline.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Link2, Eye, Send, CheckCircle, XCircle, Download, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractEvent } from '@/types/document';

const COLLAPSED_COUNT = 3;

const EVENT_CONFIG: Record<
  ContractEvent['event_type'],
  { label: string; Icon: React.ElementType; colorClass: string }
> = {
  link_created: {
    label: 'Link gerado pelo escritório',
    Icon: Link2,
    colorClass: 'text-muted-foreground',
  },
  contract_accessed: {
    label: 'Preenchedor acessou o contrato',
    Icon: Eye,
    colorClass: 'text-muted-foreground',
  },
  submitted_for_review: {
    label: 'Enviado para revisão',
    Icon: Send,
    colorClass: 'text-primary',
  },
  review_approved: {
    label: 'Aprovado pelo revisor',
    Icon: CheckCircle,
    colorClass: 'text-green-600',
  },
  review_rejected: {
    label: 'Reprovado pelo revisor',
    Icon: XCircle,
    colorClass: 'text-destructive',
  },
  document_downloaded: {
    label: 'Download realizado',
    Icon: Download,
    colorClass: 'text-muted-foreground',
  },
};

interface ContractTimelineProps {
  events: ContractEvent[];
  loading?: boolean;
  collapsible?: boolean; // se true, exibe máx COLLAPSED_COUNT eventos com "ver mais"
}

const ContractTimeline = ({ events, loading = false, collapsible = false }: ContractTimelineProps) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando histórico...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">Nenhum evento registrado.</p>
    );
  }

  const visible = collapsible && !expanded ? events.slice(0, COLLAPSED_COUNT) : events;
  const hasMore = collapsible && events.length > COLLAPSED_COUNT;

  return (
    <div className="space-y-0">
      {visible.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type];
        if (!config) return null;
        const { label, Icon, colorClass } = config;
        const isLast = index === visible.length - 1;
        const rejectionNotes =
          event.event_type === 'review_rejected' &&
          event.metadata &&
          typeof event.metadata['notes'] === 'string'
            ? (event.metadata['notes'] as string)
            : null;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Linha conectora */}
            <div className="flex flex-col items-center">
              <div className={`mt-0.5 rounded-full p-0.5 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1" />}
            </div>

            {/* Conteúdo */}
            <div className={`pb-3 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.occurred_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
              {rejectionNotes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  "{rejectionNotes}"
                </p>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground underline hover:text-foreground mt-1 ml-6"
        >
          {expanded ? 'ver menos' : `ver mais ${events.length - COLLAPSED_COUNT} evento(s)`}
        </button>
      )}
    </div>
  );
};

export default ContractTimeline;
```

- [ ] **Step 2: Verificar que o build não quebra**

```bash
cd /c/Users/Nitro/repos/contrato-completo-facil-02 && npm run build 2>&1 | tail -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/contracts/ContractTimeline.tsx
git commit -m "Adicionando componente ContractTimeline"
```

---

## Task 4: Inserir eventos `link_created` e `contract_accessed` em `SharedQuestionnaireContainer`

**Files:**
- Modify: `src/components/shared/SharedQuestionnaireContainer.tsx`

**Contexto:** O evento `link_created` é inserido quando o contrato é criado pela primeira vez (o usuário acessa o link pela primeira vez). Nesse momento, buscamos `created_at` e `created_by_user_id` da tabela `share_links` para usar como `occurred_at` e `user_id` do evento, preservando a data real de criação do link. O evento `contract_accessed` é inserido logo após, com `occurred_at = now()`.

- [ ] **Step 1: Criar função auxiliar `insertInitialEvents` dentro do componente**

Em `SharedQuestionnaireContainer.tsx`, logo após a declaração dos estados (por volta da linha 50), adicione a função auxiliar:

```typescript
const insertInitialEvents = async (contractId: string) => {
  // Busca dados do share link para usar no evento link_created
  const { data: linkData } = await supabase
    .from('share_links')
    .select('created_at, created_by_user_id')
    .eq('id', shareLinkId)
    .single();

  const eventsToInsert = [
    {
      contract_id: contractId,
      user_id: linkData?.created_by_user_id ?? null,
      event_type: 'link_created',
      occurred_at: linkData?.created_at ?? new Date().toISOString(),
    },
    {
      contract_id: contractId,
      user_id: user!.id,
      event_type: 'contract_accessed',
    },
  ];

  await supabase.from('contract_events').insert(eventsToInsert);
};
```

- [ ] **Step 2: Chamar `insertInitialEvents` quando um novo contrato é criado**

Ainda em `SharedQuestionnaireContainer.tsx`, dentro de `loadTemplateAndDocument`, no bloco `else` onde um novo contrato é criado (após `setSavedContractId(newDoc.id)`, linha ~141), adicione:

```typescript
// Após: setSavedContractId(newDoc.id);
await insertInitialEvents(newDoc.id);
```

O bloco completo deve ficar:

```typescript
} else {
  const { data: newDoc, error: insertError } = await supabase
    .from('saved_contracts')
    .insert({
      user_id: user.id,
      template_id: templateId,
      name: `${templateName} - ${new Date().toLocaleDateString('pt-BR')}`,
      organization_id: organizationId,
      share_link_id: shareLinkId,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  setSavedContractId(newDoc.id);
  await insertInitialEvents(newDoc.id);
}
```

- [ ] **Step 3: Verificar no browser**

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse um link compartilhado pela primeira vez (com um usuário novo ou link novo). Verifique no Supabase Dashboard > Table Editor > `contract_events` que dois registros foram criados: `link_created` e `contract_accessed`.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/SharedQuestionnaireContainer.tsx
git commit -m "Inserindo eventos link_created e contract_accessed no primeiro acesso ao link"
```

---

## Task 5: Inserir evento `submitted_for_review`

**Files:**
- Modify: `src/components/shared/SharedQuestionnaireContainer.tsx`
- Modify: `src/contexts/ContractContext.tsx`

### 5a — Primeiro envio (`handleSubmitForReview` em `SharedQuestionnaireContainer`)

- [ ] **Step 1: Adicionar insert após o update de status**

Em `SharedQuestionnaireContainer.tsx`, dentro de `handleSubmitForReview` (linha ~150), após o bloco `const { error } = await supabase.from('saved_contracts').update(...)` e antes do `if (error) throw error;`, NÃO altere o fluxo de erro. Adicione o insert após o throw:

```typescript
// Trecho atual:
const { error } = await supabase
  .from('saved_contracts')
  .update({ status: 'pending_review', submitted_for_review_at: ... })
  .eq('id', savedContractId);

if (error) throw error;

// ADICIONAR logo após o if(error):
await supabase.from('contract_events').insert({
  contract_id: savedContractId,
  user_id: user.id,
  event_type: 'submitted_for_review',
});
```

### 5b — Reenvio (`resubmitForReview` em `ContractContext.tsx`)

- [ ] **Step 2: Adicionar insert após o update de status em `resubmitForReview`**

Em `ContractContext.tsx`, dentro de `resubmitForReview` (linha ~1278), após `if (error) throw error;` e antes de `setCurrentContractStatus('pending_review')`:

```typescript
// Após: if (error) throw error;
// ADICIONAR:
await supabase.from('contract_events').insert({
  contract_id: currentSavedContractId,
  user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
  event_type: 'submitted_for_review',
});
```

- [ ] **Step 3: Verificar no browser**

Com o servidor rodando, preencha um contrato via link compartilhado e clique em "Enviar para Revisão". Verifique no Supabase Dashboard que um evento `submitted_for_review` foi criado para o contrato.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/SharedQuestionnaireContainer.tsx src/contexts/ContractContext.tsx
git commit -m "Inserindo evento submitted_for_review no envio e reenvio para revisão"
```

---

## Task 6: Inserir eventos `review_approved` e `review_rejected` em `MasterReview`

**Files:**
- Modify: `src/pages/MasterReview.tsx`

- [ ] **Step 1: Adicionar insert em `handleReview`**

Em `MasterReview.tsx`, dentro de `handleReview` (linha ~59), após `if (error) throw error;` e antes de `toast.success(...)`:

```typescript
// Após: if (error) throw error;
// ADICIONAR:
await supabase.from('contract_events').insert({
  contract_id: documentId,
  user_id: user.id,
  event_type: status === 'approved' ? 'review_approved' : 'review_rejected',
  metadata: status === 'rejected' && reviewNotes
    ? { notes: reviewNotes }
    : null,
});
```

- [ ] **Step 2: Verificar no browser**

Com o servidor rodando, acesse a página de revisão de um contrato com status `pending_review` e clique em "Aprovar" ou "Reprovar". Verifique no Supabase Dashboard que o evento correspondente foi criado.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MasterReview.tsx
git commit -m "Inserindo eventos review_approved e review_rejected na revisão do master"
```

---

## Task 7: Inserir evento `document_downloaded` em `DocumentDownloader`

**Files:**
- Modify: `src/components/DocumentDownloader.tsx`

- [ ] **Step 1: Adicionar props `contractId` e `actorRole` (ambas opcionais)**

Em `DocumentDownloader.tsx`, adicione ao `interface DocumentDownloaderProps`:

```typescript
contractId?: string | null;
actorRole?: 'master' | 'user';
```

E ao destructuring do componente:

```typescript
const DocumentDownloader = ({
  documentData,
  filename,
  elementId = 'contract-preview',
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  contractId,
  actorRole,
}: DocumentDownloaderProps) => {
```

- [ ] **Step 2: Adicionar import do supabase e insert após download bem-sucedido**

No topo do arquivo, adicione:

```typescript
import { supabase } from '@/integrations/supabase/client';
```

Dentro de `handleDownload`, após `toast({ title: 'Download concluído', ... })`:

```typescript
// Após o toast de sucesso:
if (contractId) {
  supabase.from('contract_events').insert({
    contract_id: contractId,
    user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    event_type: 'document_downloaded',
    metadata: actorRole ? { downloaded_by_role: actorRole } : null,
  });
  // fire-and-forget: não await, não bloqueia o download
}
```

- [ ] **Step 3: Verificar que build continua passando**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros. As props são opcionais, então todos os usos existentes de `DocumentDownloader` continuam funcionando sem alteração.

- [ ] **Step 4: Commit**

```bash
git add src/components/DocumentDownloader.tsx
git commit -m "Inserindo evento document_downloaded no download de documentos"
```

---

## Task 8: Criar componente `SharedContractCard`

**Files:**
- Create: `src/components/contracts/SharedContractCard.tsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/contracts/SharedContractCard.tsx`:

```typescript
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ContractTimeline from './ContractTimeline';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import { ContractEvent } from '@/types/document';

interface SavedContract {
  id: string;
  name: string;
  status: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  generated_document?: string | null;
  contract_templates?: { name: string } | null;
  share_links?: { token: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'approved' | 'rejected' | 'pending' | 'draft' }> = {
  approved:       { label: 'Aprovado',              variant: 'approved' },
  rejected:       { label: 'Reprovado',             variant: 'rejected' },
  pending_review: { label: 'Pendente de Revisão',   variant: 'pending'  },
  draft:          { label: 'Rascunho',              variant: 'draft'    },
  completed:      { label: 'Finalizado',            variant: 'approved' },
};

interface SharedContractCardProps {
  contract: SavedContract;
  events: ContractEvent[];
  eventsLoading: boolean;
  onOpen: () => void;
  onNavigateToSharedLink: () => void;
  onDownload: (contractId: string) => void;
}

const SharedContractCard = ({
  contract,
  events,
  eventsLoading,
  onOpen,
  onNavigateToSharedLink,
  onDownload,
}: SharedContractCardProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[contract.status] ?? { label: contract.status, variant: 'draft' as const };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-sans text-sm font-medium text-foreground truncate">
              {contract.name}
            </h3>
            <Badge variant={statusConfig.variant} className="shrink-0">
              {statusConfig.label}
            </Badge>
          </div>
          {contract.contract_templates?.name && (
            <p className="text-xs text-muted-foreground">
              Template: {contract.contract_templates.name}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3 pt-0">
          {/* Timeline */}
          <div className="border-t border-border pt-3">
            <ContractTimeline
              events={events}
              loading={eventsLoading}
              collapsible
            />
          </div>

          {/* Ações por status */}
          <div className="border-t border-border pt-3 space-y-2">
            {contract.status === 'approved' && contract.generated_document && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setPreviewOpen(true)}
              >
                Visualizar e Baixar
              </Button>
            )}

            {contract.status === 'draft' && (
              <Button size="sm" className="w-full" onClick={onOpen}>
                Continuar Preenchimento
              </Button>
            )}

            {contract.status === 'pending_review' && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Aguardando revisão do escritório.
              </p>
            )}

            {contract.status === 'rejected' && (
              <>
                {contract.review_notes && (
                  <div className="rounded border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                    <p className="text-xs font-medium text-destructive">Feedback do Revisor</p>
                    <p
                      className={`text-xs text-foreground whitespace-pre-wrap ${
                        feedbackExpanded ? '' : 'line-clamp-3'
                      }`}
                    >
                      {contract.review_notes}
                    </p>
                    {contract.review_notes.length > 120 && (
                      <button
                        onClick={() => setFeedbackExpanded(!feedbackExpanded)}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        {feedbackExpanded ? 'ver menos' : 'ver mais'}
                      </button>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={contract.share_links?.token ? onNavigateToSharedLink : onOpen}
                >
                  Editar e Reenviar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {contract.generated_document && (
        <ContractPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          content={contract.generated_document}
          contractName={contract.name}
          contractId={contract.id}
          actorRole="user"
        />
      )}
    </>
  );
};

export default SharedContractCard;
```

- [ ] **Step 2: Verificar se `ContractPreviewModal` aceita as props `contractId` e `actorRole`**

Abra `src/components/ContractPreviewModal.tsx` e verifique a interface de props. Se não existirem `contractId` e `actorRole`, você precisa adicioná-las para passar ao `DocumentDownloader` interno (Task 9 cobre isso).

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

Pode haver erros de tipo sobre `ContractPreviewModal` — serão resolvidos na Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/components/contracts/SharedContractCard.tsx
git commit -m "Adicionando componente SharedContractCard"
```

---

## Task 9: Adicionar `contractId` e `actorRole` ao `ContractPreviewModal`

**Files:**
- Modify: `src/components/ContractPreviewModal.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Abra `src/components/ContractPreviewModal.tsx` e identifique a interface de props e onde `DocumentDownloader` é usado internamente.

- [ ] **Step 2: Adicionar props opcionais e repassar ao `DocumentDownloader`**

Na interface de props do modal, adicione:

```typescript
contractId?: string | null;
actorRole?: 'master' | 'user';
```

No JSX onde `DocumentDownloader` é renderizado, adicione as props:

```typescript
<DocumentDownloader
  // ...props existentes...
  contractId={contractId}
  actorRole={actorRole}
/>
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContractPreviewModal.tsx
git commit -m "Repassando contractId e actorRole ao DocumentDownloader via ContractPreviewModal"
```

---

## Task 10: Atualizar `MeusContratos` para usar `SharedContractCard` com fetch batch de eventos

**Files:**
- Modify: `src/pages/MeusContratos.tsx`

- [ ] **Step 1: Adicionar import e tipo de eventos**

No topo de `MeusContratos.tsx`, adicione:

```typescript
import SharedContractCard from '@/components/contracts/SharedContractCard';
import { ContractEvent } from '@/types/document';
```

- [ ] **Step 2: Adicionar estado para eventos**

Junto aos outros estados do componente, adicione:

```typescript
const [sharedContractEvents, setSharedContractEvents] = useState<Map<string, ContractEvent[]>>(new Map());
const [eventsLoading, setEventsLoading] = useState(false);
```

- [ ] **Step 3: Adicionar fetch batch de eventos após `loadContracts`**

Crie a função `loadEventsForSharedContracts`:

```typescript
const loadEventsForSharedContracts = async (sharedIds: string[]) => {
  if (sharedIds.length === 0) return;
  setEventsLoading(true);
  const { data } = await supabase
    .from('contract_events')
    .select('*')
    .in('contract_id', sharedIds)
    .order('occurred_at', { ascending: true });

  if (data) {
    const map = new Map<string, ContractEvent[]>();
    for (const event of data as ContractEvent[]) {
      const existing = map.get(event.contract_id) ?? [];
      map.set(event.contract_id, [...existing, event]);
    }
    setSharedContractEvents(map);
  }
  setEventsLoading(false);
};
```

- [ ] **Step 4: Chamar `loadEventsForSharedContracts` após `loadContracts`**

Modifique `loadContracts` para chamar o fetch de eventos com os IDs dos compartilhados:

```typescript
const loadContracts = async () => {
  setIsLoading(true);
  const data = await listUserContracts();
  setContracts(data);
  setIsLoading(false);

  const shared = data.filter((c: SavedContract) => !!c.organization_id);
  const sharedIds = shared.map((c: SavedContract) => c.id);
  await loadEventsForSharedContracts(sharedIds);
};
```

- [ ] **Step 5: Substituir o `div` inline por `SharedContractCard` no loop de compartilhados**

Substitua o bloco de renderização de `sharedContracts.map(...)` (que começa em torno da linha 152 com `<div key={contract.id} className="rounded border...">`) por:

```tsx
{sharedContracts.map((contract) => (
  <SharedContractCard
    key={contract.id}
    contract={contract as any}
    events={sharedContractEvents.get(contract.id) ?? []}
    eventsLoading={eventsLoading}
    onOpen={() => handleOpenContract(contract.id)}
    onNavigateToSharedLink={() =>
      navigate(`/s/${contract.share_links!.token}`)
    }
    onDownload={(contractId) => {
      // O download acontece dentro do ContractPreviewModal via DocumentDownloader
      // Este callback existe apenas para extensibilidade futura
    }}
  />
))}
```

- [ ] **Step 6: Remover os estados locais que eram usados pelo `div` inline**

Remova o estado `expandedFeedback` e a função `toggleFeedback` — a lógica foi movida para `SharedContractCard`.

- [ ] **Step 7: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros.

- [ ] **Step 8: Verificar no browser**

Com o servidor rodando, acesse `/meus-contratos`. Verifique que:
- Os cards de documentos compartilhados exibem a timeline de eventos
- O botão "Visualizar e Baixar" aparece para contratos com `status === 'approved'`
- O botão "Editar e Reenviar" continua funcionando para `status === 'rejected'`
- O botão "Continuar Preenchimento" aparece para `status === 'draft'`

- [ ] **Step 9: Commit**

```bash
git add src/pages/MeusContratos.tsx
git commit -m "Redesenhando card de contratos compartilhados com SharedContractCard e timeline de eventos"
```

---

## Task 11: Exibir `ContractTimeline` no cabeçalho de `MasterReview`

**Files:**
- Modify: `src/pages/MasterReview.tsx`

- [ ] **Step 1: Adicionar estado para eventos e fetch**

Em `MasterReview.tsx`, adicione estado e import:

```typescript
import ContractTimeline from '@/components/contracts/ContractTimeline';
import { ContractEvent } from '@/types/document';

// junto aos outros estados:
const [events, setEvents] = useState<ContractEvent[]>([]);
const [eventsLoading, setEventsLoading] = useState(false);
```

- [ ] **Step 2: Buscar eventos junto ao fetch do documento**

Dentro de `fetchDocument`, após `setDocument(doc)`, adicione:

```typescript
// Fetch de eventos do contrato
setEventsLoading(true);
const { data: eventsData } = await supabase
  .from('contract_events')
  .select('*')
  .eq('contract_id', documentId)
  .order('occurred_at', { ascending: true });

setEvents((eventsData as ContractEvent[]) ?? []);
setEventsLoading(false);
```

- [ ] **Step 3: Renderizar `ContractTimeline` no Card de informações**

No JSX de `MasterReview`, dentro do `<CardContent>` do card "Document Info" (logo após o bloco que exibe template e data de envio, linha ~151), adicione:

```tsx
{/* Timeline de eventos */}
<div className="border-t border-border pt-3 mt-1">
  <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
  <ContractTimeline
    events={events}
    loading={eventsLoading}
    collapsible={false}
  />
</div>
```

- [ ] **Step 4: Verificar no browser**

Com o servidor rodando, acesse a página de revisão de um contrato. Verifique que a timeline de eventos aparece no cabeçalho do card, abaixo de "Template" e "Enviado em".

- [ ] **Step 5: Commit**

```bash
git add src/pages/MasterReview.tsx
git commit -m "Exibindo ContractTimeline no cabeçalho do MasterReview"
```

---

## Task 12: Propagar `contractId` e `actorRole` para o `DocumentDownloader` no `MasterReview`

**Files:**
- Modify: `src/pages/MasterReview.tsx`

- [ ] **Step 1: Adicionar props ao `DocumentDownloader` existente em `MasterReview`**

Em `MasterReview.tsx`, localize o `<DocumentDownloader>` que já existe no card "Prévia do Documento" (linha ~159) e adicione as props:

```tsx
<DocumentDownloader
  documentData={{ ... }} // existente
  filename={document.name}
  variant="outline"
  size="sm"
  contractId={documentId}
  actorRole="master"
/>
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/MasterReview.tsx
git commit -m "Rastreando download do master com contractId e actorRole"
```

---

## Verificação final

- [ ] Rodar `npm run build` sem erros
- [ ] No Supabase Dashboard, confirmar que a tabela `contract_events` existe com os índices e políticas RLS
- [ ] Testar o fluxo completo em desenvolvimento:
  1. Master gera um link (verificar que NÃO cria evento — evento será criado no primeiro acesso)
  2. Preenchedor acessa o link pela primeira vez → eventos `link_created` + `contract_accessed` aparecem
  3. Preenchedor envia para revisão → evento `submitted_for_review`
  4. Master reprova com nota → evento `review_rejected` com metadata `notes`
  5. Preenchedor reenvia → evento `submitted_for_review`
  6. Master aprova → evento `review_approved`
  7. Preenchedor baixa o documento → evento `document_downloaded`
  8. Todos os eventos aparecem na timeline em `MeusContratos` e em `MasterReview`
  9. Card de compartilhados em `MeusContratos` mostra botão "Visualizar e Baixar" para aprovados
