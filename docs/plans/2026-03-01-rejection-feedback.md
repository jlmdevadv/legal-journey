# Rejection Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show the master's `review_notes` to the filler user when a shared contract is rejected, with a floating collapsible panel during editing and an improved card in MeusContratos.

**Architecture:** Extend `ContractContext` to track rejection metadata loaded from Supabase, create a `ReviewFeedbackPanel` component with fixed positioning and sessionStorage state, wire it into both `Index.tsx` (re-edit flow from MeusContratos) and `SharedQuestionnaireContainer` (direct link flow). The rejected card in `MeusContratos` gets a feedback block and an "Editar e Reenviar" button.

**Tech Stack:** React 18, TypeScript, Supabase client, Tailwind CSS, shadcn/ui, date-fns/ptBR, lucide-react

---

## Task 1: Extend `ContractContext` with rejection metadata state

**Files:**
- Modify: `src/contexts/ContractContext.tsx`

### Step 1: Add new fields to `ContractContextType` interface

Find the `ContractContextType` interface (~line 40). Add before the closing `}`:

```ts
currentContractStatus: string | null;
currentContractReviewNotes: string | null;
currentContractReviewedAt: string | null;
currentContractOrganizationId: string | null;
resubmitForReview: () => Promise<boolean>;
```

### Step 2: Add state variables inside `ContractProvider`

Find the line `const [currentSavedContractId, setCurrentSavedContractId] = useState<string | null>(null);` (~line 109). Add right after it:

```tsx
const [currentContractStatus, setCurrentContractStatus] = useState<string | null>(null);
const [currentContractReviewNotes, setCurrentContractReviewNotes] = useState<string | null>(null);
const [currentContractReviewedAt, setCurrentContractReviewedAt] = useState<string | null>(null);
const [currentContractOrganizationId, setCurrentContractOrganizationId] = useState<string | null>(null);
```

### Step 3: Populate state in `loadContract`

Find the line `setCurrentSavedContractId(contractId);` (~line 1244). Add immediately after it:

```tsx
setCurrentContractStatus((data as any).status || null);
setCurrentContractReviewNotes((data as any).review_notes || null);
setCurrentContractReviewedAt((data as any).reviewed_at || null);
setCurrentContractOrganizationId((data as any).organization_id || null);
```

### Step 4: Add `resubmitForReview` function

Find `const listUserContracts` (~line 1256). Add the new function immediately before it:

```tsx
const resubmitForReview = async (): Promise<boolean> => {
  if (!currentSavedContractId) return false;
  try {
    const finalDoc = generateFinalDocument();
    const parties = getContractingParties();
    const otherInvolved = getOtherInvolved();
    const signatures = getSignatures();
    const locationDate = getLocationDate();
    const fullDocument = [
      parties ? `PARTES PRINCIPAIS\n\n${parties}` : '',
      otherInvolved ? `OUTROS ENVOLVIDOS\n\n${otherInvolved}` : '',
      finalDoc,
      locationDate ? `\n${locationDate}` : '',
      signatures ? `ASSINATURAS\n\n${signatures}` : '',
    ].filter(Boolean).join('\n\n');

    const { error } = await supabase
      .from('saved_contracts')
      .update({
        status: 'pending_review',
        submitted_for_review_at: new Date().toISOString(),
        generated_document: fullDocument,
      })
      .eq('id', currentSavedContractId);

    if (error) throw error;
    setCurrentContractStatus('pending_review');
    toast.success('Documento reenviado para revisão!');
    return true;
  } catch (error: any) {
    toast.error('Erro ao reenviar para revisão: ' + error.message);
    return false;
  }
};
```

### Step 5: Expose in context value

Find the large object passed to `ContractContext.Provider` value (near the bottom, where all functions are listed). Add these entries:

```tsx
currentContractStatus,
currentContractReviewNotes,
currentContractReviewedAt,
currentContractOrganizationId,
resubmitForReview,
```

### Step 6: Manual verification

- Open the app, navigate to a shared contract in `rejected` state from MeusContratos
- After `loadContract`, add a `console.log` temporarily to confirm `currentContractReviewNotes` is non-null
- Remove the log after confirmation

### Step 7: Commit

```bash
git add src/contexts/ContractContext.tsx
git commit -m "feat: add rejection metadata state to ContractContext"
```

---

## Task 2: Create `ReviewFeedbackPanel` component

**Files:**
- Create: `src/components/shared/ReviewFeedbackPanel.tsx`

### Step 1: Create the file

```tsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewFeedbackPanelProps {
  reviewNotes: string;
  reviewedAt?: string | null;
  contractId: string;
}

const storageKey = (id: string) => `feedback-panel-${id}`;

const ReviewFeedbackPanel = ({ reviewNotes, reviewedAt, contractId }: ReviewFeedbackPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = sessionStorage.getItem(storageKey(contractId));
    return stored === null ? true : stored === 'expanded';
  });

  useEffect(() => {
    sessionStorage.setItem(storageKey(contractId), isExpanded ? 'expanded' : 'collapsed');
  }, [isExpanded, contractId]);

  if (!reviewNotes) return null;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-md"
      >
        <MessageSquare className="w-4 h-4" />
        Feedback do Revisor
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 shadow-lg">
      <div className="bg-background border border-destructive/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="w-4 h-4 text-destructive" />
            Feedback do Revisor
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Minimizar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {reviewedAt && (
          <p className="text-xs text-muted-foreground mb-2">
            Revisado em {format(new Date(reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reviewNotes}</p>
      </div>
    </div>
  );
};

export default ReviewFeedbackPanel;
```

### Step 2: Commit

```bash
git add src/components/shared/ReviewFeedbackPanel.tsx
git commit -m "feat: create ReviewFeedbackPanel floating component"
```

---

## Task 3: Wire `ReviewFeedbackPanel` + resubmit into `Index.tsx`

**Files:**
- Modify: `src/pages/Index.tsx`

### Step 1: Add imports at the top of the file

After the existing imports, add:

```tsx
import ReviewFeedbackPanel from '@/components/shared/ReviewFeedbackPanel';
```

### Step 2: Extend `QuestionnaireWithAutoSave` to read rejection context

Find `const QuestionnaireWithAutoSave = () => {` (~line 21). The destructure from `useContract()` currently reads several fields. Add these to the destructure:

```tsx
currentContractStatus,
currentContractReviewNotes,
currentContractReviewedAt,
currentSavedContractId,
resubmitForReview,
```

### Step 3: Add derived values and resubmit handler

Inside `QuestionnaireWithAutoSave`, before the `return`, add:

```tsx
const isRejected = currentContractStatus === 'rejected';

const handleResubmit = async () => {
  await resubmitForReview();
};
```

### Step 4: Pass props to `QuestionnaireForm` and render panel

Replace:
```tsx
<QuestionnaireForm />
```
With:
```tsx
<QuestionnaireForm
  isSharedContext={isRejected}
  onSubmitForReview={isRejected ? handleResubmit : undefined}
/>
```

Then, inside the returned JSX of `QuestionnaireWithAutoSave`, after the main `<div className="container ...">` wrapper (but still inside the component's return), add the panel at the end:

```tsx
{isRejected && currentContractReviewNotes && currentSavedContractId && (
  <ReviewFeedbackPanel
    reviewNotes={currentContractReviewNotes}
    reviewedAt={currentContractReviewedAt}
    contractId={currentSavedContractId}
  />
)}
```

Since `ReviewFeedbackPanel` uses `fixed` positioning, it can be placed anywhere inside the JSX tree.

### Step 5: Manual verification

- Load a rejected contract from MeusContratos
- Confirm the floating panel appears, expanded, with the review notes
- Minimize it → chip appears in bottom-right
- Re-open it → panel expands again
- Reload page → chip should still be minimized (sessionStorage persists within tab)

### Step 6: Commit

```bash
git add src/pages/Index.tsx
git commit -m "feat: show rejection feedback panel and resubmit button in questionnaire"
```

---

## Task 4: Update `QuestionnaireSummary` — conditional resubmit button text

**Files:**
- Modify: `src/components/questionnaire/QuestionnaireSummary.tsx`

### Step 1: Add `currentContractStatus` to the `useContract()` destructure

Find the `useContract()` destructure in `QuestionnaireSummary` (~line 28). Add:

```tsx
currentContractStatus,
```

### Step 2: Change button text conditionally

Find the submit button (~line 389):
```tsx
Enviar para Revisão
```

Replace the button's text content with:
```tsx
{currentContractStatus === 'rejected' ? 'Reenviar para Revisão' : 'Enviar para Revisão'}
```

The full button becomes:
```tsx
<Button
  onClick={onSubmitForReview}
  disabled={!validationResult.isValid}
  className="bg-primary hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <CheckCircle className="w-4 h-4" />
  {currentContractStatus === 'rejected' ? 'Reenviar para Revisão' : 'Enviar para Revisão'}
</Button>
```

### Step 3: Commit

```bash
git add src/components/questionnaire/QuestionnaireSummary.tsx
git commit -m "feat: show 'Reenviar para Revisão' on summary when contract is rejected"
```

---

## Task 5: Update `listUserContracts` and `MeusContratos` rejected card

**Files:**
- Modify: `src/contexts/ContractContext.tsx`
- Modify: `src/pages/MeusContratos.tsx`

### Step 1: Update `SavedContract` interface in `ContractContext.tsx`

Find the `SavedContract` interface (~line 16). Add after the `contract_templates` field:

```ts
organization_id?: string | null;
review_notes?: string | null;
reviewed_at?: string | null;
```

### Step 2: Update the select in `listUserContracts`

Find (~line 1265):
```tsx
.select("id, name, status, template_id, updated_at, contract_templates(name)")
```

Replace with:
```tsx
.select("id, name, status, template_id, updated_at, organization_id, review_notes, reviewed_at, contract_templates(name)")
```

### Step 3: Update `SavedContract` interface in `MeusContratos.tsx`

Find the `SavedContract` interface (~line 11). Add:

```ts
review_notes?: string | null;
reviewed_at?: string | null;
```

### Step 4: Add local state for "ver mais" expansion in `MeusContratos`

Add a state variable inside `MeusContratos`:

```tsx
const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

const toggleFeedback = (id: string) => {
  setExpandedFeedback(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};
```

### Step 5: Replace the rejected card UI

Find in `MeusContratos.tsx` the `sharedContracts.map(...)` card (~line 141). Replace the block:

```tsx
{contract.status === 'rejected' && (
  <p className="text-sm text-destructive">Documento reprovado. Edite e reenvie.</p>
)}
```

With:

```tsx
{contract.status === 'rejected' && (
  <div className="space-y-2">
    {contract.review_notes && (
      <div className="rounded border border-destructive/30 bg-destructive/5 p-3 space-y-1">
        <p className="text-xs font-medium text-destructive">Feedback do Revisor</p>
        <p className={`text-xs text-foreground whitespace-pre-wrap ${expandedFeedback.has(contract.id) ? '' : 'line-clamp-3'}`}>
          {contract.review_notes}
        </p>
        {contract.review_notes.length > 120 && (
          <button
            onClick={() => toggleFeedback(contract.id)}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            {expandedFeedback.has(contract.id) ? 'ver menos' : 'ver mais'}
          </button>
        )}
      </div>
    )}
    <Button size="sm" onClick={() => handleOpenContract(contract.id)} variant="destructive" className="w-full">
      Editar e Reenviar
    </Button>
  </div>
)}
```

Also update the draft button to not show for rejected status (it currently only renders for `draft`, which is correct — no change needed).

### Step 6: Manual verification

- Open MeusContratos with a rejected shared contract
- Confirm the card shows the feedback block with notes, "ver mais" if long, and "Editar e Reenviar" button
- Click "Editar e Reenviar" → should load the questionnaire at `/` with the feedback panel visible

### Step 7: Commit

```bash
git add src/contexts/ContractContext.tsx src/pages/MeusContratos.tsx
git commit -m "feat: show rejection feedback and edit button on MeusContratos rejected card"
```

---

## Task 6: Wire `ReviewFeedbackPanel` into `SharedQuestionnaireContainer`

**Files:**
- Modify: `src/components/shared/SharedQuestionnaireContainer.tsx`

This covers the edge case where the filler returns to the original `/shared/:token` URL while the contract is in `rejected` state.

### Step 1: Add import

```tsx
import ReviewFeedbackPanel from './ReviewFeedbackPanel';
```

### Step 2: Add local state for rejection data

After `const [showMobilePreview, setShowMobilePreview] = useState(false);`, add:

```tsx
const [contractReviewNotes, setContractReviewNotes] = useState<string | null>(null);
const [contractReviewedAt, setContractReviewedAt] = useState<string | null>(null);
const [contractStatus, setContractStatus] = useState<string>('draft');
```

### Step 3: Update the existing contract fetch to include rejection fields

Find in `loadTemplateAndDocument` (~line 67):
```tsx
const { data: existing } = await supabase
  .from('saved_contracts')
  .select('id')
  .eq('user_id', user.id)
  .eq('share_link_id', shareLinkId)
  .limit(1)
  .maybeSingle();

if (existing) {
  setSavedContractId(existing.id);
```

Replace with:
```tsx
const { data: existing } = await supabase
  .from('saved_contracts')
  .select('id, review_notes, reviewed_at, status')
  .eq('user_id', user.id)
  .eq('share_link_id', shareLinkId)
  .limit(1)
  .maybeSingle();

if (existing) {
  setSavedContractId(existing.id);
  setContractReviewNotes((existing as any).review_notes || null);
  setContractReviewedAt((existing as any).reviewed_at || null);
  setContractStatus((existing as any).status || 'draft');
```

### Step 4: Update `handleSubmitForReview` to reset status

At the end of the `try` block in `handleSubmitForReview`, after `toast.success(...)`, add:

```tsx
setContractStatus('pending_review');
```

### Step 5: Render the panel

In the JSX, inside the outer `<div className="min-h-screen bg-background">`, before the closing `</div>`, add:

```tsx
{contractStatus === 'rejected' && contractReviewNotes && savedContractId && (
  <ReviewFeedbackPanel
    reviewNotes={contractReviewNotes}
    reviewedAt={contractReviewedAt}
    contractId={savedContractId}
  />
)}
```

### Step 6: Commit

```bash
git add src/components/shared/SharedQuestionnaireContainer.tsx
git commit -m "feat: show rejection feedback panel in SharedQuestionnaireContainer"
```

---

## End-to-End Test Checklist

Manual test sequence to verify the full flow:

1. **As master:** Create a template, generate a share link, send it to a filler user
2. **As filler:** Access the link, complete and submit the questionnaire
3. **As master:** Go to `/master`, open the submitted document, add review notes, click "Reprovar"
4. **As filler:** Go to `MeusContratos` — verify:
   - [ ] Card shows "Reprovado" badge
   - [ ] "Feedback do Revisor" block appears with the review notes text
   - [ ] If notes > 120 chars, "ver mais" button toggles expansion
   - [ ] "Editar e Reenviar" button is visible
5. **As filler:** Click "Editar e Reenviar" — verify:
   - [ ] Navigates to the questionnaire at `/`
   - [ ] `ReviewFeedbackPanel` appears expanded in bottom-right corner
   - [ ] Notes text matches what master wrote
   - [ ] Minimizing creates the chip; clicking chip re-expands
   - [ ] Navigating between questions preserves panel state
6. **As filler:** In the summary, verify "Reenviar para Revisão" (not "Enviar")
7. **As filler:** Click "Reenviar para Revisão" — verify:
   - [ ] `toast.success` appears
   - [ ] Panel disappears (status changed to `pending_review`)
8. **As master:** Verify document appears back in `/master` with `pending_review` status
