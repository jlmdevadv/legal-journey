

## Correcao: CHECK constraint em saved_contracts

### Problema
A tabela `saved_contracts` possui um CHECK constraint (`saved_contracts_status_check`) que limita os valores da coluna `status` a `draft`, `completed` e `archived`. Os novos valores necessarios para o fluxo de revisao (`pending_review`, `approved`, `rejected`) sao rejeitados pelo banco.

### Solucao
Criar uma migration SQL que:
1. Remove o CHECK constraint existente (`saved_contracts_status_check`)
2. Recria o constraint incluindo os novos valores: `draft`, `completed`, `archived`, `pending_review`, `approved`, `rejected`

### Secao Tecnica

**Migration SQL:**
```text
ALTER TABLE public.saved_contracts DROP CONSTRAINT saved_contracts_status_check;
ALTER TABLE public.saved_contracts ADD CONSTRAINT saved_contracts_status_check
  CHECK (status = ANY (ARRAY['draft', 'completed', 'archived', 'pending_review', 'approved', 'rejected']));
```

Nenhuma alteracao de codigo e necessaria -- apenas a constraint do banco precisa ser atualizada.

