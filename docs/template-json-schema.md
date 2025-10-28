# 📄 Especificação do Formato JSON para Importação de Templates

## Visão Geral

Este documento descreve o formato JSON utilizado para importar templates de contratos na plataforma. Com este formato, você pode criar templates complexos em segundos, incluindo campos, textos de ajuda, lógica condicional, **campos repetíveis por parte** e muito mais.

## Estrutura Completa do JSON

```json
{
  "templateName": "string (obrigatório)",
  "templateDescription": "string (opcional)",
  "contractText": "string (obrigatório)",
  "cards": [
    {
      "id": "string (obrigatório, único)",
      "title": "string (obrigatório)",
      "type": "text | textarea | select | number | email | tel | date | info (obrigatório)",
      "placeholder": "string (opcional)",
      "required": "boolean (opcional, padrão: true)",
      "options": ["string"] (obrigatório apenas para type='select'),
      "helpText": {
        "how": "string (opcional)",
        "why": "string (opcional)"
      },
      "videoLink": "string (opcional)",
      "aiAssistantLink": "string (opcional)",
      "repeatPerParty": "boolean (opcional, padrão: false)",
      "includeValueInContract": "boolean (opcional, padrão: true, apenas para type='select')",
      "answerTemplates": [
        {
          "title": "string (obrigatório)",
          "value": "string (obrigatório)"
        }
      ],
      "answerTemplateMode": "replace | append (opcional, padrão: replace, apenas para textarea com answerTemplates)",
      "conditionalLogic": {
        "conditions": [
          {
            "fieldId": "string (obrigatório)",
            "operator": "equals | notEquals | contains | greaterThan | lessThan",
            "value": "string | number",
            "logicOperator": "AND | OR (opcional)"
          }
        ],
        "action": "show | hide"
      },
      "display_order": "number (opcional)",
      "infoContent": "string (obrigatório apenas para type='info')"
    }
  ],
  "usePartySystem": "boolean (opcional, padrão: true)"
}
```

## Descrição dos Campos

### Campos do Template (Nível Superior)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `templateName` | string | ✅ Sim | Nome do template que aparecerá no seletor |
| `templateDescription` | string | ❌ Não | Descrição breve do template (padrão: "Template importado via JSON") |
| `contractText` | string | ✅ Sim | Texto do contrato com placeholders no formato `{{id_do_campo}}` |
| `cards` | array | ✅ Sim | Lista de campos/perguntas do questionário |
| `usePartySystem` | boolean | ❌ Não | Se `true`, habilita o sistema de múltiplas partes (padrão: `true`) |

### Campos de Cada Card

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `id` | string | ✅ Sim | Identificador único do campo (usado nos placeholders) |
| `title` | string | ✅ Sim | Pergunta/título exibido ao usuário |
| `type` | string | ✅ Sim | Tipo do campo de entrada (ver tipos válidos abaixo) |
| `placeholder` | string | ❌ Não | Texto de exemplo no campo |
| `required` | boolean | ❌ Não | Se o campo é obrigatório (padrão: `true`) |
| `options` | array | ⚠️ Condicional | Obrigatório apenas para `type="select"` |
| `helpText` | object | ❌ Não | Textos de ajuda "como preencher" e "por que é importante" |
| `videoLink` | string | ❌ Não | URL de vídeo explicativo |
| `aiAssistantLink` | string | ❌ Não | URL para assistente de IA |
| `repeatPerParty` | boolean | ❌ Não | Se `true`, campo será preenchido uma vez por parte principal (padrão: `false`) |
| `answerTemplates` | array | ❌ Não | Lista de sugestões de resposta pré-formatadas (apenas para `textarea`) |
| `conditionalLogic` | object | ❌ Não | Regras de visibilidade condicional |
| `display_order` | number | ❌ Não | Ordem de exibição do campo no questionário (gerado automaticamente ao reordenar no editor) |
| `includeValueInContract` | boolean | ❌ Não | Se `false`, valor de campo `select` não aparece no contrato (apenas para lógica). Padrão: `true` |
| `answerTemplateMode` | string | ❌ Não | Modo de inserção de `answerTemplates`: `replace` (substitui) ou `append` (acumula). Padrão: `replace` |
| `infoContent` | string | ⚠️ Condicional | Conteúdo do card informativo. Obrigatório apenas para `type="info"` |

### Tipos de Campo Válidos

- `text` - Campo de texto curto (input)
- `textarea` - Campo de texto longo (área de texto)
- `select` - Lista de seleção (requer `options`)
- `number` - Campo numérico
- `email` - Campo de e-mail (com validação)
- `tel` - Campo de telefone
- `date` - Campo de data (seletor de calendário, formato dd/mm/aaaa)
- `info` - **[NOVO v2.3]** Card puramente informativo (não coleta dados)

### Formato de Data

Campos do tipo `date` utilizam o **formato brasileiro (dd/mm/aaaa)** em todo o sistema:

- ✅ **Na interface:** Seletor de calendário exibe datas em dd/mm/aaaa
- ✅ **No banco de dados:** Armazenado em formato ISO (YYYY-MM-DD) internamente
- ✅ **No contrato final:** Exibido como dd/mm/aaaa
- ✅ **No resumo:** Exibido como dd/mm/aaaa

**Exemplo:**
```json
{
  "id": "data_inicio",
  "title": "Data de início do contrato",
  "type": "date",
  "required": true
}
```

**Usuário seleciona:** 15 de março de 2024  
**Armazenado como:** `2024-03-15` (ISO)  
**Exibido no contrato:** `15/03/2024`

**Placeholder especial:** `[signing-date]`

O sistema fornece um placeholder automático `[signing-date]` que insere a data de assinatura formatada:

```json
{
  "contractText": "Contrato assinado em [signing-date]"
}
```

**Resultado:** "Contrato assinado em 15/03/2024"

### Estrutura do HelpText

```json
"helpText": {
  "how": "Instruções de como preencher este campo",
  "why": "Explicação de por que este campo é importante"
}
```

### Lógica Condicional

A lógica condicional permite mostrar ou ocultar campos baseado nas respostas de outros campos:

```json
"conditionalLogic": {
  "conditions": [
    {
      "fieldId": "id_do_campo_observado",
      "operator": "equals",
      "value": "valor_esperado",
      "logicOperator": "AND"
    }
  ],
  "action": "show"
}
```

**Operadores Disponíveis:**
- `equals` - Igual a
- `notEquals` - Diferente de
- `contains` - Contém (para strings)
- `greaterThan` - Maior que (para números)
- `lessThan` - Menor que (para números)

**Ações Disponíveis:**
- `show` - Mostra o campo quando as condições são atendidas
- `hide` - Oculta o campo quando as condições são atendidas

**Operadores Lógicos:**
- `AND` - Todas as condições devem ser verdadeiras
- `OR` - Pelo menos uma condição deve ser verdadeira

### Cláusulas Condicionais no Texto do Contrato

**⚠️ IMPORTANTE:** Não confunda com `conditionalLogic` (que controla a visibilidade de CAMPOS). As cláusulas condicionais permitem **adicionar ou remover blocos inteiros de texto** no contrato final baseado nas respostas do usuário.

**Como funciona:**
- Use a sintaxe `{{#if condition}}...{{/if}}` diretamente no `contractText`
- O texto dentro do bloco só aparecerá no contrato se a condição for verdadeira
- Suporta as mesmas condições que `conditionalLogic`

**Sintaxe:**
```
{{#if campo_id operator "valor"}}
Texto que só aparece se a condição for verdadeira.
Pode conter múltiplas linhas e cláusulas inteiras.
{{/if}}
```

**Operadores Disponíveis:**
- `equals` - Igual a
- `notEquals` - Diferente de
- `contains` - Contém (para strings)
- `greaterThan` - Maior que (para números)
- `lessThan` - Menor que (para números)

**Múltiplas Condições (AND/OR):**
```
{{#if campo1 equals "Sim" AND campo2 greaterThan "100"}}
Texto que aparece apenas se AMBAS as condições forem verdadeiras.
{{/if}}

{{#if campo1 equals "Opção A" OR campo1 equals "Opção B"}}
Texto que aparece se PELO MENOS UMA condição for verdadeira.
{{/if}}
```

**Exemplo Prático:**

Template com campo "foro" opcional:

```json
{
  "contractText": "CLÁUSULA 1ª - OBJETO\n[...]\n\n{{#if incluir_foro equals \"Sim\"}}\nCLÁUSULA 8ª - FORO\n\nFica eleito o foro da comarca de {{cidade_foro}} para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n{{/if}}",
  "cards": [
    {
      "id": "incluir_foro",
      "title": "Deseja incluir cláusula de foro?",
      "type": "select",
      "options": ["Sim", "Não"],
      "required": true
    },
    {
      "id": "cidade_foro",
      "title": "Qual a cidade do foro?",
      "type": "text",
      "placeholder": "Ex: São Paulo - SP",
      "conditionalLogic": {
        "conditions": [
          {
            "fieldId": "incluir_foro",
            "operator": "equals",
            "value": "Sim"
          }
        ],
        "action": "show"
      }
    }
  ]
}
```

**Resultado quando `incluir_foro = "Sim"` e `cidade_foro = "São Paulo - SP"`:**
```
CLÁUSULA 1ª - OBJETO
[...]

CLÁUSULA 8ª - FORO

Fica eleito o foro da comarca de São Paulo - SP para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
```

**Resultado quando `incluir_foro = "Não"`:**
```
CLÁUSULA 1ª - OBJETO
[...]

(Cláusula de foro não aparece)
```

**Quando usar:**
- ✅ Cláusulas opcionais (foro, confidencialidade, exclusividade)
- ✅ Variações de texto baseadas em tipo de contrato
- ✅ Parágrafos adicionais condicionais
- ✅ Diferentes versões de uma mesma cláusula
- ❌ Não use para simples visibilidade de campos (use `conditionalLogic` no card)

**Diferença entre `conditionalLogic` e `{{#if}}`:**

| Recurso | `conditionalLogic` (nos cards) | `{{#if}}` (no contractText) |
|---------|-------------------------------|------------------------------|
| **Controla** | Visibilidade de CAMPOS no questionário | Inclusão de TEXTO no contrato final |
| **Onde usa** | Dentro do objeto `card` | Diretamente no `contractText` |
| **Quando usar** | Para perguntas opcionais | Para cláusulas opcionais |
| **Exemplo** | "Mostrar campo 'detalhes' apenas se tipo='Sim'" | "Incluir cláusula de foro apenas se usuário escolher 'Sim'" |

**Dica:** Você pode combinar ambos! Use `conditionalLogic` para mostrar o campo apenas quando necessário, e `{{#if}}` para incluir a cláusula no contrato:

```json
{
  "contractText": "{{#if necessita_detalhes equals \"Sim\"}}\nCLÁUSULA X - DETALHES\n\n{{detalhes}}\n{{/if}}",
  "cards": [
    {
      "id": "necessita_detalhes",
      "title": "Precisa incluir detalhes adicionais?",
      "type": "select",
      "options": ["Sim", "Não"]
    },
    {
      "id": "detalhes",
      "title": "Quais são os detalhes?",
      "type": "textarea",
      "conditionalLogic": {
        "conditions": [
          {
            "fieldId": "necessita_detalhes",
            "operator": "equals",
            "value": "Sim"
          }
        ],
        "action": "show"
      }
    }
  ]
}
```

### Modelos de Resposta (Answer Templates)

A propriedade `answerTemplates` permite oferecer **sugestões de resposta pré-formatadas** para campos do tipo `textarea`, eliminando a necessidade de copiar e colar textos longos.

**Como funciona:**
1. O usuário vê botões com títulos curtos abaixo do campo textarea
2. Ao clicar em um botão, o texto completo é automaticamente inserido no campo
3. O usuário pode editar livremente o texto inserido

**Quando usar:**
- ✅ Cláusulas contratuais complexas com variações comuns
- ✅ Políticas empresariais (lucros, confidencialidade, exclusividade)
- ✅ Descrições de escopo de serviços/produtos
- ✅ Termos e condições padrão com opções
- ❌ Não use para campos simples (nome, CPF, email, etc.)
- ⚠️ **Apenas válido para campos do tipo `textarea`**

**Estrutura:**

```json
"answerTemplates": [
  {
    "title": "Título curto que aparece no botão",
    "value": "Texto completo que será inserido no campo quando o usuário clicar"
  }
]
```

**Exemplo prático:**

```json
{
  "id": "divisao_lucros",
  "title": "Defina a política de destinação de receitas e lucros do projeto.",
  "type": "textarea",
  "placeholder": "Clique em uma sugestão abaixo ou digite sua própria cláusula...",
  "required": true,
  "answerTemplates": [
    {
      "title": "Opção A: Reinvestimento Total",
      "value": "Todo o lucro líquido apurado será integralmente reinvestido no desenvolvimento do próprio Projeto, visando o custeio da operação, melhorias estruturais, marketing e aceleração do crescimento. Nesta fase, não haverá distribuição de lucros aos Fundadores."
    },
    {
      "title": "Opção B: Caixa + Distribuição",
      "value": "Do total da receita líquida apurada, o percentual de [25]% será retido para a composição de um fundo de caixa, destinado a cobrir despesas operacionais e reinvestimentos. O valor remanescente será distribuído aos Fundadores de forma [proporcional à participação societária de cada um]."
    },
    {
      "title": "Opção C: Distribuição Total",
      "value": "Todo o lucro líquido apurado será distribuído integralmente aos Fundadores, de forma [proporcional à participação societária de cada um], em até 15 dias após o fechamento do período de apuração."
    }
  ]
}
```

**Interface Visual para o Usuário:**

```
┌─────────────────────────────────────────────────────┐
│ Defina a política de destinação de receitas...     │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Campo textarea - clicável para editar]         │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📄 Sugestões de Resposta:                          │
│ ┌─────────────────────┐ ┌──────────────────────┐  │
│ │ Opção A: Reinvest.  │ │ Opção B: Caixa + Dist│  │
│ └─────────────────────┘ └──────────────────────┘  │
│ ┌─────────────────────┐                            │
│ │ Opção C: Distr. Total│                           │
│ └─────────────────────┘                            │
│                                                     │
│ Clique em uma sugestão para preencher...           │
└─────────────────────────────────────────────────────┘
```

**Dicas de UX:**
- ✅ Use títulos curtos e descritivos (máximo 40 caracteres)
- ✅ Ofereça 2-4 opções (evite sobrecarga de escolha)
- ✅ Inclua placeholders editáveis no texto (ex: `[25]%`, `[nome da empresa]`)
- ✅ Mantenha o placeholder do textarea instrutivo

### Opção `includeValueInContract` para Campos Select

**Introduzida em:** Versão 2.3.0  
**Funcionalidade:** Controlar se o valor selecionado em um campo `select` deve aparecer no contrato final.

#### Quando Usar

✅ **Use `includeValueInContract: false` quando:**
- O campo `select` serve **apenas para controle de lógica** (`{{#if}}` ou `conditionalLogic`)
- Perguntas tipo "Deseja incluir cláusula X?" (Sim/Não) que não devem aparecer no texto
- O valor selecionado é irrelevante para o leitor final do contrato

❌ **NÃO use quando:**
- O valor selecionado é parte importante do contrato (ex: "Tipo de contrato: Prestação de Serviços")
- O usuário precisa ver a escolha no documento final

#### Estrutura JSON

```json
{
  "id": "incluir_foro",
  "title": "Deseja incluir cláusula de foro?",
  "type": "select",
  "options": ["Sim", "Não"],
  "required": true,
  "includeValueInContract": false
}
```

#### Comportamento

| Valor | Comportamento |
|-------|--------------|
| `true` (padrão) | Valor selecionado aparece onde `{{incluir_foro}}` for usado no texto |
| `false` | Placeholder `{{incluir_foro}}` é **removido** do contrato (mas valor ainda disponível para `{{#if}}`) |

#### Exemplo Completo

**Template JSON:**
```json
{
  "contractText": "CLÁUSULA 1ª - OBJETO\n[objeto]\n\n{{#if incluir_foro equals \"Sim\"}}\nCLÁUSULA 8ª - FORO\n\nFica eleito o foro de {{cidade_foro}} para dirimir quaisquer questões.\n{{/if}}",
  "cards": [
    {
      "id": "objeto",
      "title": "Qual o objeto do contrato?",
      "type": "textarea",
      "required": true
    },
    {
      "id": "incluir_foro",
      "title": "Deseja incluir cláusula de foro?",
      "type": "select",
      "options": ["Sim", "Não"],
      "required": true,
      "includeValueInContract": false
    },
    {
      "id": "cidade_foro",
      "title": "Cidade do foro",
      "type": "text",
      "placeholder": "Ex: São Paulo - SP",
      "conditionalLogic": {
        "conditions": [
          { "fieldId": "incluir_foro", "operator": "equals", "value": "Sim" }
        ],
        "action": "show"
      }
    }
  ]
}
```

**Respostas do Usuário:**
- `objeto`: "Prestação de serviços de consultoria"
- `incluir_foro`: "Sim" ← Este valor NÃO aparece no contrato
- `cidade_foro`: "São Paulo - SP"

**Resultado no Contrato:**
```
CLÁUSULA 1ª - OBJETO
Prestação de serviços de consultoria

CLÁUSULA 8ª - FORO

Fica eleito o foro de São Paulo - SP para dirimir quaisquer questões.
```

**Note:** O valor "Sim" de `incluir_foro` não aparece em lugar nenhum, mas a cláusula foi incluída porque a condição `{{#if incluir_foro equals "Sim"}}` foi satisfeita.

#### Casos de Uso Comuns

1. **Controle de Cláusulas Opcionais:**
```json
{
  "id": "incluir_confidencialidade",
  "title": "Incluir cláusula de confidencialidade?",
  "type": "select",
  "options": ["Sim", "Não"],
  "includeValueInContract": false
}
```

2. **Decisões de Formato:**
```json
{
  "id": "formato_pagamento",
  "title": "Pagamento será à vista ou parcelado?",
  "type": "select",
  "options": ["À vista", "Parcelado"],
  "includeValueInContract": false
}
```
→ Usa o valor para mostrar diferentes blocos de texto, sem exibir a escolha explicitamente.

3. **Perguntas de Sim/Não:**
```json
{
  "id": "necessita_testemunhas",
  "title": "Este contrato precisa de testemunhas?",
  "type": "select",
  "options": ["Sim", "Não"],
  "includeValueInContract": false
}
```

#### Dicas de Implementação

✅ **Boas práticas:**
- Combine com `conditionalLogic` em campos dependentes
- Use com `{{#if}}` para controlar blocos de texto
- Mantenha opções claras e binárias (Sim/Não, Incluir/Excluir)

⚠️ **Cuidados:**
- O valor ainda é **salvo** e pode ser usado em condições
- Se você usar `{{incluir_foro}}` no texto E `includeValueInContract: false`, o placeholder será removido silenciosamente
- Não afeta a validação de campo obrigatório

### Modo de Inserção de `answerTemplates` (append vs replace)

**Introduzida em:** Versão 2.3.0  
**Funcionalidade:** Controlar como as sugestões de `answerTemplates` são inseridas em campos `textarea`.

#### Modos Disponíveis

| Modo | Comportamento | Quando Usar |
|------|--------------|-------------|
| `replace` (padrão) | Substitui **todo** o conteúdo do textarea | Cláusulas mutuamente exclusivas, opções únicas |
| `append` | **Adiciona** ao final do conteúdo existente (com `\n`) | Seleções múltiplas, listas de itens, papéis acumulativos |

#### Estrutura JSON

```json
{
  "id": "papeis_socio",
  "title": "Selecione os papéis deste sócio na empresa",
  "type": "textarea",
  "placeholder": "Clique nas sugestões para acumular...",
  "answerTemplateMode": "append",
  "answerTemplates": [
    { "title": "CEO", "value": "- CEO: Responsável pela gestão geral" },
    { "title": "CTO", "value": "- CTO: Responsável pela tecnologia" },
    { "title": "CFO", "value": "- CFO: Responsável pelas finanças" }
  ]
}
```

#### Comportamento Visual

**Modo `replace` (padrão):**
- Botões normais sem ícone especial
- Clicar **substitui** todo o conteúdo
- Mensagem: "Clique em uma sugestão para preencher automaticamente"

**Modo `append`:**
- Botões com ícone `+` (plus)
- Badge "Modo: Acumular" ao lado do título
- Clicar **adiciona** ao conteúdo existente
- Mensagem: "Clique nas sugestões para adicionar ao texto"

#### Exemplo Prático

**Cenário:** Definir múltiplos papéis de um sócio

**JSON:**
```json
{
  "id": "responsabilidades_socio",
  "title": "Quais responsabilidades este sócio terá?",
  "type": "textarea",
  "placeholder": "Selecione abaixo ou digite manualmente...",
  "answerTemplateMode": "append",
  "answerTemplates": [
    {
      "title": "Gestão Estratégica",
      "value": "- Responsável pela definição de estratégias de longo prazo e direcionamento geral da empresa."
    },
    {
      "title": "Controle Financeiro",
      "value": "- Responsável pela gestão financeira, contábil e fiscal da empresa."
    },
    {
      "title": "Marketing e Vendas",
      "value": "- Responsável pelas estratégias de marketing, captação de clientes e gestão comercial."
    },
    {
      "title": "Desenvolvimento de Produto",
      "value": "- Responsável pela criação, melhoria e manutenção dos produtos e serviços oferecidos."
    }
  ]
}
```

**Interação do Usuário:**
1. Usuário clica em "Gestão Estratégica"
   - Campo: `- Responsável pela definição de estratégias...`
2. Usuário clica em "Marketing e Vendas"
   - Campo: `- Responsável pela definição de estratégias...\n- Responsável pelas estratégias de marketing...`
3. Usuário clica em "Controle Financeiro"
   - Campo: (3 itens acumulados com quebras de linha)

**Resultado Final no Contrato:**
```
CLÁUSULA X - RESPONSABILIDADES

João Silva terá as seguintes responsabilidades:

- Responsável pela definição de estratégias de longo prazo e direcionamento geral da empresa.
- Responsável pelas estratégias de marketing, captação de clientes e gestão comercial.
- Responsável pela gestão financeira, contábil e fiscal da empresa.
```

#### Comparação de Casos de Uso

**Use `replace` para:**

1. **Políticas de Lucro (mutuamente exclusivas):**
```json
{
  "id": "politica_lucros",
  "answerTemplateMode": "replace",
  "answerTemplates": [
    { "title": "Reinvestimento Total", "value": "Todo lucro reinvestido..." },
    { "title": "Distribuição Proporcional", "value": "Lucro distribuído..." }
  ]
}
```

2. **Cláusulas Alternativas:**
```json
{
  "id": "clausula_rescisao",
  "answerTemplateMode": "replace",
  "answerTemplates": [
    { "title": "Opção A: Multa 10%", "value": "A rescisão gerará multa de 10%..." },
    { "title": "Opção B: Sem Multa", "value": "Não haverá multa rescisória..." }
  ]
}
```

**Use `append` para:**

1. **Papéis Múltiplos de Sócios:**
```json
{
  "id": "papeis",
  "answerTemplateMode": "append",
  "answerTemplates": [
    { "title": "CEO", "value": "- CEO (Chief Executive Officer)" },
    { "title": "CTO", "value": "- CTO (Chief Technology Officer)" }
  ]
}
```

2. **Benefícios Acumulativos:**
```json
{
  "id": "beneficios",
  "answerTemplateMode": "append",
  "answerTemplates": [
    { "title": "Vale-transporte", "value": "- Vale-transporte mensal" },
    { "title": "Plano de saúde", "value": "- Plano de saúde familiar" },
    { "title": "Vale-refeição", "value": "- Vale-refeição diário" }
  ]
}
```

3. **Características de Produto:**
```json
{
  "id": "caracteristicas_produto",
  "answerTemplateMode": "append",
  "answerTemplates": [
    { "title": "Garantia", "value": "• Garantia de 12 meses" },
    { "title": "Suporte", "value": "• Suporte técnico 24/7" },
    { "title": "Atualizações", "value": "• Atualizações gratuitas por 1 ano" }
  ]
}
```

#### Dicas de Implementação

✅ **Boas práticas:**
- Use prefixos consistentes (`-`, `•`, números) no modo `append` para listas
- Mantenha valores curtos no modo `append` (máximo 150 caracteres por item)
- No modo `replace`, valores podem ser longos (cláusulas completas)
- Combine com placeholder instrutivo: "Clique nas sugestões para acumular"

⚠️ **Cuidados:**
- Modo `append` só faz sentido com `answerTemplates` (se vazio, propriedade é ignorada)
- Usuário pode editar manualmente após inserção (em ambos os modos)
- Quebras de linha (`\n`) são adicionadas automaticamente no modo `append`

#### Validações

- ✅ `answerTemplateMode` é válido **apenas** para campos `type: 'textarea'`
- ✅ Se `answerTemplates` estiver vazio ou ausente, `answerTemplateMode` é ignorado
- ✅ Valor padrão é sempre `'replace'` (não precisa especificar se quiser comportamento padrão)

### Cards Informativos (type: 'info')

**Introduzida em:** Versão 2.3.0  
**Funcionalidade:** Inserir blocos puramente informativos no fluxo do questionário, sem coletar dados.

#### O que são Cards Informativos?

Cards informativos são telas especiais no questionário que:
- ❌ **NÃO coletam dados** (não possuem valor, não geram placeholder)
- ✅ **Exibem instruções, avisos ou contexto** para o usuário
- ✅ **Suportam formatação** (negrito, quebras de linha)
- ✅ **Podem ser condicionais** (aparecer apenas se certas condições forem atendidas)
- ✅ **Têm navegação simples** (botões Anterior/Próxima, sem validação)

#### Quando Usar

✅ **Use cards informativos para:**
- Instruções importantes antes de uma seção complexa
- Avisos legais ou disclaimers
- Separadores visuais entre etapas do questionário
- Explicações de conceitos necessários para preencher campos seguintes
- Mensagens contextuais baseadas em respostas anteriores

❌ **NÃO use para:**
- Substituir `helpText` de campos específicos (use o `helpText` do próprio campo)
- Informações que deveriam estar no contrato final
- Coleta de dados (use campos normais)

#### Estrutura JSON Mínima

```json
{
  "id": "info_introducao",
  "title": "Importante: Leia antes de prosseguir",
  "type": "info",
  "infoContent": "Esta seção requer informações financeiras detalhadas.\n\nCertifique-se de ter em mãos:\n- Balanço patrimonial recente\n- Projeções de receita\n- Custos operacionais estimados"
}
```

#### Campos Relevantes

| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| `id` | ✅ Sim | Identificador único (não usado no contrato, mas necessário) |
| `title` | ❌ Não | Título do card informativo (opcional, mas recomendado) |
| `type` | ✅ Sim | Deve ser `"info"` |
| `infoContent` | ✅ Sim | Conteúdo do texto informativo |
| `conditionalLogic` | ❌ Não | Controle de visibilidade (funciona normalmente) |
| `display_order` | ❌ Não | Posicionamento no questionário (funciona normalmente) |

#### Campos Ignorados

Os seguintes campos são **ignorados** para `type: 'info'`:
- `placeholder`, `required`, `repeatPerParty`, `answerTemplates`, `options`

#### Formatação do Conteúdo

O campo `infoContent` suporta:

1. **Negrito:** Use `**texto**` para destacar
   - Exemplo: `**Atenção:** Este é um aviso importante`
   - Resultado: **Atenção:** Este é um aviso importante

2. **Quebras de Linha:** Use `\n` para criar parágrafos
   - Exemplo: `Primeiro parágrafo.\n\nSegundo parágrafo.`

3. **Listas Simples:** Use `- ` ou `• ` para itens
   - Exemplo: `Documentos necessários:\n- CPF\n- RG\n- Comprovante de endereço`

**Nota:** Markdown completo NÃO é suportado (apenas negrito e quebras de linha).

#### Exemplo 1: Instruções de Seção

```json
{
  "id": "info_secao_financeira",
  "title": "📊 Seção Financeira",
  "type": "info",
  "infoContent": "Você está prestes a preencher informações financeiras críticas para o contrato.\n\n**Importante:**\n\nTodas as informações devem ser precisas e verificáveis. Estimativas devem ser claramente identificadas como tal.\n\nDuvidas? Consulte seu contador antes de prosseguir."
}
```

**Interface Visual:**
```
┌──────────────────────────────────────────────────┐
│ ℹ️ Informação 5 de 20                            │
│                                                  │
│ 📊 Seção Financeira                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                  │
│ Você está prestes a preencher informações       │
│ financeiras críticas para o contrato.           │
│                                                  │
│ Importante:                                      │
│                                                  │
│ Todas as informações devem ser precisas...      │
│                                                  │
│ ┌──────────┐              ┌──────────┐          │
│ │ Anterior │              │ Próxima  │          │
│ └──────────┘              └──────────┘          │
└──────────────────────────────────────────────────┘
```

#### Exemplo 2: Aviso Condicional

```json
{
  "id": "info_aviso_foro",
  "title": "⚠️ Atenção: Cláusula de Foro Selecionada",
  "type": "info",
  "infoContent": "Você escolheu incluir uma cláusula de foro no contrato.\n\n**Importante:** Certifique-se de que **todas as partes** concordam com a jurisdição escolhida antes de finalizar o contrato.\n\nA cláusula de foro pode afetar significativamente eventuais disputas futuras.",
  "conditionalLogic": {
    "conditions": [
      { "fieldId": "incluir_foro", "operator": "equals", "value": "Sim" }
    ],
    "action": "show"
  }
}
```

**Comportamento:** Este card só aparece se o usuário escolher "Sim" em `incluir_foro`.

#### Exemplo 3: Separador de Etapas

```json
{
  "id": "info_fim_dados_basicos",
  "title": "✅ Dados Básicos Concluídos",
  "type": "info",
  "infoContent": "Você concluiu o preenchimento dos dados básicos do contrato.\n\n**Próxima etapa:**\n\nAgora você definirá as cláusulas específicas e condições contratuais.\n\nEsta etapa pode levar aproximadamente 10-15 minutos.",
  "display_order": 100
}
```

#### Exemplo 4: Conceitos Explicativos

```json
{
  "id": "info_o_que_e_vesting",
  "title": "💡 O que é Vesting?",
  "type": "info",
  "infoContent": "**Vesting** é o processo de aquisição gradual de participação societária ao longo do tempo.\n\nExemplo: Se um sócio tem 10% com vesting de 4 anos, ele adquire:\n- Ano 1: 2.5%\n- Ano 2: 5% (acumulado)\n- Ano 3: 7.5% (acumulado)\n- Ano 4: 10% (total)\n\nIsso protege a empresa caso um sócio saia prematuramente."
}
```

#### Dicas de UX

✅ **Boas práticas:**
- Use emojis no título para chamar atenção (📋, ⚠️, 💡, ✅, 📊)
- Mantenha textos concisos (máximo 150-200 palavras)
- Use negrito para destacar palavras-chave
- Posicione estrategicamente usando `display_order`
- Combine com `conditionalLogic` para contexto dinâmico

⚠️ **Evite:**
- Textos muito longos (usuário pode pular sem ler)
- Informações que deveriam estar no contrato final
- Usar como substituto de `helpText` em campos

#### Validações

- ✅ Campo `id` é obrigatório (mesmo que não usado no contrato)
- ✅ Campo `infoContent` é obrigatório
- ✅ Campo `title` é opcional mas recomendado
- ❌ Campos como `placeholder`, `required`, `repeatPerParty` são ignorados
- ✅ `conditionalLogic` funciona normalmente
- ✅ `display_order` funciona normalmente

#### Posicionamento no Questionário

Cards informativos seguem a mesma lógica de ordenação que campos normais:
- Respeita `display_order`
- Pode ser posicionado em qualquer lugar do fluxo
- Não conta como "campo obrigatório" (não bloqueia finalização)

**Exemplo de sequência:**

```json
{
  "cards": [
    { "id": "nome_empresa", "type": "text", "display_order": 10 },
    { "id": "info_aviso", "type": "info", "display_order": 20 },
    { "id": "cnpj", "type": "text", "display_order": 30 }
  ]
}
```

**Ordem no questionário:**
1. nome_empresa (campo normal)
2. info_aviso **(card informativo)**
3. cnpj (campo normal)

### Ordenação de Campos (display_order)

**IMPORTANTE:** A ordem em que os campos aparecem no array `cards` do JSON **não determina** a ordem de exibição no questionário.

**Como funciona:**
- Cada campo possui um campo opcional `display_order` (número)
- Campos são exibidos no questionário ordenados por `display_order` (ordem crescente)
- Se `display_order` não for especificado, o campo recebe automaticamente um valor baseado em sua posição no array

**No Editor Visual:**
- O administrador pode arrastar e soltar campos para reordená-los
- A ordem é automaticamente salva no campo `display_order`

**No JSON:**
- Você pode especificar manualmente o `display_order` ao criar o JSON
- Valores menores aparecem primeiro (ex: 1, 2, 3...)
- Não é necessário usar números consecutivos (pode usar 10, 20, 30... para facilitar inserções futuras)

**Exemplo:**

```json
{
  "cards": [
    {
      "id": "nome_empresa",
      "title": "Nome da empresa",
      "type": "text",
      "display_order": 10
    },
    {
      "id": "objetivo",
      "title": "Objetivo do contrato",
      "type": "textarea",
      "display_order": 30
    },
    {
      "id": "cnpj",
      "title": "CNPJ da empresa",
      "type": "text",
      "display_order": 20
    }
  ]
}
```

**Ordem de exibição no questionário:**
1. nome_empresa (display_order: 10)
2. cnpj (display_order: 20)
3. objetivo (display_order: 30)

**Boas práticas:**
- ✅ Use intervalos de 10 (10, 20, 30...) para facilitar inserções futuras
- ✅ Deixe `display_order` vazio no JSON - o editor visual permite reordenar facilmente
- ✅ Organize campos em ordem lógica (informações básicas primeiro, detalhes depois)
- ⚠️ Se você especificar `display_order` manualmente, certifique-se de que todos os campos tenham valores únicos

### Campos Repetíveis por Parte (repeatPerParty)

Campos marcados com `repeatPerParty: true` são preenchidos **individualmente para cada parte principal do contrato**.

**Como funciona:**
1. O usuário primeiro define quantas partes principais terá o contrato
2. Preenche os dados básicos de cada parte (nome, CPF, endereço, etc.)
3. **Depois**, para cada campo com `repeatPerParty: true`, o sistema apresenta uma tela para cada parte

**Quando usar:**
- ✅ Dados bancários individuais
- ✅ E-mails específicos de cada parte
- ✅ Telefones de contato individuais
- ✅ Qualificações profissionais de cada parte
- ✅ Endereços de entrega específicos
- ❌ Não use para informações gerais do contrato (valor total, prazo, objeto, etc.)

**No texto do contrato:**
- Use `{{campo_id_formatted}}` para inserir os valores formatados automaticamente
- O sistema gera automaticamente uma lista formatada com o nome de cada parte e seu valor

**Exemplo prático:**

```json
{
  "id": "dados_bancarios",
  "title": "Dados Bancários para Recebimento",
  "type": "text",
  "repeatPerParty": true,
  "placeholder": "Banco, Agência, Conta",
  "helpText": {
    "how": "Informe banco, agência e número da conta corrente",
    "why": "Necessário para que cada parte receba seus pagamentos"
  }
}
```

No `contractText`, use:
```
CLÁUSULA X - PAGAMENTOS

Os pagamentos serão realizados conforme dados bancários abaixo:

{{dados_bancarios_formatted}}
```

**Resultado no contrato gerado:**
```
CLÁUSULA X - PAGAMENTOS

Os pagamentos serão realizados conforme dados bancários abaixo:

- João Silva: Banco Itaú, Agência 1234, Conta 56789-0
- Maria Santos: Banco Bradesco, Agência 9876, Conta 54321-1
```

### Dados das Partes (PartyData)

O sistema coleta automaticamente os seguintes dados de cada parte do contrato:

#### Campos Obrigatórios
- **Nome Completo** (`fullName`)
- **Nacionalidade** (`nationality`)
- **Estado Civil** (`maritalStatus`)
- **CPF** (`cpf`)
- **Endereço** (`address`)
- **Cidade** (`city`)
- **Estado** (`state`)
- **Tipo de Parte** (`partyType`) - Ex: "CONTRATANTE", "CONTRATADO", "SÓCIO", etc.

#### Campos Opcionais (v2.3+)
- **Profissão** (`profession`) - Ocupação ou cargo da parte
- **E-mail** (`email`) - Endereço eletrônico de contato

#### Placeholders Disponíveis no Contrato

O sistema gera automaticamente placeholders formatados para as partes:

| Placeholder | Conteúdo |
|------------|----------|
| `[contracting-parties]` | Lista formatada de todas as partes principais com qualificação completa |
| `[other-involved]` | Lista formatada de outras partes envolvidas (se houver) |

**Formato da qualificação:**

Sem profissão/e-mail:
```
João Silva, nacionalidade brasileira, solteiro, inscrito no CPF sob o nº 123.456.789-00, residente e domiciliado à Rua Exemplo, 123, São Paulo, SP
```

Com profissão/e-mail (se preenchidos):
```
João Silva, nacionalidade brasileira, solteiro, engenheiro civil, inscrito no CPF sob o nº 123.456.789-00, residente e domiciliado à Rua Exemplo, 123, São Paulo, SP, e-mail joao@exemplo.com
```

**Nota:** Profissão e e-mail aparecem **apenas se preenchidos** pelo usuário (campos opcionais).

## Exemplos Práticos

### Exemplo 1: Template Básico (MOU para Startups)

```json
{
  "templateName": "Memorando de Entendimentos (MOU) para Startups",
  "templateDescription": "Um modelo completo para alinhar expectativas entre sócios e fundadores antes da formalização da empresa.",
  "contractText": "CLÁUSULA 1ª - O Projeto\n1.1. As Partes têm por objetivo desenvolver o Projeto Empresarial denominado {{nome_projeto}}.\n\nCLÁUSULA 2ª - Participação Societária\n2.1. A participação societária se dará na seguinte proporção: {{divisao_equity}}.\n\nCLÁUSULA 3ª - Divisão de Lucros\n3.1. Toda a receita líquida gerada pelo Projeto terá a seguinte destinação: {{divisao_lucros}}.",
  "cards": [
    {
      "id": "nome_projeto",
      "title": "Qual é o nome do Projeto ou Startup?",
      "type": "text",
      "placeholder": "Ex: Além das Ideias",
      "required": true,
      "helpText": {
        "how": "Digite o nome fantasia ou o nome provisório da sua startup ou projeto.",
        "why": "Definir um nome, mesmo que temporário, cria uma identidade para o projeto e garante que todos os fundadores estejam se referindo à mesma iniciativa."
      }
    },
    {
      "id": "divisao_equity",
      "title": "Qual será a divisão de participação societária (equity)?",
      "type": "textarea",
      "placeholder": "Ex: Fundador A: 50%, Fundador B: 50%",
      "helpText": {
        "how": "Descreva a divisão percentual entre os sócios. A soma deve ser 100%.",
        "why": "Esta é uma das cláusulas mais importantes. Definir a divisão de equity agora evita as discussões mais difíceis e potencialmente destrutivas no futuro."
      }
    },
    {
      "id": "divisao_lucros",
      "title": "Defina a política de destinação de receitas e lucros do projeto.",
      "type": "textarea",
      "placeholder": "Clique em uma sugestão abaixo ou digite sua própria cláusula...",
      "required": true,
      "helpText": {
        "how": "Use as sugestões abaixo para preencher este campo, ou escreva sua própria cláusula do zero.",
        "why": "Definir a política de lucros de forma clara evita a principal causa de conflitos entre sócios e alinha as expectativas financeiras de todos."
      },
      "answerTemplates": [
        {
          "title": "Opção A: Reinvestimento Total",
          "value": "Todo o lucro líquido apurado será integralmente reinvestido no desenvolvimento do próprio Projeto, visando o custeio da operação, melhorias estruturais, marketing e aceleração do crescimento. Nesta fase, não haverá distribuição de lucros aos Fundadores."
        },
        {
          "title": "Opção B: Caixa + Distribuição",
          "value": "Do total da receita líquida apurada, o percentual de [25]% será retido para a composição de um fundo de caixa, destinado a cobrir despesas operacionais e reinvestimentos. O valor remanescente será distribuído aos Fundadores de forma [proporcional à participação societária de cada um]."
        },
        {
          "title": "Opção C: Distribuição Total",
          "value": "Todo o lucro líquido apurado será distribuído integralmente aos Fundadores, de forma [proporcional à participação societária de cada um], em até 15 dias após o fechamento do período de apuração."
        }
      ]
    }
  ],
  "usePartySystem": true
}
```

### Exemplo 2: Template com Campos Repetíveis

```json
{
  "templateName": "Contrato de Prestação de Serviços",
  "templateDescription": "Contrato com informações específicas para cada contratante",
  "contractText": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\n{{contracting_parties}}\n\nOBJETO\n\nO presente contrato tem por objeto: {{objeto_servico}}\n\nDADOS PARA PAGAMENTO\n\n{{dados_bancarios_formatted}}\n\nVALOR E FORMA DE PAGAMENTO\n\nO valor total é de {{valor_total}} a ser pago conforme: {{forma_pagamento}}\n\n{{location_date}}\n\n{{signatures}}",
  "cards": [
    {
      "id": "objeto_servico",
      "title": "Descreva o objeto/escopo dos serviços",
      "type": "textarea",
      "required": true,
      "placeholder": "Ex: Desenvolvimento de aplicativo mobile...",
      "helpText": {
        "how": "Descreva detalhadamente quais serviços serão prestados",
        "why": "Define claramente o escopo do contrato e evita mal-entendidos"
      }
    },
    {
      "id": "dados_bancarios",
      "title": "Dados Bancários para Pagamento",
      "type": "text",
      "required": true,
      "repeatPerParty": true,
      "placeholder": "Banco, Agência, Conta",
      "helpText": {
        "how": "Informe: Banco, Agência (com dígito) e Conta Corrente (com dígito)",
        "why": "Cada contratante receberá pagamentos em sua conta individual. Informações incorretas podem atrasar pagamentos."
      }
    },
    {
      "id": "valor_total",
      "title": "Valor total do contrato",
      "type": "text",
      "required": true,
      "placeholder": "R$ 15.000,00",
      "helpText": {
        "how": "Informe o valor total em reais, com vírgula para centavos",
        "why": "Define a remuneração total pelos serviços prestados"
      }
    },
    {
      "id": "forma_pagamento",
      "title": "Forma e condições de pagamento",
      "type": "textarea",
      "required": true,
      "placeholder": "Ex: 30% na assinatura, 40% na entrega do protótipo, 30% na conclusão",
      "helpText": {
        "how": "Descreva como e quando os pagamentos serão realizados",
        "why": "Estabelece clareza sobre o cronograma financeiro do projeto"
      }
    }
  ],
  "usePartySystem": true
}
```

```json
{
  "templateName": "Acordo de Confidencialidade (NDA)",
  "templateDescription": "Acordo de confidencialidade para proteger informações sensíveis",
  "contractText": "ACORDO DE CONFIDENCIALIDADE\n\nEste acordo é celebrado entre {{parte1}} e {{parte2}}.\n\nTipo de acordo: {{tipo_nda}}\n\n{{clausula_exclusividade}}\n\nVigência: {{prazo_vigencia}} meses a partir de {{data_inicio}}.",
  "cards": [
    {
      "id": "parte1",
      "title": "Nome da primeira parte (reveladora)",
      "type": "text",
      "required": true
    },
    {
      "id": "parte2",
      "title": "Nome da segunda parte (receptora)",
      "type": "text",
      "required": true
    },
    {
      "id": "tipo_nda",
      "title": "Tipo de acordo",
      "type": "select",
      "required": true,
      "options": [
        "Unilateral (apenas uma parte revela informações)",
        "Bilateral (ambas as partes revelam informações)"
      ]
    },
    {
      "id": "tem_exclusividade",
      "title": "Incluir cláusula de exclusividade?",
      "type": "select",
      "required": true,
      "options": ["Sim", "Não"]
    },
    {
      "id": "clausula_exclusividade",
      "title": "Detalhes da cláusula de exclusividade",
      "type": "textarea",
      "placeholder": "Descreva os termos da exclusividade",
      "conditionalLogic": {
        "conditions": [
          {
            "fieldId": "tem_exclusividade",
            "operator": "equals",
            "value": "Sim"
          }
        ],
        "action": "show"
      }
    },
    {
      "id": "prazo_vigencia",
      "title": "Prazo de vigência (em meses)",
      "type": "number",
      "placeholder": "12",
      "required": true
    },
    {
      "id": "data_inicio",
      "title": "Data de início da vigência",
      "type": "date",
      "required": true
    }
  ]
}
```

### Exemplo 3: Template com Lógica Condicional (NDA)

```json
{
  "templateName": "Contrato de Prestação de Serviços",
  "templateDescription": "Contrato personalizável para diferentes tipos de serviços",
  "contractText": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nContratante: {{contratante}}\nPrestador: {{prestador}}\n\nServiço: {{tipo_servico}}\n{{descricao_servico}}\n\nValor: {{valor_total}}\nForma de pagamento: {{forma_pagamento}}\n{{parcelamento}}",
  "cards": [
    {
      "id": "contratante",
      "title": "Nome do contratante",
      "type": "text",
      "required": true
    },
    {
      "id": "prestador",
      "title": "Nome do prestador de serviços",
      "type": "text",
      "required": true
    },
    {
      "id": "tipo_servico",
      "title": "Tipo de serviço",
      "type": "select",
      "required": true,
      "options": [
        "Consultoria",
        "Desenvolvimento de Software",
        "Design Gráfico",
        "Marketing Digital",
        "Outro"
      ]
    },
    {
      "id": "descricao_servico",
      "title": "Descrição detalhada do serviço",
      "type": "textarea",
      "required": true,
      "placeholder": "Descreva o escopo do serviço a ser prestado"
    },
    {
      "id": "valor_total",
      "title": "Valor total do serviço (R$)",
      "type": "number",
      "required": true,
      "placeholder": "5000.00"
    },
    {
      "id": "forma_pagamento",
      "title": "Forma de pagamento",
      "type": "select",
      "required": true,
      "options": [
        "À vista",
        "Parcelado",
        "Recorrente (mensal)"
      ]
    },
    {
      "id": "parcelamento",
      "title": "Detalhes do parcelamento",
      "type": "textarea",
      "placeholder": "Ex: 3 parcelas de R$ 1.666,67",
      "conditionalLogic": {
        "conditions": [
          {
            "fieldId": "forma_pagamento",
            "operator": "equals",
            "value": "Parcelado",
            "logicOperator": "OR"
          },
          {
            "fieldId": "forma_pagamento",
            "operator": "equals",
            "value": "Recorrente (mensal)"
          }
        ],
        "action": "show"
      }
    }
  ]
}
```

## Validações Realizadas

O sistema valida automaticamente:

1. **Campos Obrigatórios:**
   - ✅ `templateName` não pode estar vazio
   - ✅ `contractText` não pode estar vazio
   - ✅ `cards` deve ser um array

2. **Validação de Cards:**
   - ✅ Cada card deve ter `id`, `title` e `type`
   - ✅ IDs devem ser únicos (sem duplicatas)
   - ✅ `type` deve ser um dos tipos válidos
   - ✅ Cards do tipo `select` devem ter `options`

3. **Validação de Placeholders:**
   - ✅ Todos os placeholders `{{id}}` no `contractText` devem ter um card correspondente
   - ✅ Alertas sobre placeholders órfãos (sem card)

4. **Validação de Lógica Condicional:**
   - ✅ `conditionalLogic.conditions` deve ser um array
   - ✅ `conditionalLogic.action` deve ser "show" ou "hide"
   - ✅ Cada condição deve ter `fieldId`, `operator` e `value`

5. **Validação de Answer Templates:**
   - ✅ `answerTemplates` deve ser um array (se presente)
   - ✅ Cada template deve ter `title` e `value`
   - ✅ Alertas se `answerTemplates` for usado em campos que não sejam `textarea`

6. **Validação de Cláusulas Condicionais:**
   - ✅ Blocos `{{#if}}` devem ter `{{/if}}` correspondente
   - ✅ Condições dentro de `{{#if}}` devem referenciar campos existentes
   - ✅ Sintaxe das condições deve ser válida (campo, operador, valor)
   - ⚠️ Avisos sobre blocos `{{#if}}` aninhados (não recomendado)

## Processo de Importação

1. **Upload do Arquivo:**
   - Clique em "Importar JSON" no modo administrador
   - Selecione ou arraste um arquivo `.json`

2. **Validação Automática:**
   - O sistema valida o JSON automaticamente
   - Erros são exibidos em vermelho com detalhes específicos
   - Estatísticas são mostradas (quantidade de campos, placeholders)

3. **Importação:**
   - Se o JSON for válido, clique em "Importar Template"
   - O template é salvo no banco de dados
   - Aparece imediatamente no seletor de templates

## Troubleshooting (Resolução de Problemas)

### ❌ Erro: "Campo 'templateName' é obrigatório"
**Solução:** Adicione o campo `templateName` no nível superior do JSON com um valor não vazio.

### ❌ Erro: "Card X: campo 'id' é obrigatório"
**Solução:** Todos os cards devem ter um campo `id` único.

### ❌ Erro: "Card X: ID 'xyz' duplicado"
**Solução:** Cada card deve ter um `id` único. Renomeie os IDs duplicados.

### ❌ Erro: "Card 'xyz': tipo 'xxx' inválido"
**Solução:** Use apenas os tipos válidos: `text`, `textarea`, `select`, `number`, `email`, `tel`, `date`.

### ❌ Erro: "Card 'xyz': campos do tipo 'select' requerem array 'options'"
**Solução:** Adicione um array `options` com pelo menos uma opção:
```json
{
  "id": "meu_select",
  "type": "select",
  "options": ["Opção 1", "Opção 2", "Opção 3"]
}
```

### ❌ Erro: "Placeholders sem card correspondente: abc, xyz"
**Solução:** Certifique-se de que todos os placeholders `{{abc}}` no `contractText` tenham um card com `id: "abc"`.

### ❌ Erro: "JSON inválido"
**Solução:** Verifique a sintaxe do JSON:
- Todas as chaves devem estar entre aspas duplas
- Não pode haver vírgulas no final de arrays/objetos
- Strings devem usar aspas duplas, não simples
- Use ferramentas como JSONLint.com para validar

## Exportação de Templates

Você também pode exportar templates existentes para JSON:

1. Entre no modo administrador
2. Abra o editor de um template
3. Clique em "Exportar JSON"
4. O arquivo será baixado automaticamente

**Casos de uso:**
- Fazer backup de templates
- Copiar templates entre instâncias da plataforma
- Compartilhar templates com outros usuários
- Versionar templates usando Git
- Editar templates em um editor de texto externo

## Integração com IA (Geração Automática)

### Prompt para IAs (Gemini/GPT/Claude)

```
Você é um especialista em criar templates de contratos. Gere um arquivo JSON completo para importação seguindo esta estrutura:

{
  "templateName": "Nome do Contrato",
  "templateDescription": "Descrição breve",
  "contractText": "Texto do contrato com {{placeholders}} e {{campo_repetivel_formatted}} para campos repetíveis",
  "cards": [
    {
      "id": "identificador_unico",
      "title": "Pergunta ao usuário",
      "type": "text|textarea|select|number|email|tel|date",
      "placeholder": "Exemplo de preenchimento (opcional)",
      "required": true,
      "repeatPerParty": false,
      "helpText": {
        "how": "Como preencher este campo",
        "why": "Por que este campo é importante"
      }
    }
  ]
}

IMPORTANTE - Campos Repetíveis:
- Use "repeatPerParty": true para informações que devem ser coletadas de cada parte individualmente
- Exemplos: dados bancários, e-mails específicos, telefones individuais, qualificações
- No contractText, use {{campo_id_formatted}} para campos repetíveis
- Campos não repetíveis são preenchidos uma única vez no fluxo geral

IMPORTANTE - Cláusulas Condicionais:
- Use {{#if campo_id operator "valor"}}...{{/if}} no contractText para cláusulas opcionais
- Exemplo: {{#if incluir_foro equals "Sim"}}\nCLÁUSULA X - FORO\n{{cidade_foro}}\n{{/if}}
- Combine com conditionalLogic nos cards para controlar perguntas relacionadas
- Operadores disponíveis: equals, notEquals, contains, greaterThan, lessThan
- Suporta AND/OR: {{#if campo1 equals "A" AND campo2 greaterThan "10"}}

Crie um template completo para: [TIPO DE CONTRATO DESEJADO]

Requisitos:
- Mínimo de 5 campos relevantes
- Incluir helpText em todos os campos
- Usar placeholders {{id}} no contractText
- Identificar corretamente quais campos devem ser repetPerParty
- Para campos repetíveis, usar {{id_formatted}} no texto do contrato
- Garantir que todos os placeholders tenham cards correspondentes
- Usar tipos de campo apropriados
```

### Exemplo de Uso com IA

**Prompt:**
> "Crie um JSON de template para um Contrato de Locação Residencial, incluindo campos para dados do locador, locatário, endereço do imóvel, valor do aluguel, data de início, prazo, reajuste anual, e cláusulas sobre animais de estimação e reformas."

**A IA gerará um JSON completo pronto para importação.**

## Boas Práticas

1. **Nomenclatura de IDs:**
   - Use snake_case (ex: `nome_completo`, `valor_aluguel`)
   - IDs devem ser descritivos e únicos
   - Evite caracteres especiais

2. **Estrutura do contractText:**
   - Use `\n` para quebras de linha
   - Use `\n\n` para parágrafos
   - Organize em cláusulas numeradas
   - Mantenha formatação consistente

3. **HelpText Efetivo:**
   - **"how":** Instruções práticas e exemplos
   - **"why":** Contexto legal ou importância estratégica
   - Seja conciso mas informativo

4. **Lógica Condicional:**
   - Use apenas quando necessário
   - Teste todas as combinações de condições
   - Prefira lógica simples (poucas condições)

5. **Campos Repetíveis:**
   - Identifique informações que devem ser coletadas individualmente
   - Use `repeatPerParty: true` apenas para dados específicos de cada parte
   - No texto do contrato, lembre-se de usar `{{campo_id_formatted}}` para campos repetíveis
   - Teste o fluxo com diferentes números de partes

## Erros Comuns e Como Resolver

### 1. "Placeholders sem card correspondente: campo_id_formatted"

**Causa:** Você usou `{{campo_id_formatted}}` no `contractText`, mas o card correspondente não tem `repeatPerParty: true`.

**Solução:** 
- Se o campo deve ser repetível por parte, adicione `"repeatPerParty": true` ao card
- Se não deve ser repetível, remova `_formatted` do placeholder no `contractText`

**Exemplo de Erro:**
```json
"contractText": "... {{email_formatted}} ...",
"cards": [
  {
    "id": "email",
    "type": "email",
    "repeatPerParty": false
  }
]
```

**Correção 1 (Tornar repetível):**
```json
"cards": [
  {
    "id": "email",
    "type": "email",
    "repeatPerParty": true
  }
]
```

**Correção 2 (Remover _formatted):**
```json
"contractText": "... {{email}} ..."
```

---

### 2. "Card 'campo_id' tem repeatPerParty: true mas usa {{campo_id}} no texto"

**Causa:** Você marcou o card como repetível mas esqueceu de usar `_formatted` no placeholder.

**Problema:** O campo será coletado de cada parte, mas todas as respostas aparecerão juntas no texto sem formatação adequada.

**Solução:** Use `{{campo_id_formatted}}` no `contractText` em vez de `{{campo_id}}`.

**Exemplo de Erro:**
```json
"contractText": "Dados bancários: {{dados_bancarios}}",
"cards": [
  {
    "id": "dados_bancarios",
    "repeatPerParty": true
  }
]
```

**Correção:**
```json
"contractText": "Dados bancários: {{dados_bancarios_formatted}}"
```

---

6. **Validação antes da Importação:**
   - Valide o JSON em JSONLint.com
   - Revise todos os IDs e placeholders
   - Teste o template após importar

## Validações Automáticas

### Validações Gerais

O sistema realiza automaticamente as seguintes validações:

- ✅ Todos os campos obrigatórios estão presentes
- ✅ IDs dos cards são únicos
- ✅ Tipos de campo são válidos
- ✅ Campos `select` têm `options` preenchido
- ✅ Todos os placeholders no `contractText` têm cards correspondentes
- ✅ Campos com `repeatPerParty: true` usam `{{id_formatted}}` no texto
- ✅ Sintaxe de cláusulas condicionais `{{#if}}` está correta

### Validações Específicas de Novas Funcionalidades (v2.3)

**Campos `select` com `includeValueInContract: false`:**
- ✅ Campo `options` ainda é obrigatório
- ✅ `conditionalLogic` funciona normalmente
- ✅ Valor é salvo e pode ser usado em `{{#if}}`
- ⚠️ Se placeholder `{{id}}` for usado no texto, será removido silenciosamente

**Campos `textarea` com `answerTemplateMode: 'append'`:**
- ✅ Campo `answerTemplates` é obrigatório (se vazio, `answerTemplateMode` é ignorado)
- ✅ Funciona apenas para `type: 'textarea'` (outros tipos ignoram)
- ⚠️ Usuário pode editar manualmente após acumulação

**Campos `type: 'info'`:**
- ✅ Campo `infoContent` é obrigatório
- ✅ Campo `id` é gerado automaticamente se não fornecido
- ✅ Campo `title` é opcional mas recomendado
- ❌ Campos `placeholder`, `required`, `repeatPerParty`, `answerTemplates`, `options` são ignorados
- ✅ `conditionalLogic` e `display_order` funcionam normalmente
- ✅ Não conta como campo obrigatório (não bloqueia finalização)

---

## Suporte e Recursos

- **Documentação completa:** `docs/template-json-schema.md`
- **Exemplos prontos:** Veja os exemplos neste documento
- **Validador online:** Use JSONLint.com para validar sintaxe
- **Exportação:** Exporte templates existentes para referência

## Changelog

### Versão 2.3.0 (Atual)

**Novas funcionalidades:**

1. **`includeValueInContract` para campos `select`**
   - Permite usar campos `select` apenas para lógica, sem incluir o valor no contrato final
   - Padrão: `true` (mantém comportamento atual)
   - Útil para perguntas de controle como "Incluir cláusula X?" (Sim/Não)

2. **`answerTemplateMode` para `answerTemplates`**
   - Modo `replace` (padrão): Substitui conteúdo do textarea
   - Modo `append`: Acumula sugestões selecionadas com quebra de linha
   - Ideal para seleções múltiplas (papéis, benefícios, características)

3. **Novo tipo de campo: `info`**
   - Cards puramente informativos (não coletam dados)
   - Suporta formatação básica (negrito, quebras de linha)
   - Funciona com `conditionalLogic` para exibição condicional
   - Útil para instruções, avisos e separadores de seção

4. **Campos opcionais em `PartyData`**
   - `profession` (profissão)
   - `email` (e-mail de contato)
   - Aparecem na qualificação das partes apenas se preenchidos

5. **Formato de data uniformizado**
   - Todas as datas exibidas em formato brasileiro (dd/mm/aaaa)
   - Armazenamento interno continua em ISO (YYYY-MM-DD)

### Versão 1.2 (2025-01)

**Funcionalidades:**
- Cláusulas condicionais no texto + Reordenação de campos
- Nova sintaxe `{{#if condition}}...{{/if}}` para cláusulas condicionais no contractText
- Suporte a operadores AND/OR em cláusulas condicionais
- Campo `display_order` para controle de ordem de exibição
- Editor visual com drag-and-drop para reordenar campos
- Validação de sintaxe de cláusulas condicionais
- Documentação expandida com exemplos práticos

### Versão 1.1 (2025-01)

**Funcionalidades:**
- Adição de campos repetíveis por parte
- Novo campo `repeatPerParty` para coletar informações individuais
- Suporte a formatação automática com `{{campo_id_formatted}}`
- Documentação e exemplos atualizados

### Versão 1.0 (2025-01)

**Funcionalidades:**
- Versão inicial da especificação
- Suporte completo a lógica condicional
- Validação automática de placeholders
- Exportação/importação bidirecional
