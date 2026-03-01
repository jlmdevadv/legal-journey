# Rejection Feedback — Bug Fixes Round 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two bugs that break the multi-cycle review flow: (1) `saveContract` overwrites `pending_review`/`rejected` status with `"completed"`, and (2) `SharedQuestionnaireContainer` never persists form data to the DB, so answers are lost after resubmit.

**Architecture:** Two isolated fixes in two files. No DB changes, no new components.

**Tech Stack:** React 18, TypeScript, Supabase JS client, sonner

---

## Task 1: Preserve review status in `saveContract`

**Root cause:** `saveContract` in `ContractContext.tsx` always computes status as:
```tsx
status: currentQuestionIndex === 9999 ? "completed" : "draft",
```
When the filler is at the summary (index 9999), every auto-save call overwrites the DB status to `"completed"`, including after `resubmitForReview()` has already set it to `"pending_review"`. This makes the master see the contract as finalizado after the first resubmit.

**Files:**
- Modify: `src/contexts/ContractContext.tsx`

### Step 1: Update the status line in `saveContract`

Find (~line 1166):
```tsx
        status: currentQuestionIndex === 9999 ? "completed" : "draft",
```

Replace with:
```tsx
        status: (currentContractStatus === 'rejected' || currentContractStatus === 'pending_review')
          ? currentContractStatus
          : currentQuestionIndex === 9999 ? "completed" : "draft",
```

> **Why this works:** `saveContract` closes over `currentContractStatus` (React state). When the status is a review status, the ternary short-circuits and preserves it. Only when the contract is in `draft` / `null` / `completed` does the old logic apply.

### Step 2: Manual verification

- Go to `MeusContratos` → click "Editar e Reenviar" on a rejected contract
- Edit a field in the summary → auto-save fires → confirm DB `status` column stays `rejected`
- Click "Reenviar para Revisão" → `resubmitForReview` sets `pending_review` in DB
- Navigate back to summary (still index 9999) → auto-save fires → confirm DB `status` stays `pending_review`
- Open master review page → confirm contract appears as `pending_review`, not `finalizado`

### Step 3: Commit

```bash
git add src/contexts/ContractContext.tsx
git commit -m "fix: preserve review status in saveContract instead of overwriting with completed"
```

---

## Task 2: Persist form data in `SharedQuestionnaireContainer`

**Root cause (two sub-issues):**

1. `handleSubmitForReview` only saves `status`, `submitted_for_review_at`, `generated_document` — never `form_values`, `parties_data`, etc. So when the contract is loaded for re-editing, `form_values` in the DB is `{}` and the context starts empty.

2. There is no auto-save on card change in `SharedQuestionnaireContainer` (unlike `QuestionnaireWithAutoSave` in `Index.tsx`). This means even if the filler navigates through the questionnaire, nothing is written to the DB until they click the submit button.

**Files:**
- Modify: `src/components/shared/SharedQuestionnaireContainer.tsx`

### Step 1: Add `useRef` to imports

Find the import line:
```tsx
import React, { useEffect, useState } from 'react';
```

Replace with:
```tsx
import React, { useEffect, useRef, useState } from 'react';
```

### Step 2: Expand the `useContract()` destructure

Find:
```tsx
  const { selectTemplate, selectedTemplate, generateFinalDocument, getContractingParties, getOtherInvolved, getSignatures, getLocationDate } = useContract();
```

Replace with:
```tsx
  const {
    selectTemplate, selectedTemplate, generateFinalDocument,
    getContractingParties, getOtherInvolved, getSignatures, getLocationDate,
    formValues, partiesData, numberOfParties, otherPartiesData, numberOfOtherParties,
    hasOtherParties, locationData, repeatableFieldsData,
    currentQuestionIndex, currentPartyLoopIndex,
  } = useContract();
```

### Step 3: Add `prevQuestionIndexRef` to track card changes

Find the line:
```tsx
  const [contractStatus, setContractStatus] = useState<string>('draft');
```

Add immediately after:
```tsx
  const prevQuestionIndexRef = useRef(currentQuestionIndex);
```

### Step 4: Add `saveFormState` helper

Find the `loadTemplateAndDocument` function declaration:
```tsx
  const loadTemplateAndDocument = async () => {
```

Add a new function immediately before it:
```tsx
  const saveFormState = async (contractId: string) => {
    await supabase
      .from('saved_contracts')
      .update({
        form_values: formValues,
        parties_data: partiesData,
        number_of_parties: numberOfParties,
        other_parties_data: otherPartiesData,
        number_of_other_parties: numberOfOtherParties,
        has_other_parties: hasOtherParties,
        location_data: locationData,
        repeatable_fields_data: repeatableFieldsData,
        current_question_index: currentQuestionIndex,
        current_party_loop_index: currentPartyLoopIndex,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', contractId);
  };

```

### Step 5: Add auto-save `useEffect` on card change

Find the existing `useEffect`:
```tsx
  useEffect(() => {
    loadTemplateAndDocument();
  }, [templateId]);
```

Add a new `useEffect` immediately after it:
```tsx
  useEffect(() => {
    if (!savedContractId || prevQuestionIndexRef.current === currentQuestionIndex) return;
    prevQuestionIndexRef.current = currentQuestionIndex;
    saveFormState(savedContractId);
  }, [currentQuestionIndex, savedContractId]);
```

> **Why `prevQuestionIndexRef`:** `currentQuestionIndex` starts at `-1` in context before the questionnaire begins. We skip saving until an actual card change happens after loading.

### Step 6: Include form data in `handleSubmitForReview`

Find the `update` call inside `handleSubmitForReview`:
```tsx
      const { error } = await supabase
        .from('saved_contracts')
        .update({
          status: 'pending_review',
          submitted_for_review_at: new Date().toISOString(),
          generated_document: fullDocument,
        })
        .eq('id', savedContractId);
```

Replace with:
```tsx
      const { error } = await supabase
        .from('saved_contracts')
        .update({
          status: 'pending_review',
          submitted_for_review_at: new Date().toISOString(),
          generated_document: fullDocument,
          form_values: formValues,
          parties_data: partiesData,
          number_of_parties: numberOfParties,
          other_parties_data: otherPartiesData,
          number_of_other_parties: numberOfOtherParties,
          has_other_parties: hasOtherParties,
          location_data: locationData,
          repeatable_fields_data: repeatableFieldsData,
          current_question_index: currentQuestionIndex,
          current_party_loop_index: currentPartyLoopIndex,
        })
        .eq('id', savedContractId);
```

### Step 7: Also load form data when existing contract is found

When the shared container finds an existing contract and sets `savedContractId`, it currently does NOT call `loadContract` — so the context form state stays empty. We need to call `loadContract` for existing contracts so the context is hydrated.

Find in `loadTemplateAndDocument`:
```tsx
      if (existing) {
        setSavedContractId(existing.id);
        setContractReviewNotes((existing as any).review_notes || null);
        setContractReviewedAt((existing as any).reviewed_at || null);
        setContractStatus((existing as any).status || 'draft');
```

Add `loadContract` to the `useContract()` destructure (Step 2 already done, just add `loadContract` to that list):

In Step 2 replace, update the destructure to include `loadContract`:
```tsx
  const {
    selectTemplate, selectedTemplate, generateFinalDocument,
    getContractingParties, getOtherInvolved, getSignatures, getLocationDate,
    formValues, partiesData, numberOfParties, otherPartiesData, numberOfOtherParties,
    hasOtherParties, locationData, repeatableFieldsData,
    currentQuestionIndex, currentPartyLoopIndex,
    loadContract,
  } = useContract();
```

Then, after setting `savedContractId` for an existing contract, call `loadContract`:
```tsx
      if (existing) {
        setSavedContractId(existing.id);
        setContractReviewNotes((existing as any).review_notes || null);
        setContractReviewedAt((existing as any).reviewed_at || null);
        setContractStatus((existing as any).status || 'draft');
        // Hydrate context with saved form data so the questionnaire is pre-filled
        await loadContract(existing.id);
```

> **Important:** `loadContract` sets `currentQuestionIndex` to `9999` for rejected/pending_review contracts. The `prevQuestionIndexRef` must be initialised from the context value *after* `loadContract` runs. Since the auto-save `useEffect` skips the first run if `prevQuestionIndexRef.current === currentQuestionIndex`, this is safe — `prevQuestionIndexRef` starts at `-1`, `loadContract` sets context to `9999`, and the effect fires once (saving). After that initial fire, changes are tracked normally.

> **Suppressing the "Contrato carregado" toast:** `loadContract` fires a toast "Contrato carregado com sucesso!" which is noise in the shared context. For now, accept this as minor UX — fixing it would require a `silent` option in `loadContract` which is out of scope for this bugfix.

### Step 8: Manual verification

- Open the shared link as the filler user (first time → blank form, expected)
- Fill in some cards → confirm auto-save fires (check Supabase `saved_contracts` row has `form_values` updated after each card change)
- Click "Enviar para Revisão" → confirm `status = pending_review` and `form_values` not empty
- Master rejects with notes → filler opens "Editar e Reenviar" from MeusContratos
- Confirm: summary shows pre-filled answers from previous submission
- Edit one field, return to summary → confirm the edit is reflected
- Click "Reenviar para Revisão" → confirm `status = pending_review` in DB, `form_values` updated
- Master reviews → contract is NOT shown as finalizado, appears as `pending_review` ✓

### Step 9: Commit

```bash
git add src/components/shared/SharedQuestionnaireContainer.tsx
git commit -m "fix: save form data in SharedQuestionnaireContainer and add auto-save on card change"
```

---

## End-to-End Verification

After both tasks:

1. Open shared link → fill form → submit for review
   - [ ] DB `form_values` is not empty after submit
2. Master rejects with notes
3. Filler opens "Editar e Reenviar" from MeusContratos
   - [ ] Summary shows pre-filled answers
   - [ ] ReviewFeedbackPanel visible with master's notes
4. Filler edits a field and resubmits
   - [ ] `pending_review` status preserved in DB (not overwritten to `completed`)
   - [ ] Master sees contract as `pending_review` on their dashboard
5. Master can reject again → filler goes through cycle again (unlimited cycles)
   - [ ] Each cycle preserves all previously filled answers
6. Master approves → contract status becomes `approved`
   - [ ] No more "Editar e Reenviar" button in MeusContratos
