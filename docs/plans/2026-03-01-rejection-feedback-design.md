# Design: Feedback de Reprovação para o Usuário Preenchedor

**Data:** 2026-03-01
**Status:** Aprovado

## Contexto

O usuário mestre pode aprovar ou reprovar contratos enviados para revisão. Ao reprovar, pode incluir `review_notes` com observações. Atualmente essas notas ficam invisíveis para o preenchedor — ele só vê o badge `Rejected` no dashboard. O objetivo é expor esse feedback de forma útil e manter o preenchedor capaz de re-editar e reenviar sem perder o acesso às observações.

## Fluxo de Status

```
rejected  →  [filler edita]  →  pending_review
```

- O status permanece `rejected` durante toda a edição
- Muda para `pending_review` apenas no reenvio explícito
- Nenhuma nova coluna de DB necessária — `review_notes` já existe em `saved_contracts`
- `review_notes` não são apagadas no reenvio; o master as sobrescreve na próxima revisão

## Componentes Afetados

### 1. `MeusContratos.tsx` — Card de Contrato Reprovado

**Query:** incluir `review_notes` na seleção de `sharedContracts`.

**Card no estado `rejected`:**
- Badge `Reprovado` (variante `rejected` já existente)
- Bloco "Feedback do Revisor" com texto de `review_notes`
  - Se > 3 linhas: truncado com botão "ver mais" (expansão inline)
- Botão primário "Editar e Reenviar" que:
  1. Chama `loadContract(contractId)` via `ContractContext`
  2. Navega para o questionário

```
┌────────────────────────────────────────┐
│ Contrato de Prestação de Serviços      │
│                              [Reprovado]│
│ Template: Contrato Padrão              │
│                                        │
│ ┌─ Feedback do Revisor ──────────────┐ │
│ │ "Favor revisar a cláusula 3 sobre  │ │
│ │  prazo de pagamento. O valor men-  │ │
│ │  cionado está incorreto..."  [ver +]│ │
│ └────────────────────────────────────┘ │
│                                        │
│         [Editar e Reenviar]            │
└────────────────────────────────────────┘
```

### 2. `ReviewFeedbackPanel` — Novo componente

Painel flutuante exibido no questionário quando `status === 'rejected'` e `review_notes` não está vazio.

**Comportamento:**
- Abre expandido automaticamente na primeira vez (por `contractId` via `sessionStorage`)
- Minimizável para chip flutuante no canto inferior direito
- Estado min/expandido persiste entre navegações via `sessionStorage`
- Não bloqueia interações (z-index sobreposto, não altera layout)

**Estados visuais:**

```
EXPANDIDO                                MINIMIZADO
┌──────────────────────────────┐         ╭──────────────────────╮
│ 💬 Feedback do Revisor   [−] │         │ 💬 Feedback do Revisor│
│ ──────────────────────────── │         ╰──────────────────────╯
│ "Favor revisar a cláusula 3  │         (chip clicável, inf. dir.)
│  sobre prazo de pagamento..." │
│                               │
│ Revisado em 28/02/2026        │
└──────────────────────────────┘
(fixo, canto inferior direito)
```

**Props:**
```ts
interface ReviewFeedbackPanelProps {
  reviewNotes: string;
  reviewedAt?: string;
  contractId: string;
}
```

**Renderização:** No container do questionário (`Index.tsx` e/ou `SharedQuestionnaireContainer.tsx`), condicionado por `status === 'rejected' && review_notes`.

### 3. Botão de Reenvio no Sumário

No `QuestionnaireSummary` (ou onde o submit é acionado):
- Status `draft` → texto "Enviar para Revisão" (sem mudança)
- Status `rejected` → texto "Reenviar para Revisão"
- Mecanismo idêntico: atualiza `status = 'pending_review'` e `submitted_for_review_at = now()`

### 4. `ContractContext` — `loadContract`

Garantir que `review_notes`, `status` e `reviewed_at` sejam incluídos nos dados carregados pelo `loadContract`, tornando-os acessíveis ao `ReviewFeedbackPanel`.

## O que NÃO está no escopo

- Notificações por e-mail (futuro)
- Histórico de reprovações anteriores
- Permissão do master para bloquear reenvio
