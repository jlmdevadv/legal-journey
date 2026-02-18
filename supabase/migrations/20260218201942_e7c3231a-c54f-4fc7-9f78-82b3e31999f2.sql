ALTER TABLE public.saved_contracts DROP CONSTRAINT IF EXISTS saved_contracts_status_check;
ALTER TABLE public.saved_contracts ADD CONSTRAINT saved_contracts_status_check
  CHECK (status = ANY (ARRAY['draft', 'completed', 'archived', 'pending_review', 'approved', 'rejected']));