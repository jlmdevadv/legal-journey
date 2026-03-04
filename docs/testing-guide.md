# Guia de Testes do Sistema

Este documento é um roteiro prático para testar o sistema do início ao fim. Cobre a criação de contas, configuração de usuário master, criação de modelos de contrato via IA, e o fluxo completo de revisão e aprovação.

---

## 1. Contas Necessárias

Você vai precisar de **duas contas** para testar o fluxo completo:

| Conta | Papel | Para que serve |
|---|---|---|
| **Master** | Administrador do sistema | Criar modelos, revisar e aprovar contratos |
| **Usuário comum** | Cliente/usuário final | Preencher o questionário e enviar para revisão |

Ambas as contas são criadas normalmente pela tela de cadastro (`/auth`).

---

## 2. Configurar a Conta Master

Após criar a conta master via cadastro normal, é necessário promovê-la no banco de dados.

### Passo a Passo

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto → **SQL Editor** (menu lateral)
3. Execute o comando abaixo substituindo o e-mail:

```sql
SELECT promote_user_to_admin('seu-email-master@exemplo.com');
```

4. Faça **logout** e **login** novamente com a conta master
5. Acesse `/master` — você verá o painel de administração

> **Problemas?** Veja `docs/admin-setup.md` para troubleshooting detalhado.

---

## 3. Criar um Modelo de Contrato via IA

O sistema aceita importação de modelos no formato JSON. Você pode usar o Claude (ou qualquer LLM) para gerar esse JSON a partir de qualquer contrato.

### Prompt para o Claude

Cole o texto do contrato no prompt abaixo e envie para o Claude:

---

```
Você é um especialista em contratos jurídicos brasileiros e em sistemas de geração de contratos.

Vou te dar o texto de um contrato. Sua tarefa é converter esse contrato para o formato JSON abaixo, criando campos ("cards") para cada informação variável que o usuário precisará preencher.

REGRAS:
1. Cada dado variável (nomes, CPFs, endereços, valores, datas, etc.) deve virar um card
2. O texto do contrato deve usar placeholders no formato {{id_do_campo}}
3. IDs devem ser únicos, em snake_case, sem acentos (ex: nome_contratante, valor_mensal)
4. Use "type": "select" com "options" quando houver opções fixas (ex: Sim/Não, tipo de pessoa)
5. Use "type": "date" para datas (o sistema formata automaticamente como dd/mm/aaaa)
6. Use "repeatPerParty": true apenas para dados que variam por parte contratante (ex: em contratos com múltiplos locatários)
7. Inclua helpText.how e helpText.why para campos que possam gerar dúvida
8. Para campos opcionais ou que dependem de resposta anterior, use conditionalLogic

FORMATO JSON:
{
  "templateName": "Nome do Modelo",
  "templateDescription": "Descrição breve",
  "contractText": "Texto completo com {{placeholders}}",
  "usePartySystem": true,
  "cards": [
    {
      "id": "id_unico",
      "title": "Pergunta exibida ao usuário",
      "type": "text | textarea | select | number | email | tel | date | info",
      "placeholder": "Exemplo de resposta",
      "required": true,
      "options": ["Opção 1", "Opção 2"],
      "helpText": {
        "how": "Como preencher este campo",
        "why": "Por que este campo é importante"
      },
      "repeatPerParty": false,
      "display_order": 1
    }
  ]
}

CONTRATO PARA CONVERTER:
[cole o texto do contrato aqui]
```

---

### Como Importar o JSON Gerado

1. No painel master (`/master`), clique em **"Novo Modelo"** ou edite um existente
2. No editor de template, clique em **"Importar JSON"**
3. Cole o JSON gerado pelo Claude e confirme
4. Revise os campos gerados e ajuste se necessário
5. Salve o modelo

---

## 4. Gerar Link para o Usuário Preencher

Após criar o modelo, você precisa gerar um link para o usuário final:

1. No painel master (`/master`), localize o modelo criado
2. Clique no ícone de **link/corrente** ao lado do modelo
3. Um modal abrirá — copie o link gerado (formato `/s/:token`)
4. Envie esse link para o usuário que vai preencher o contrato

> O link é público: o destinatário não precisa ter conta para **começar** o preenchimento, mas precisará fazer login/cadastro para **salvar e enviar** para revisão.

---

## 5. Fluxo do Usuário (Preenchimento)

**Com a conta de usuário comum:**

1. Acesse o link recebido (`/s/:token`) ou a página inicial e selecione o modelo
2. Na tela de boas-vindas, informe o número de partes (ex: 2 partes num contrato de locação)
3. Preencha os dados de cada parte (nome, CPF, endereço, etc.)
4. Responda o questionário campo a campo — use os botões "Anterior" e "Próxima"
5. Na tela de **local e data**, informe onde e quando o contrato será assinado
6. Na tela de **resumo**, revise todas as respostas
7. Clique em **"Enviar para Revisão"**

O status do contrato muda para **"Aguardando revisão"** e aparece em `Meus Contratos`.

---

## 6. Fluxo do Master (Revisão e Aprovação)

**Com a conta master:**

1. Acesse `/master`
2. No painel, você verá a lista de documentos aguardando revisão (badge laranja "Aguardando")
3. Clique em **"Revisar"** no documento desejado
4. Você verá o documento gerado em formato de visualização
5. Escolha uma ação:

| Ação | O que acontece |
|---|---|
| **Aprovar** | Status muda para "Aprovado". Usuário pode baixar o documento final. |
| **Rejeitar** | Digite o motivo da rejeição. Status muda para "Rejeitado". |

### Após Rejeição

O usuário verá um **painel de feedback** na tela com a mensagem do master. O contrato abre automaticamente no **resumo** (não no início). O usuário pode:
- Navegar de volta em qualquer questão para corrigir
- Clicar em **"Reenviar para Revisão"** após as correções

---

## 7. Checklist de Teste Completo

Execute essa sequência para validar o sistema do início ao fim:

### Configuração
- [ ] Criar conta master e promover via SQL
- [ ] Fazer logout e login — confirmar acesso ao `/master`

### Modelo de Contrato
- [ ] Usar o prompt acima para gerar JSON de um contrato simples (ex: prestação de serviços)
- [ ] Importar o JSON no editor de templates
- [ ] Verificar se os campos apareceram corretamente
- [ ] Gerar o link de preenchimento

### Preenchimento (usuário comum)
- [ ] Acessar o link gerado
- [ ] Preencher o questionário completo
- [ ] Verificar a prévia do contrato em tempo real (coluna direita)
- [ ] Enviar para revisão
- [ ] Verificar em "Meus Contratos" que o status é "Aguardando revisão"

### Revisão (master)
- [ ] Acessar `/master` e ver o documento na fila
- [ ] **Testar rejeição:** rejeitar com uma mensagem de feedback
- [ ] Verificar (como usuário) que o feedback aparece e o contrato abre no sumário
- [ ] Corrigir algo e reenviar
- [ ] **Testar aprovação:** aprovar o documento reenviado
- [ ] Verificar (como usuário) que o download está disponível

---

## 8. Dicas de Teste

**Sobre os tipos de campo:**
- `select` com `"includeValueInContract": false` — use quando a resposta controla lógica condicional mas não aparece literalmente no contrato (ex: "Sim/Não")
- Campos `info` são puramente informativos — não coletam dados, apenas exibem texto no meio do questionário
- `repeatPerParty: true` — útil em contratos com múltiplas partes (ex: cada locatário tem seu próprio campo de profissão)

**Sobre o sistema de partes:**
- A tela inicial pergunta quantas partes existem no contrato
- Campos com `repeatPerParty: true` serão perguntados uma vez para cada parte
- No texto do contrato, use `{{id_do_campo}}` — o sistema substitui automaticamente pela resposta da parte correspondente

**Sobre os downloads:**
- O documento pode ser baixado em **PDF** ou **DOCX** na tela de resumo
- O PDF é gerado no navegador (pode variar levemente entre browsers)
- O DOCX é editável e mantém a formatação

---

## 9. Referências

- [Esquema JSON completo dos modelos](./template-json-schema.md)
- [Fluxo de revisão detalhado](./review-workflow.md)
- [Roles e permissões](./user-roles-and-flows.md)
- [Setup do administrador](./admin-setup.md)
