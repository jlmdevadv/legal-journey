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
