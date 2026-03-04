# Documentation Update Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Atualizar a documentação existente e criar novas referências que reflitam o estado atual do projeto, cobrindo funcionalidades implementadas após o início no Lovable (design system Refinado Documental, fluxo de revisão/rejeição, deploy no Vercel, roles de usuário).

**Architecture:** O projeto é uma SPA React+Vite+TypeScript com Supabase como backend (auth + database). A documentação vive em `docs/` e segue o padrão Markdown. O README.md ainda é o boilerplate do Lovable e precisa de reescrita completa. Três documentos existentes precisam de atualização e quatro novos documentos precisam ser criados para cobrir lacunas.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, shadcn-ui, Supabase, Vercel, jsPDF, docx

---

## Escopo do Trabalho

### Documentos a ATUALIZAR
| Arquivo | Problema | Prioridade |
|---------|----------|-----------|
| `README.md` | Boilerplate Lovable — sem informação real do projeto | Alta |
| `docs/admin-setup.md` | Referencia "Lovable Cloud" em vez de Supabase Dashboard | Média |
| `docs/technical-data-flow.md` | Não cobre: rejection feedback, design system, MasterReview, PDF fixes | Alta |

### Documentos a CRIAR
| Arquivo | Conteúdo | Prioridade |
|---------|----------|-----------|
| `docs/deployment.md` | Setup Vercel + variáveis de ambiente Supabase | Alta |
| `docs/design-system.md` | Tokens Refinado Documental, fontes, paleta de cores | Média |
| `docs/review-workflow.md` | Ciclo completo revisão/rejeição (User → Master → User) | Alta |
| `docs/user-roles-and-flows.md` | Roles Guest/User/Admin/Master e suas rotas/permissões | Média |

---

### Task 1: Reescrever README.md

**Files:**
- Modify: `README.md`
- Read for context: `src/App.tsx`, `package.json`, `vercel.json`

**Step 1: Ler os arquivos de contexto necessários**

```bash
# Ler App.tsx para entender as rotas
# Ler package.json para tech stack
# Ler vercel.json para entender configuração de deploy
```

**Step 2: Reescrever README.md**

Substituir o conteúdo atual com o seguinte template:

```markdown
# Contrato Completo Fácil

Plataforma web para geração guiada de contratos jurídicos via questionário interativo.

## Visão Geral

O usuário seleciona um template de contrato, responde um questionário passo a passo e obtém um documento final formatado (PDF ou DOCX). Administradores ("master") podem criar e editar templates, revisar contratos submetidos e enviar feedback de rejeição.

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, shadcn-ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deploy:** Vercel
- **Geração de documentos:** jsPDF, docx

## Pré-requisitos

- Node.js >= 18 ou Bun
- Conta no Supabase com projeto configurado
- (Opcional) Vercel CLI para deploy manual

## Desenvolvimento Local

```sh
# 1. Clonar o repositório
git clone <URL_DO_REPOSITÓRIO>
cd contrato-completo-facil-02

# 2. Instalar dependências
npm install  # ou: bun install

# 3. Configurar variáveis de ambiente
# Crie um arquivo .env.local com:
VITE_SUPABASE_URL=<sua_url_supabase>
VITE_SUPABASE_ANON_KEY=<sua_chave_anon>

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em: http://localhost:8080

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verificação de lint (ESLint) |

## Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── admin/         # Componentes de admin (editor de templates, importador)
│   ├── questionnaire/ # Etapas do questionário (perguntas, sumário, partes)
│   ├── shared/        # Container compartilhado para links externos
│   └── ui/            # shadcn-ui (gerado automaticamente)
├── contexts/          # React Context API (AuthContext, ContractContext)
├── pages/             # Páginas/rotas
├── types/             # Tipos TypeScript globais
└── utils/             # Funções utilitárias (geração de documentos, formatadores)

docs/
├── admin-setup.md         # Como promover usuário a admin
├── deployment.md          # Deploy via Vercel
├── design-system.md       # Design system Refinado Documental
├── review-workflow.md     # Fluxo de revisão e rejeição
├── technical-data-flow.md # Fluxo de dados e tipos TypeScript
├── template-json-schema.md # Formato JSON para importar templates
└── user-roles-and-flows.md # Roles e permissões
```

## Roles de Usuário

| Role | Acesso |
|------|--------|
| Guest (não autenticado) | Página inicial, questionário |
| User | + "Meus Contratos" (`/meus-contratos`) |
| Admin | + Editor de templates no questionário |
| Master | + Dashboard (`/master`), revisão de contratos |

Veja [docs/user-roles-and-flows.md](docs/user-roles-and-flows.md) para detalhes completos.

## Documentação

- [Fluxo de dados técnico](docs/technical-data-flow.md)
- [Schema JSON de templates](docs/template-json-schema.md)
- [Fluxo de revisão](docs/review-workflow.md)
- [Setup de admin](docs/admin-setup.md)
- [Deploy](docs/deployment.md)
- [Design System](docs/design-system.md)
```

**Step 3: Verificar que o README ficou completo**

Abrir `README.md` e confirmar que não há mais referências ao Lovable boilerplate ("Welcome to your Lovable project", etc.).

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with real project info"
```

---

### Task 2: Atualizar docs/admin-setup.md

**Files:**
- Modify: `docs/admin-setup.md`
- Read for context: `supabase/migrations/` (verificar se a função `promote_user_to_admin` existe)

**Step 1: Verificar migrações existentes**

```bash
ls supabase/migrations/
```
Procurar pela função `promote_user_to_admin` nas migrações para confirmar que ainda existe.

**Step 2: Atualizar referências ao Lovable Cloud**

Localizar no arquivo:
```
No Lovable, clique em "Cloud" no menu superior
Vá para "Database" > "SQL Editor"
```

Substituir por:
```
Acesse o Supabase Dashboard em https://supabase.com/dashboard
Selecione o projeto > vá para "SQL Editor"
```

**Step 3: Adicionar seção de contexto do deploy**

Após o título, adicionar nota:
```markdown
> **Nota:** Este projeto está hospedado no Vercel e usa Supabase como banco de dados.
> Para acessar o SQL Editor, use o [Supabase Dashboard](https://supabase.com/dashboard).
```

**Step 4: Commit**

```bash
git add docs/admin-setup.md
git commit -m "docs: update admin-setup to reference Supabase Dashboard instead of Lovable Cloud"
```

---

### Task 3: Criar docs/deployment.md

**Files:**
- Create: `docs/deployment.md`
- Read for context: `vercel.json`, `.vercel/project.json`, `src/integrations/supabase/`

**Step 1: Ler arquivos de configuração de deploy**

```bash
cat vercel.json
cat src/integrations/supabase/client.ts  # ou onde está a config Supabase
```

**Step 2: Criar docs/deployment.md**

```markdown
# Deploy e Infraestrutura

## Plataforma

O projeto utiliza **Vercel** para hosting e **Supabase** como backend (banco de dados + autenticação).

## Variáveis de Ambiente

Configure no painel do Vercel (Settings > Environment Variables) ou no arquivo `.env.local` para desenvolvimento local:

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon do Supabase | Sim |

**Como obter os valores:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto
3. Vá em Settings > API
4. Copie "Project URL" e "anon public" key

## Deploy Automático

O deploy acontece automaticamente no Vercel a cada push para a branch `main`.

**Fluxo:**
1. Push para `main`
2. Vercel detecta mudanças e inicia build: `npm run build`
3. Arquivos gerados em `dist/` são publicados
4. SPA routing configurado via `vercel.json`

## vercel.json

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Esta configuração é necessária para que o React Router funcione corretamente — todas as rotas são redirecionadas para o `index.html`.

## Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Autenticar
vercel login

# Deploy de produção
vercel --prod
```

## Banco de Dados (Supabase)

### Migrações

As migrações SQL ficam em `supabase/migrations/`. Para aplicar localmente:

```bash
# Instalar Supabase CLI
npm i -g supabase

# Aplicar migrações ao projeto remoto
supabase db push
```

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `contract_templates` | Templates de contrato |
| `contracts` | Contratos gerados pelos usuários |
| `user_roles` | Roles de usuário (admin, master) |

### Funções SQL Importantes

- `promote_user_to_admin(email)` — Promove usuário a admin (ver `docs/admin-setup.md`)

## Ambientes

| Ambiente | Branch | URL |
|----------|--------|-----|
| Produção | `main` | URL configurada no Vercel |
| Preview | PRs / outras branches | URL gerada automaticamente pelo Vercel |
| Local | — | http://localhost:8080 |
```

**Step 3: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: add deployment.md with Vercel + Supabase setup guide"
```

---

### Task 4: Criar docs/user-roles-and-flows.md

**Files:**
- Create: `docs/user-roles-and-flows.md`
- Read for context: `src/App.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/MasterProtectedRoute.tsx`, `src/contexts/AuthContext.tsx`

**Step 1: Ler arquivos de autenticação e rotas**

```bash
cat src/components/auth/ProtectedRoute.tsx
cat src/components/auth/MasterProtectedRoute.tsx
cat src/contexts/AuthContext.tsx
```

**Step 2: Criar docs/user-roles-and-flows.md**

```markdown
# Roles de Usuário e Fluxos de Acesso

## Visão Geral

O sistema tem quatro perfis de acesso:

| Role | Descrição |
|------|-----------|
| **Guest** | Visitante não autenticado |
| **User** | Usuário autenticado comum |
| **Admin** | Usuário com permissão de edição de templates |
| **Master** | Usuário com acesso ao dashboard de revisão |

## Rotas e Permissões

| Rota | Guest | User | Admin | Master |
|------|-------|------|-------|--------|
| `/` (questionário) | ✅ | ✅ | ✅ + editar campos | ✅ |
| `/auth` (login/cadastro) | ✅ | ✅ | ✅ | ✅ |
| `/meus-contratos` | ❌ | ✅ | ✅ | ✅ |
| `/master` (dashboard) | ❌ | ❌ | ❌ | ✅ |
| `/master/template/:id` | ❌ | ❌ | ❌ | ✅ |
| `/master/review/:id` | ❌ | ❌ | ❌ | ✅ |
| `/s/:token` (link compartilhado) | ✅ | ✅ | ✅ | ✅ |

## Guarda de Rotas

### ProtectedRoute
Redireciona para `/auth` se o usuário não está autenticado.
- Arquivo: `src/components/auth/ProtectedRoute.tsx`

### MasterProtectedRoute
Redireciona para `/` se o usuário não tem role `master`.
- Arquivo: `src/components/auth/MasterProtectedRoute.tsx`

## Como Funciona a Role `admin`

- Armazenada na tabela `user_roles` no Supabase
- Campo exibido no questionário: botões de edição de campos aparecem no modo admin
- Não dá acesso ao dashboard `/master`
- Como promover: ver `docs/admin-setup.md`

## Como Funciona a Role `master`

- Também armazenada em `user_roles`
- Dá acesso completo ao dashboard em `/master`
- Pode: ver todos os contratos enviados, aprovar ou rejeitar com feedback
- Pode: criar e editar templates em `/master/template/:id`

## Fluxo do Usuário Comum

```
1. Acessa / → seleciona template → responde questionário
2. No sumário → pode salvar contrato (requer login)
3. Contrato salvo aparece em /meus-contratos
4. Pode enviar para revisão (status: "pending_review")
5. Master aprova ou rejeita com feedback
6. Se rejeitado → edita e reenvia
```

## Fluxo do Master

```
1. Acessa /master → lista de contratos pendentes
2. Abre contrato em /master/review/:id
3. Vê documento gerado + formulário de aprovação/rejeição
4. Aprova (status: "approved") ou rejeita com mensagem (status: "rejected")
5. Usuário recebe feedback em /meus-contratos e no questionário
```

## Status de Contratos

| Status | Descrição |
|--------|-----------|
| `draft` | Rascunho salvo pelo usuário |
| `pending_review` | Enviado para revisão do master |
| `approved` | Aprovado pelo master |
| `rejected` | Rejeitado com feedback do master |
```

**Step 3: Commit**

```bash
git add docs/user-roles-and-flows.md
git commit -m "docs: add user-roles-and-flows.md with access matrix and status descriptions"
```

---

### Task 5: Criar docs/review-workflow.md

**Files:**
- Create: `docs/review-workflow.md`
- Read for context: `src/components/shared/ReviewFeedbackPanel.tsx`, `src/pages/MasterReview.tsx`, `src/pages/MeusContratos.tsx`, `src/contexts/ContractContext.tsx` (estado de rejection)

**Step 1: Ler componentes de revisão**

```bash
cat src/components/shared/ReviewFeedbackPanel.tsx
cat src/pages/MasterReview.tsx
# Buscar por rejectionFeedback no ContractContext
grep -n "rejection" src/contexts/ContractContext.tsx
```

**Step 2: Criar docs/review-workflow.md**

```markdown
# Fluxo de Revisão e Rejeição de Contratos

## Visão Geral

O sistema permite que usuários enviem contratos para revisão por um "master". O master pode aprovar ou rejeitar o contrato com feedback textual.

## Diagrama do Fluxo

```
Usuário                           Master
  │                                  │
  ├─ Preenche questionário            │
  ├─ Salva como rascunho (draft)      │
  ├─ Envia para revisão ─────────────►│
  │                                  ├─ Acessa /master
  │                                  ├─ Abre /master/review/:id
  │                                  ├─ Aprova ──────────────────► status: approved
  │                                  └─ Rejeita com texto ────────► status: rejected
  │◄────────────────────────────────── Feedback visível
  ├─ Vê feedback em /meus-contratos
  ├─ Abre contrato (vai para sumário)
  ├─ Edita respostas
  └─ Reenvia para revisão
```

## Componentes Envolvidos

### ReviewFeedbackPanel (`src/components/shared/ReviewFeedbackPanel.tsx`)
- Painel flutuante que aparece no questionário quando o contrato tem status `rejected`
- Exibe a mensagem de feedback do master
- Botão "Reenviar para Revisão" no sumário (`QuestionnaireSummary.tsx`)

### MasterReview (`src/pages/MasterReview.tsx`)
- Página exclusiva para masters
- Exibe documento gerado em formato "parchment" (design Refinado Documental)
- Formulário para aprovar ou rejeitar com mensagem

### MeusContratos (`src/pages/MeusContratos.tsx`)
- Lista todos os contratos do usuário
- Contratos rejeitados exibem badge "Rejeitado" e botão "Editar"
- Ao clicar em "Editar", abre o contrato no sumário

## Estado no ContractContext

```typescript
// Estado relacionado à rejeição
rejectionFeedback: string | null     // Mensagem do master
rejectionMetadata: {
  rejectedAt: string;                // Timestamp ISO
  rejectedBy: string;                // ID do master
} | null
```

## Transições de Status

```typescript
type ContractStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';
```

| De → Para | Quem | Como |
|-----------|------|------|
| `draft` → `pending_review` | Usuário | Botão "Enviar para Revisão" no sumário |
| `pending_review` → `approved` | Master | Formulário em `/master/review/:id` |
| `pending_review` → `rejected` | Master | Formulário com mensagem obrigatória |
| `rejected` → `pending_review` | Usuário | Botão "Reenviar" no sumário |

## Comportamento ao Abrir Contrato Rejeitado

Quando o usuário abre um contrato com status `rejected`:
1. O questionário abre diretamente no **sumário** (não no início)
2. O `ReviewFeedbackPanel` aparece com a mensagem de feedback
3. O usuário pode editar qualquer resposta e depois reenviar
```

**Step 3: Commit**

```bash
git add docs/review-workflow.md
git commit -m "docs: add review-workflow.md describing approval/rejection cycle"
```

---

### Task 6: Criar docs/design-system.md

**Files:**
- Create: `docs/design-system.md`
- Read for context: `src/index.css`, `tailwind.config.ts`, `docs/plans/2026-02-23-redesign-design-system.md`

**Step 1: Ler arquivos de estilo**

```bash
cat src/index.css
cat tailwind.config.ts
cat docs/plans/2026-02-23-redesign-design-system.md
```

**Step 2: Criar docs/design-system.md**

Extrair dos arquivos de estilo os tokens de cor, fontes e decisões de design do "Refinado Documental" e documentar em formato de referência rápida.

Estrutura do documento:
- Visão geral do design system
- Paleta de cores (variáveis CSS)
- Tipografia (fontes, tamanhos)
- Componentes-chave e suas variantes
- Exemplos de uso

**Step 3: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: add design-system.md documenting Refinado Documental tokens and typography"
```

---

### Task 7: Atualizar docs/technical-data-flow.md — Seção Rejection Feedback

**Files:**
- Modify: `docs/technical-data-flow.md`
- Read for context: `src/contexts/ContractContext.tsx` (rejection states)

**Step 1: Localizar último número de seção no documento**

```bash
grep "^## [0-9]" docs/technical-data-flow.md | tail -5
```

**Step 2: Adicionar nova seção ao final**

Adicionar ao final do arquivo uma seção sobre o fluxo de rejeição com:
- Estados adicionados ao ContractContext
- Como o `rejectionFeedback` é propagado para os componentes
- Referência cruzada para `docs/review-workflow.md`

**Step 3: Atualizar a tabela de Estados Principais (seção 1.2)**

Adicionar as linhas faltantes:
```
| `rejectionFeedback` | `string \| null` | Mensagem de feedback do master ao rejeitar |
| `rejectionMetadata` | `object \| null` | Metadados da rejeição (timestamp, rejectedBy) |
```

**Step 4: Commit**

```bash
git add docs/technical-data-flow.md
git commit -m "docs: add rejection feedback states to technical-data-flow"
```

---

### Task 8: Commit Final e Revisão

**Step 1: Verificar todos os documentos criados/atualizados**

```bash
ls docs/
git log --oneline -10
```

**Step 2: Verificar links internos entre documentos**

Confirmar que os links entre documentos no README.md apontam para arquivos que existem:
- `docs/technical-data-flow.md` ✓
- `docs/template-json-schema.md` ✓
- `docs/review-workflow.md` ✓ (novo)
- `docs/admin-setup.md` ✓
- `docs/deployment.md` ✓ (novo)
- `docs/design-system.md` ✓ (novo)

**Step 3: Push da branch de desenvolvimento**

```bash
git push origin desenvolvimento
```

---

## Ordem de Execução Recomendada

1. Task 1 (README.md) — impacto imediato, mais visível
2. Task 3 (deployment.md) — informação prática para outros devs
3. Task 4 (user-roles-and-flows.md) — contexto importante para entender o sistema
4. Task 5 (review-workflow.md) — documenta feature recente não documentada
5. Task 2 (admin-setup.md) — correção de referências desatualizadas
6. Task 6 (design-system.md) — requer leitura cuidadosa do CSS
7. Task 7 (technical-data-flow.md) — atualização incremental do doc maior
8. Task 8 (revisão final)

## Notas

- Não criar testes automatizados (documentação não é código executável)
- Cada task pode ser feita em sessão separada sem perda de contexto
- A Task 6 (design-system.md) pode ser expandida depois com mais exemplos visuais
- O `docs/template-json-schema.md` **não** precisa de atualização — está preciso
