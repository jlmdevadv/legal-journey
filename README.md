# Contrato Completo Fácil

Aplicação web para geração guiada de contratos jurídicos — o usuário seleciona um modelo, responde um questionário passo a passo e obtém o documento pronto para download em PDF ou DOCX.

---

## Visão Geral

O **Contrato Completo Fácil** é uma SPA (Single Page Application) que simplifica a criação de contratos jurídicos para pessoas físicas e jurídicas. O fluxo principal é:

1. O usuário escolhe um modelo de contrato disponível.
2. Responde um questionário interativo com as informações necessárias.
3. Visualiza uma prévia do documento preenchido.
4. Faz o download em PDF ou DOCX.

Administradores **Master** têm acesso a um painel exclusivo para gerenciar modelos de contrato, revisar documentos gerados e aprovar ou rejeitar submissões.

---

## Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 18 | Interface de usuário |
| TypeScript | 5 | Tipagem estática |
| Vite | 5 | Bundler e dev server |
| Tailwind CSS | 3 | Estilização utilitária |
| shadcn-ui | — | Componentes de UI acessíveis (Radix UI) |
| React Router DOM | 6 | Roteamento client-side |
| TanStack Query | 5 | Cache e gerenciamento de estado servidor |
| Supabase | 2 | Autenticação, banco de dados (PostgreSQL) e RLS |
| docx | 9 | Geração de arquivos DOCX |
| jsPDF + html2canvas | 3 / 1 | Geração de arquivos PDF |
| Vercel | — | Hospedagem e CI/CD |

---

## Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- Conta no [Supabase](https://supabase.com) com projeto configurado
- (Opcional) CLI da Vercel para deploys manuais

---

## Desenvolvimento Local

### 1. Clonar o repositório

```bash
git clone https://github.com/jlmdevadv/legal-journey.git
cd legal-journey
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

Os valores estão disponíveis em **Project Settings > API** no dashboard do Supabase.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O servidor ficará disponível em `http://localhost:8080`.

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| Desenvolvimento | `npm run dev` | Inicia o dev server com HMR na porta 8080 |
| Build produção | `npm run build` | Gera o bundle otimizado em `dist/` |
| Build dev | `npm run build:dev` | Gera bundle no modo development |
| Preview | `npm run preview` | Serve o bundle gerado localmente |
| Lint | `npm run lint` | Executa o ESLint no código-fonte |

---

## Estrutura de Pastas

```
src/
├── App.tsx                  # Definição de rotas e providers globais
├── main.tsx                 # Ponto de entrada da aplicação
├── index.css                # Estilos globais e variáveis CSS
├── components/
│   ├── auth/                # Guardas de rota (ProtectedRoute, MasterProtectedRoute)
│   ├── admin/               # Componentes do painel administrativo
│   ├── contracts/           # Listagem e gerenciamento de contratos do usuário
│   ├── master/              # Componentes exclusivos do painel Master
│   ├── questionnaire/       # Questionário passo a passo de preenchimento
│   ├── shared/              # Componentes para templates compartilhados via link
│   ├── ui/                  # Componentes base do shadcn-ui
│   ├── ContractForm.tsx     # Formulário principal de criação de contrato
│   ├── ContractPreview.tsx  # Prévia do documento preenchido
│   ├── ContractPreviewModal.tsx # Modal de prévia
│   ├── DocumentDownloader.tsx   # Lógica de download PDF/DOCX
│   ├── Navbar.tsx           # Barra de navegação global
│   ├── QuestionnaireForm.tsx # Formulário do questionário
│   └── TemplateSelector.tsx  # Seleção de modelo de contrato
├── contexts/
│   ├── AuthContext.tsx      # Estado de autenticação e roles do usuário
│   └── ContractContext.tsx  # Estado global do contrato em edição
├── data/                    # Dados estáticos (modelos de contrato em JSON)
├── hooks/                   # Hooks personalizados
├── integrations/
│   └── supabase/            # Cliente Supabase e tipos gerados
├── lib/                     # Utilitários gerais (ex.: cn para Tailwind)
├── pages/
│   ├── Index.tsx            # Página inicial — seleção de template
│   ├── Auth.tsx             # Login e cadastro
│   ├── MeusContratos.tsx    # Histórico de contratos do usuário autenticado
│   ├── MasterDashboard.tsx  # Painel Master — visão geral e templates
│   ├── MasterTemplateEditor.tsx # Editor de modelos de contrato (Master)
│   ├── MasterReview.tsx     # Revisão e aprovação/rejeição de documentos
│   ├── SharedTemplate.tsx   # Visualização de template via link público (/s/:token)
│   └── NotFound.tsx         # Página 404
├── types/                   # Definições de tipos TypeScript
└── utils/                   # Funções utilitárias (geração de PDF, DOCX, etc.)

docs/
├── technical-data-flow.md      # Fluxo de dados e arquitetura técnica
├── template-json-schema.md     # Esquema JSON dos modelos de contrato
├── admin-setup.md              # Configuração de administradores no Supabase
├── deployment.md               # Processo de deploy na Vercel (a criar)
├── review-workflow.md          # Fluxo de revisão Master (a criar)
├── design-system.md            # Sistema de design e tokens visuais (a criar)
└── user-roles-and-flows.md     # Roles de usuário e jornadas detalhadas (a criar)
```

---

## Roles de Usuário

A aplicação possui quatro perfis de acesso, controlados via Supabase (tabela `user_roles`):

| Role | Descrição | Rotas acessíveis |
|---|---|---|
| **Guest** (não autenticado) | Usuário sem conta ou não logado. Pode visualizar a página inicial e templates compartilhados via link público. | `/`, `/auth`, `/s/:token` |
| **User** (autenticado) | Usuário com conta. Pode preencher questionários, gerar documentos e ver seu histórico. | `/`, `/meus-contratos`, `/s/:token` |
| **Admin** | Usuário com role `admin` no Supabase. Acesso expandido dentro da área autenticada. Verificado via RPC `has_role`. | Rotas de User + funcionalidades admin |
| **Master** | Usuário com role `master` no Supabase. Acesso exclusivo ao painel de gestão de templates e revisão de documentos. | `/master`, `/master/template/:templateId`, `/master/review/:documentId` |

> Para instruções sobre como atribuir roles no Supabase, consulte [`docs/admin-setup.md`](docs/admin-setup.md).

---

## Deploy

A aplicação é hospedada na **Vercel**. O arquivo `vercel.json` configura o rewrite de todas as rotas para `index.html`, garantindo que o roteamento client-side funcione corretamente.

Consulte [`docs/deployment.md`](docs/deployment.md) para o passo a passo completo de deploy.

---

## Documentacao

| Documento | Descricao |
|---|---|
| [`docs/technical-data-flow.md`](docs/technical-data-flow.md) | Arquitetura e fluxo de dados da aplicação |
| [`docs/template-json-schema.md`](docs/template-json-schema.md) | Esquema e estrutura dos modelos de contrato em JSON |
| [`docs/admin-setup.md`](docs/admin-setup.md) | Como configurar roles de Admin e Master no Supabase |
| [`docs/deployment.md`](docs/deployment.md) | Processo de deploy e configuração na Vercel |
| [`docs/review-workflow.md`](docs/review-workflow.md) | Fluxo de revisão, aprovação e rejeição de documentos |
| [`docs/design-system.md`](docs/design-system.md) | Sistema de design, tokens de cor e componentes |
| [`docs/user-roles-and-flows.md`](docs/user-roles-and-flows.md) | Detalhamento das jornadas por role de usuário |
