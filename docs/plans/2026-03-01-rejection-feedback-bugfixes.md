# Rejection Feedback — Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three bugs in the rejection feedback feature: missing loading state on resubmit button, toast overlapping the floating panel, and contract opening at question 1 instead of the summary.

**Architecture:** Three isolated fixes in three files. No DB changes, no new components.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, sonner

---

## Task 1: Add loading state to the resubmit button in `QuestionnaireSummary`

**Root cause:** `onSubmitForReview` is async but the button has no `isSubmitting` state — no visual feedback while the Supabase call runs, and the button remains clickable.

**Files:**
- Modify: `src/components/questionnaire/QuestionnaireSummary.tsx`

### Step 1: Add `isSubmitting` state

Find the existing `useState` declarations at the top of the component (around line 20):
```tsx
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [isSavingManually, setIsSavingManually] = useState(false);
```

Add immediately after them:
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Step 2: Add `Loader2` to the lucide import

Find the import line:
```tsx
import { ArrowLeft, CheckCircle, Edit, Printer, AlertCircle, Save } from 'lucide-react';
```

Replace with:
```tsx
import { ArrowLeft, CheckCircle, Edit, Printer, AlertCircle, Save, Loader2 } from 'lucide-react';
```

### Step 3: Create a wrapped submit handler

Find the `handleManualSave` function (~line 115). Add a new function immediately after it:

```tsx
const handleSubmitForReview = async () => {
  if (!onSubmitForReview) return;
  setIsSubmitting(true);
  try {
    await onSubmitForReview();
  } finally {
    setIsSubmitting(false);
  }
};
```

### Step 4: Update the submit button

Find the submit button (~line 389):
```tsx
{isSharedContext && onSubmitForReview ? (
  <Button
    onClick={onSubmitForReview}
    disabled={!validationResult.isValid}
    className="bg-primary hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <CheckCircle className="w-4 h-4" />
    {currentContractStatus === 'rejected' ? 'Reenviar para Revisão' : 'Enviar para Revisão'}
  </Button>
```

Replace with:
```tsx
{isSharedContext && onSubmitForReview ? (
  <Button
    onClick={handleSubmitForReview}
    disabled={!validationResult.isValid || isSubmitting}
    className="bg-primary hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <CheckCircle className="w-4 h-4" />
    )}
    {isSubmitting
      ? 'Enviando...'
      : currentContractStatus === 'rejected'
      ? 'Reenviar para Revisão'
      : 'Enviar para Revisão'}
  </Button>
```

### Step 5: Manual verification

- Navigate to a rejected shared contract → questionnaire → summary
- Click "Reenviar para Revisão"
- Confirm: button shows spinner + "Enviando...", is disabled during async call
- After success, button disappears (context status changes to `pending_review`)

### Step 6: Commit

```bash
git add src/components/questionnaire/QuestionnaireSummary.tsx
git commit -m "fix: add loading state to resubmit button in QuestionnaireSummary"
```

---

## Task 2: Fix toast overlapping `ReviewFeedbackPanel`

**Root cause:** Both `ReviewFeedbackPanel` (`bottom-6 right-6`) and Sonner toasts (default `bottom-right`) occupy the same screen area.

**Files:**
- Modify: `src/components/shared/ReviewFeedbackPanel.tsx`

### Step 1: Move the collapsed chip up

Find:
```tsx
className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-md"
```

Replace `bottom-6` with `bottom-20`:
```tsx
className="fixed bottom-20 right-6 z-50 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-md"
```

### Step 2: Move the expanded panel up

Find:
```tsx
<div className="fixed bottom-6 right-6 z-50 w-80 shadow-lg">
```

Replace `bottom-6` with `bottom-20`:
```tsx
<div className="fixed bottom-20 right-6 z-50 w-80 shadow-lg">
```

### Step 3: Manual verification

- Load a rejected contract → questionnaire
- Confirm the feedback panel appears at ~80px above the bottom edge
- Trigger any action that produces a toast (e.g., navigate between questions to trigger auto-save)
- Confirm the toast appears below the panel without overlapping

### Step 4: Commit

```bash
git add src/components/shared/ReviewFeedbackPanel.tsx
git commit -m "fix: move ReviewFeedbackPanel above toast area"
```

---

## Task 3: Force summary view when loading a rejected contract

**Root cause:** Contracts submitted via `SharedQuestionnaireContainer` do not go through `QuestionnaireWithAutoSave`, so `current_question_index` is never saved as `9999` in the DB. `loadContract` restores this as `-1`, landing the filler at the welcome/start screen instead of the summary.

**Files:**
- Modify: `src/contexts/ContractContext.tsx`

### Step 1: Change index restoration in `loadContract`

Find in `loadContract` (~line 1258):
```tsx
setCurrentQuestionIndex(data.current_question_index || -1);
```

Replace with:
```tsx
// Contracts that have been reviewed should always open at the summary
const restoredIndex = (
  (data as any).status === 'rejected' || (data as any).status === 'pending_review'
) ? 9999 : (data.current_question_index || -1);
setCurrentQuestionIndex(restoredIndex);
```

### Step 2: Manual verification

- Go to `MeusContratos`, click "Editar e Reenviar" on a rejected shared contract
- Confirm it opens directly at the `QuestionnaireSummary` (showing all filled fields with edit buttons)
- Confirm the `ReviewFeedbackPanel` is visible
- Navigate to an individual question via a summary edit button, make a change, return to summary
- Confirm the summary reflects the change

### Step 3: Commit

```bash
git add src/contexts/ContractContext.tsx
git commit -m "fix: open rejected contracts at summary instead of first question"
```

---

## End-to-End Verification

After all three tasks:

1. Go to `MeusContratos` → click "Editar e Reenviar" on a rejected contract
   - [ ] Contract opens at summary (not welcome screen)
   - [ ] `ReviewFeedbackPanel` appears at bottom-right, above the toast zone
2. Edit a field from the summary, return to summary
3. Click "Reenviar para Revisão"
   - [ ] Button shows spinner + "Enviando..." during async
   - [ ] Button is disabled (no double-click)
   - [ ] Success toast appears below the panel (not overlapping)
   - [ ] Panel disappears after status changes to `pending_review`
