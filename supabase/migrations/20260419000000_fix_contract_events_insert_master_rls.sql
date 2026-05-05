-- Fix: contract_events_insert_master permitia insert apenas se o master
-- fosse o user_id do contrato, o que nunca é verdade. O master é o owner
-- da organização à qual o contrato pertence.

DROP POLICY IF EXISTS "contract_events_insert_master" ON contract_events;

CREATE POLICY "contract_events_insert_master"
ON contract_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM saved_contracts sc
    JOIN organizations o ON o.id = sc.organization_id
    WHERE sc.id = contract_events.contract_id
      AND o.owner_user_id = auth.uid()
  )
);
