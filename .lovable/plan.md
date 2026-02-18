

## Correcao dos Bugs da Fase 1.5

Foram identificados 2 problemas principais que bloqueiam o fluxo compartilhado.

---

### Bug 1: RLS impede usuarios comuns de acessar templates de organizacao

**Causa raiz:** A policy SELECT de `contract_templates` so permite ver templates com `organization_id IS NULL` (publicos) OU templates cuja organizacao pertence ao usuario logado (`owner_user_id = auth.uid()`). Um usuario comum acessando via link compartilhado nao e dono da organizacao, entao recebe erro 406.

**Solucao:** Expandir a policy SELECT de `contract_templates` para tambem permitir leitura quando o usuario tem um `share_link` valido (nao expirado, nao revogado) apontando para aquele template.

Nova condicao da policy:
```text
organization_id IS NULL
OR organization_id IN (SELECT id FROM organizations WHERE owner_user_id = auth.uid())
OR id IN (
    SELECT template_id FROM share_links
    WHERE is_revoked = false
    AND expires_at > now()
)
```

Isso permite que qualquer usuario autenticado veja um template que tenha pelo menos um link compartilhado ativo, sem expor templates sem links.

---

### Bug 2: Pagina de revisao mostra "Rascunho" sem acoes

**Causa raiz:** O documento de teste foi criado automaticamente pelo sistema (pelo SharedQuestionnaireContainer) com status `draft`, mas o preenchimento nunca foi concluido ate o sumario porque o Bug 1 bloqueou o carregamento do template. Portanto, o botao "Enviar para Revisao" nunca foi clicado.

**Solucao:** Nenhuma alteracao de codigo necessaria para este bug -- ele e consequencia do Bug 1. Uma vez que o Bug 1 seja corrigido, usuarios conseguirao preencher o questionario e enviar para revisao, mudando o status para `pending_review`, o que fara os botoes de aprovar/reprovar aparecerem.

Porem, como melhoria, sera adicionado um estado visual na tela de revisao para documentos com status `draft`, informando que o preenchimento ainda esta em andamento.

---

### Secao Tecnica

**Alteracoes:**

1. **Migration SQL** -- Substituir a policy SELECT de `contract_templates` por uma versao expandida que inclui templates com share_links ativos

2. **`src/pages/MasterReview.tsx`** -- Adicionar mensagem informativa para documentos com status `draft` (ex: "Este documento ainda esta sendo preenchido pelo usuario")

**Arquivos modificados:**
- Nova migration SQL (RLS policy)
- `src/pages/MasterReview.tsx` (melhoria visual)

