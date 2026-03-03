# Fluxo de Revisão de Contratos

## 1. Visão Geral

O fluxo de revisão é utilizado no contexto B2B2C (Shared/Organizacional), em que um usuário preenche um contrato vinculado a uma organização e o submete para análise de um Master (revisor designado pela organização). O Master pode aprovar o documento ou reprová-lo com uma mensagem de feedback. Caso seja reprovado, o usuário vê o motivo da reprovação, edita o contrato e o reenvia para uma nova análise.

Contratos pessoais (B2C) não passam por esse ciclo — apenas contratos com `organization_id` preenchido são submetidos à revisão.

---

## 2. Diagrama do Fluxo

```
Usuário acessa link compartilhado (SharedQuestionnaireContainer)
        │
        ▼
Preenche o formulário (QuestionnaireForm / QuestionnaireSummary)
        │
        ▼
Clica em "Enviar para Revisão"
  (status: draft → pending_review)
        │
        ▼
Master acessa o Painel Master (/master)
        │
        ▼
Master clica no documento → Página MasterReview (/master/review/:documentId)
        │
        ├──────────────────────────────────────────────┐
        ▼                                              ▼
  Clica em "Aprovar"                         Clica em "Reprovar"
  (status: pending_review → approved)        (status: pending_review → rejected)
        │                                              │
        ▼                                              ▼
   Fluxo encerrado                  Usuário abre o contrato reprovado
                                    (MeusContratos ou link compartilhado)
                                            │
                                            ▼
                              Contrato abre direto na tela de resumo
                              (currentQuestionIndex = 9999)
                                            │
                                            ▼
                              ReviewFeedbackPanel exibe o feedback do revisor
                              (painel flutuante no canto inferior direito)
                                            │
                                            ▼
                              Usuário edita os campos necessários
                                            │
                                            ▼
                              Clica em "Reenviar para Revisão"
                              (status: rejected → pending_review)
                                            │
                                            ▼
                              Retorna ao início do ciclo de revisão
```

---

## 3. Componentes Envolvidos

### `ReviewFeedbackPanel`

- **Arquivo:** `src/components/shared/ReviewFeedbackPanel.tsx`
- **O que faz:** Painel flutuante exibido no canto inferior direito da tela quando o contrato do usuário está com status `rejected` e existe uma mensagem de feedback do revisor (`review_notes`). Exibe o texto do feedback, a data/hora da revisão (formatada em pt-BR) e pode ser minimizado ou expandido pelo usuário. O estado de expansão é persistido por sessão via `sessionStorage`, usando a chave `feedback-panel-{contractId}`.
- **Quando aparece:** O painel só é renderizado quando `reviewNotes` é não-vazio. Ele é incluído tanto na página principal (`Index.tsx`) quanto no container de questionário compartilhado (`SharedQuestionnaireContainer.tsx`), sendo condicionado ao status `rejected` do contrato carregado.

---

### `MasterReview` (página)

- **Arquivo:** `src/pages/MasterReview.tsx`
- **Rota:** `/master/review/:documentId`
- **O que o Master vê:**
  - Nome e status atual do documento (badge colorido).
  - Template utilizado e data de envio para revisão.
  - Prévia do documento gerado (campo `generated_document` renderizado como HTML).
  - Um card de aviso se o documento ainda está em `draft` (sem botões de ação).
- **Formulário de revisão:** Visível apenas quando o status é `pending_review`. Contém:
  - Campo de texto livre para "Observações" (`review_notes`), opcional.
  - Botão **"Aprovar"** — chama `handleReview('approved')`.
  - Botão **"Reprovar"** (destrutivo) — chama `handleReview('rejected')`.
- **Ação ao aprovar/reprovar:** Atualiza os campos `status`, `reviewed_by_user_id`, `reviewed_at` e `review_notes` na tabela `saved_contracts` via Supabase e redireciona para `/master`.

---

### `QuestionnaireSummary`

- **Arquivo:** `src/components/questionnaire/QuestionnaireSummary.tsx`
- **Função no fluxo de revisão:** Exibe o botão de envio/reenvio para revisão quando o componente está em contexto compartilhado (`isSharedContext === true`) e recebe a prop `onSubmitForReview`.
- **Texto do botão:** Muda dinamicamente conforme o status atual:
  - Se `currentContractStatus === 'rejected'`: exibe **"Reenviar para Revisão"**.
  - Caso contrário: exibe **"Enviar para Revisão"**.
- **Validação:** O botão é desabilitado se o formulário não passou na validação de campos obrigatórios (`validationResult.isValid === false`) ou se o envio está em andamento (`isSubmitting`).

---

### `MeusContratos` (página)

- **Arquivo:** `src/pages/MeusContratos.tsx`
- **Rota:** `/meus-contratos`
- **Como contratos reprovados aparecem:** Na seção "Documentos Compartilhados", o card de um contrato com status `rejected` exibe:
  - Badge com label **"Reprovado"** e variante visual `rejected`.
  - Bloco de feedback: se `review_notes` estiver preenchido, exibe o texto do revisor em uma caixa com borda destrutiva. Textos longos (acima de 120 caracteres) são truncados com botão "ver mais / ver menos".
  - Botão **"Editar e Reenviar"** (variante destrutiva, largura total) que chama `handleOpenContract`, carregando o contrato no contexto e navegando para `/`.

---

## 4. Estado no ContractContext

Todos os campos abaixo fazem parte da interface `ContractContextType` definida em `src/contexts/ContractContext.tsx` e são armazenados como estado React no provider `ContractProvider`.

| Campo                          | Tipo TypeScript   | Descrição                                                                                 |
|-------------------------------|-------------------|-------------------------------------------------------------------------------------------|
| `currentContractStatus`       | `string \| null`  | Status atual do contrato carregado: `'draft'`, `'completed'`, `'pending_review'`, `'approved'`, `'rejected'` ou `null`. |
| `currentContractReviewNotes`  | `string \| null`  | Texto de feedback inserido pelo Master ao reprovar. Lido do campo `review_notes` do banco. |
| `currentContractReviewedAt`   | `string \| null`  | Timestamp ISO 8601 do momento em que o Master concluiu a revisão. Lido de `reviewed_at`.  |
| `currentContractOrganizationId` | `string \| null` | ID da organização à qual o contrato está vinculado. Determina se é um contrato B2B2C.    |
| `currentSavedContractId`      | `string \| null`  | UUID do registro na tabela `saved_contracts`. Usado como identificador nas operações de persistência e como chave do `sessionStorage` no `ReviewFeedbackPanel`. |

Esses campos são populados pela função `loadContract` ao carregar um contrato existente, e `currentContractStatus` é atualizado localmente por `resubmitForReview` após o reenvio.

---

## 5. Transições de Status

| De                | Para              | Quem aciona  | Como                                                                                                                    |
|-------------------|-------------------|--------------|-------------------------------------------------------------------------------------------------------------------------|
| `draft`           | `pending_review`  | Usuário       | Clica em "Enviar para Revisão" em `QuestionnaireSummary`. Aciona `handleSubmitForReview` em `SharedQuestionnaireContainer`. |
| `pending_review`  | `approved`        | Master        | Clica em "Aprovar" na página `MasterReview`. Aciona `handleReview('approved')`.                                         |
| `pending_review`  | `rejected`        | Master        | Clica em "Reprovar" na página `MasterReview`. Aciona `handleReview('rejected')`.                                        |
| `rejected`        | `pending_review`  | Usuário       | Clica em "Reenviar para Revisão" em `QuestionnaireSummary`. Aciona `resubmitForReview()` no `ContractContext`.           |

Não existe transição direta de `approved` para outro status pelo fluxo atual da interface.

---

## 6. Comportamento ao Abrir Contrato Rejeitado

Quando um usuário abre um contrato com status `rejected` (seja clicando em "Editar e Reenviar" em `MeusContratos` ou acessando novamente o link compartilhado), o seguinte ocorre:

1. **`loadContract` é chamado** com o ID do contrato. A função busca o registro no Supabase e popula todo o estado do contexto.

2. **Abertura direta no resumo:** A lógica em `loadContract` detecta que o status é `rejected` e força `currentQuestionIndex` para `9999` — o índice que representa a tela de resumo (`QuestionnaireSummary`). Isso evita que o usuário seja levado ao início do formulário.

   ```typescript
   // src/contexts/ContractContext.tsx, dentro de loadContract
   const restoredIndex = (
     (data as any).status === 'rejected' || (data as any).status === 'pending_review'
   ) ? 9999 : (data.current_question_index || -1);
   setCurrentQuestionIndex(restoredIndex);
   ```

3. **Exibição do painel de feedback:** Como `currentContractStatus` é `'rejected'` e `currentContractReviewNotes` contém o texto do revisor, o componente `ReviewFeedbackPanel` é renderizado na página principal (`Index.tsx`), exibindo o feedback no canto inferior direito.

4. **Edição disponível:** Na tela de resumo, o usuário pode clicar em qualquer botão de edição (ícone de lápis) para navegar a perguntas específicas, corrigir os dados e retornar ao resumo.

5. **Reenvio:** O botão "Reenviar para Revisão" aparece no `QuestionnaireSummary` (quando `currentContractStatus === 'rejected'`). Ao clicar, o contrato é atualizado para `pending_review` e o ciclo reinicia.

---

## 7. Como o Feedback Chega ao Usuário

O caminho percorrido pela mensagem de feedback do Master até a tela do usuário é:

```
Master insere o texto em <Textarea> na página MasterReview
        │
        ▼
handleReview('rejected') chama supabase.update({ review_notes: reviewNotes, status: 'rejected', ... })
        │
        ▼
Registro atualizado em saved_contracts (Supabase / PostgreSQL)
        │
        ▼
Usuário abre o contrato → ContractContext.loadContract() busca o registro via supabase.select()
        │
        ▼
loadContract popula:
  setCurrentContractStatus('rejected')
  setCurrentContractReviewNotes(data.review_notes)   ← texto do feedback
  setCurrentContractReviewedAt(data.reviewed_at)     ← timestamp da revisão
        │
        ▼
Index.tsx detecta: currentContractStatus === 'rejected' && currentContractReviewNotes !== null
        │
        ▼
Renderiza <ReviewFeedbackPanel
  reviewNotes={currentContractReviewNotes}
  reviewedAt={currentContractReviewedAt}
  contractId={currentSavedContractId}
/>
        │
        ▼
ReviewFeedbackPanel exibe o texto e a data da reprovação ao usuário
```

O mesmo fluxo ocorre no contexto do questionário compartilhado (`SharedQuestionnaireContainer`), com a diferença de que os estados `contractReviewNotes` e `contractReviewedAt` são locais ao componente e populados diretamente da consulta inicial ao Supabase, sem intermediação do `ContractContext`.
