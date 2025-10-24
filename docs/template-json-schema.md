# 📄 Especificação do Formato JSON para Importação de Templates

## Visão Geral

Este documento descreve o formato JSON utilizado para importar templates de contratos na plataforma. Com este formato, você pode criar templates complexos em segundos, incluindo campos, textos de ajuda, lógica condicional e muito mais.

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
      "type": "text | textarea | select | number | email | tel | date (obrigatório)",
      "placeholder": "string (opcional)",
      "required": "boolean (opcional, padrão: true)",
      "options": ["string"] (obrigatório apenas para type='select'),
      "helpText": {
        "how": "string (opcional)",
        "why": "string (opcional)"
      },
      "videoLink": "string (opcional)",
      "aiAssistantLink": "string (opcional)",
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
      }
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
| `conditionalLogic` | object | ❌ Não | Regras de visibilidade condicional |

### Tipos de Campo Válidos

- `text` - Campo de texto curto (input)
- `textarea` - Campo de texto longo (área de texto)
- `select` - Lista de seleção (requer `options`)
- `number` - Campo numérico
- `email` - Campo de e-mail (com validação)
- `tel` - Campo de telefone
- `date` - Campo de data (seletor de calendário)

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
      "helpText": {
        "how": "Copie e cole uma das opções a seguir, editando os valores se necessário:\n\nOpção A (Reinvestimento Total):\n'Todo o lucro líquido apurado será integralmente reinvestido no desenvolvimento do próprio Projeto.'\n\nOpção B (Caixa + Distribuição):\n'Do total da receita líquida apurada, o percentual de [25]% será retido para a composição de um fundo de caixa. O valor remanescente será distribuído aos Fundadores de forma [proporcional à participação societária].'",
        "why": "Definir a política de lucros de forma clara evita a principal causa de conflitos entre sócios e alinha as expectativas financeiras de todos."
      }
    }
  ],
  "usePartySystem": true
}
```

### Exemplo 2: Template com Lógica Condicional (NDA)

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

### Exemplo 3: Template com Múltiplas Condições

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
  "contractText": "Texto do contrato com {{placeholders}}",
  "cards": [
    {
      "id": "identificador_unico",
      "title": "Pergunta ao usuário",
      "type": "text|textarea|select|number|email|tel|date",
      "placeholder": "Exemplo de preenchimento (opcional)",
      "required": true,
      "helpText": {
        "how": "Como preencher este campo",
        "why": "Por que este campo é importante"
      }
    }
  ]
}

Crie um template completo para: [TIPO DE CONTRATO DESEJADO]

Requisitos:
- Mínimo de 5 campos relevantes
- Incluir helpText em todos os campos
- Usar placeholders {{id}} no contractText
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

5. **Validação antes da Importação:**
   - Valide o JSON em JSONLint.com
   - Revise todos os IDs e placeholders
   - Teste o template após importar

## Suporte e Recursos

- **Documentação completa:** `docs/template-json-schema.md`
- **Exemplos prontos:** Veja os exemplos neste documento
- **Validador online:** Use JSONLint.com para validar sintaxe
- **Exportação:** Exporte templates existentes para referência

## Changelog

- **v1.0** (2025-01) - Versão inicial da especificação
  - Suporte completo a lógica condicional
  - Validação automática de placeholders
  - Exportação/importação bidirecional
