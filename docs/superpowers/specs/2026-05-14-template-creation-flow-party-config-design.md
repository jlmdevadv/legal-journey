# Spec: Fluxo de Criação de Templates e Configuração de Partes

**Data:** 2026-05-14  
**Status:** Aprovado para implementação

---

## Contexto

O redesign do dashboard removeu acidentalmente o modal de criação de templates, quebrando o fluxo de importação de conteúdo (txt, docx, JSON). Simultaneamente, há demanda por uma feature de configuração de partes por template (quantidade, tipos, papéis, partes fixas, outras partes) e um Cadastro de Partes reutilizável. Este spec cobre o redesign completo do fluxo de criação e a feature de partes.

---

## Escopo

1. **Modal de Conteúdo** — restaura e unifica a entrada de conteúdo ao criar um template
2. **Wizard Typeform** — configuração de partes antes de entrar no editor
3. **Aba "Partes" no Editor** — edição das configurações de partes pós-criação
4. **Cadastro de Partes** — registry reutilizável de partes, disponível para todos os usuários
5. **Compartilhamento de Cadastro via Link** — opt-in no modal de geração de link

---

## Fluxo Geral

```
[Botão "Novo Template" no MasterDashboard]
          ↓
[Modal de Conteúdo]  ← unifica cola / JSON / upload
          ↓ cria draft no Supabase
[Wizard Typeform — 6 passos]
          ↓ salva partyConfig no template
[MasterTemplateEditor]
  • Aba "Editar"   — texto e campos (comportamento atual)
  • Aba "Partes"   — espelha e edita partyConfig
  • Aba "Preview"  — visualização (comportamento atual)
```

O editor passa a ser **exclusivamente de edição** — só é acessado após o template ser criado pelo wizard.

---

## 1. Modal de Conteúdo

Abre ao clicar em "Novo Template". Três abas:

### Aba "Colar texto"
- Textarea livre com o texto/cláusulas do contrato
- Aceita placeholders `{{campo}}` — detecção automática ocorre no editor

### Aba "Importar JSON"
- Reaproveitamento do `TemplateImporter.tsx` existente
- O JSON importa **apenas o conteúdo/texto** — campos de partes, papéis e configurações no JSON são ignorados sem validação adicional
- O wizard não é pulado em nenhum caso

### Aba "Upload de arquivo"
- Aceita `.txt` e `.docx`
- `.txt`: leitura direta do texto
- `.docx`: extração do texto bruto via lib `docx` (já instalada)

### Aviso (exibido nas três abas)
> "Não é necessário incluir no texto: qualificação de partes, data e campo de assinatura. Esses elementos são configurados separadamente. Se incluídos, precisarão ser removidos manualmente."

### Comportamento ao confirmar
1. Cria registro do template no Supabase com status `draft` e o texto
2. Fecha modal de conteúdo
3. Abre Passo 1 do Wizard

---

## 2. Wizard Typeform

Sequência de modals com botões "Voltar" e "Avançar". Em todos os passos aplicáveis, existe a opção **"Deixar em aberto"** (o preenchedor decide no momento do preenchimento).

### Passo 1 — Nome do template
- Campo de texto obrigatório
- Único passo sem opção de "deixar em aberto"

### Passo 2 — Configuração geral das partes
- **Quantidade mínima** e **máxima** de partes (inputs numéricos; min ≤ max)
- **Tipos aceitos**: PF, PJ, ou ambos
- O mínimo conta o total de partes, incluindo partes fixas
- Se `min = max`, a pergunta de quantidade some para o preenchedor

### Passo 3 — Papéis das partes
- Lista aberta de papéis que existem neste template (ex: Contratante, Contratado, Fiador, Interveniente)
- O master adiciona quantos papéis quiser — independente da quantidade de partes
- Um contrato pode ter N partes com 1 papel, ou N partes com M papéis diferentes
- Cada papel pode ser marcado como "Deixar em aberto" para o preenchedor nomear
- Papéis slots acima do mínimo herdam "Deixar em aberto" por padrão

### Passo 4 — Partes fixas
- Pergunta: "Alguma parte já vem preenchida neste template?"
- **Não** → avança
- **Sim** → para cada parte fixa: master busca no Cadastro de Partes ou cadastra nova
  - Cadastro na hora salva automaticamente no Cadastro de Partes do master
  - Master atribui o papel (da lista do Passo 3) à parte fixa
  - Reaproveitamento do card de preenchimento de parte existente (modo master, somente leitura para o preenchedor)

### Passo 5 — Outras partes
- Pergunta: "Este template admite testemunhas, avalistas ou similares?"
- **Não** → avança
- **Sim**:
  - Tipos aceitos (PF/PJ/ambos)
  - Lista de papéis permitidos (ex: Testemunha, Avalista, Interveniente — lista livre)
  - Opcionalmente: incluir parte fixa nas outras partes (mesmo fluxo do Passo 4)

### Passo 6 — Resumo
- Exibe todas as configurações em formato de leitura
- Botão "Confirmar e ir para o editor"
- Salva `partyConfig` no template e redireciona para `MasterTemplateEditor`

### Associação parte ↔ papel no preenchimento
- **Parte fixa**: papel atribuído pelo master no wizard
- **Parte variável**: preenchedor escolhe dentre os papéis definidos no Passo 3
- Erros de atribuição são corrigidos via fluxo de revisão existente (`MasterReview`)

### Regra de partes variáveis exibidas ao preenchedor
```
partes variáveis = [min − fixas, max − fixas]
```
- Se intervalo resulta em número único → pula a pergunta de quantidade
- Se `min − fixas = 0` → preenchedor pode não adicionar nenhuma parte além das fixas

---

## 3. Aba "Partes" no Editor

Nova aba no `TemplateEditor`, entre "Editar" e "Preview". Formato de formulário editável (não typeform — o master já passou pelo wizard).

### Seções
- **Configuração geral**: min/max de partes, tipos aceitos
- **Papéis**: lista editável de papéis do template
- **Partes fixas**: adicionar, remover, editar; lookup no Cadastro de Partes
- **Outras partes**: habilitar/desabilitar, tipos, papéis, partes fixas

Qualquer alteração salva diretamente no template (mesmo comportamento do editor de campos atual).

---

## 4. Cadastro de Partes

### Modelo de dados — tabela `party_registry`
```sql
id            uuid primary key
owner_id      uuid references auth.users   -- qualquer usuário (master ou preenchedor)
name          text not null
person_type   text check (person_type in ('PF', 'PJ'))
document      text   -- CPF ou CNPJ
nationality   text
marital_status text
profession    text
address       text
city          text
state         text
email         text
created_at    timestamptz default now()
```

### Acesso
- Cada usuário vê **apenas seu próprio cadastro** por padrão
- Preenchedores com permissão via link veem também o cadastro do master que compartilhou (ver Seção 5)

### UI no Dashboard
- Nova seção "Cadastro de Partes" no Dashboard, visível para **todos os perfis** (master e preenchedor)
- Funcionalidades: lista, busca por nome/documento, adicionar, editar, remover
- Lookup acessível pelo wizard (Passo 4) e pela aba "Partes" do editor

---

## 5. Compartilhamento de Cadastro via Link

### Campo novo na tabela de links compartilhados
```sql
share_party_registry  boolean default false
```

### UI no `GenerateLinkModal`
- Novo toggle: *"Permitir que os destinatários acessem meu Cadastro de Partes"*
- Quando ativado, os usuários que receberem o link podem ver as partes cadastradas pelo master no momento do preenchimento

### Comportamento
- O vínculo é registrado no banco ao gerar o link
- No preenchimento, o sistema consulta se o link tem `share_party_registry = true` e, se sim, expõe o cadastro do master como fonte adicional no lookup de partes

---

## 6. Modelo de Dados — `ContractTemplate`

### Campo novo: `partyConfig`
```typescript
partyConfig: {
  minParties: number
  maxParties: number
  acceptedTypes: ('PF' | 'PJ')[]
  roles: string[]                    // lista de papéis do template
  allowOtherParties: boolean
  fixedParties: FixedParty[]
  otherPartiesConfig?: {
    acceptedTypes: ('PF' | 'PJ')[]
    roles: string[]
    fixedParties: FixedParty[]
  }
}

type FixedParty = {
  registryId?: string   // se veio do Cadastro de Partes
  role: string
  name: string
  personType: 'PF' | 'PJ'
  document?: string
  nationality?: string
  maritalStatus?: string
  profession?: string
  address?: string
  city?: string
  state?: string
  email?: string
}
```

O campo `usePartySystem: boolean` é mantido. `partyConfig` só é lido quando `usePartySystem = true`.

---

## 7. Componentes a Criar / Modificar

| Componente | Ação |
|---|---|
| `ContentModal.tsx` | Criar — modal unificado de conteúdo (3 abas) |
| `TemplateWizard.tsx` | Criar — container do wizard com controle de passos |
| `WizardStep1Name.tsx` | Criar — passo 1: nome |
| `WizardStep2PartyConfig.tsx` | Criar — passo 2: min/max, tipos |
| `WizardStep3Roles.tsx` | Criar — passo 3: papéis |
| `WizardStep4FixedParties.tsx` | Criar — passo 4: partes fixas |
| `WizardStep5OtherParties.tsx` | Criar — passo 5: outras partes |
| `WizardStep6Summary.tsx` | Criar — passo 6: resumo |
| `PartyRegistryLookup.tsx` | Criar — modal de busca no Cadastro de Partes |
| `PartyRegistrySection.tsx` | Criar — seção do Dashboard (lista + CRUD) |
| `TemplateEditor.tsx` | Modificar — adicionar aba "Partes" |
| `MasterDashboard.tsx` | Modificar — remover abertura direta no editor; botão abre ContentModal |
| `GenerateLinkModal.tsx` | Modificar — toggle de compartilhamento do cadastro |
| `PartyDataCard.tsx` | Reaproveitar — usado no Passo 4 em modo master |
| `PartyNumberQuestion.tsx` | Reaproveitar — lógica de min/max no preenchimento |

---

## 8. Migrações Supabase

1. Criar tabela `party_registry`
2. Adicionar coluna `party_config jsonb` na tabela de templates
3. Adicionar coluna `share_party_registry boolean default false` na tabela de links compartilhados
4. Aplicar RLS: usuário vê apenas seus próprios registros em `party_registry`
