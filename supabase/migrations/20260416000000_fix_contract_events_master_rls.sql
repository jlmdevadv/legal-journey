-- Fix: contract_events_select_master estava permitindo que qualquer master
-- lesse eventos de contratos de qualquer organização.
-- A policy correta deve filtrar pelo organization_id da organização do master.

DROP POLICY IF EXISTS "contract_events_select_master" ON contract_events;

CREATE POLICY "contract_events_select_master"
ON contract_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM saved_contracts sc
    JOIN organizations o ON o.id = sc.organization_id
    WHERE sc.id = contract_events.contract_id
      AND o.owner_user_id = auth.uid()
  )
);
