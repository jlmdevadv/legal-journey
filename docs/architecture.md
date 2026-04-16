# Arquitetura do Projeto — Contrato Completo Fácil

## Visão Geral

Aplicação web SPA para geração de contratos jurídicos personalizados. O usuário seleciona um template, responde um questionário guiado (com lógica condicional, sistema de partes e campos repetíveis) e gera o documento final em PDF, DOCX ou TXT.

**Stack principal:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (auth + banco) + shadcn/ui

---

## Árvore de Pastas e Arquivos

```
contrato-completo-facil-02/
├── docs/                          # Documentação técnica do projeto
│   ├── architecture.md            # Este arquivo — arquitetura geral
│   ├── design-system.md           # Tokens e tipografia (Refinado Documental)
│   ├── template-json-schema.md    # Schema JSON de templates de contrato
│   └── (outros arquivos de docs)
│
├── public/                        # Assets estáticos servidos diretamente
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/                           # Código-fonte principal
│   │
│   ├── main.tsx                   # Ponto de entrada — monta <App /> no DOM
│   ├── App.tsx                    # Roteamento principal + providers globais
│   ├── App.css                    # Estilos globais / variáveis CSS
│   ├── vite-env.d.ts              # Declarações de tipo do Vite
│   │
│   ├── pages/                     # Páginas roteadas via React Router
│   │   ├── Index.tsx              # Página inicial — seleção de template e questionário
│   │   ├── Auth.tsx               # Login e cadastro de usuários
│   │   ├── MeusContratos.tsx      # Lista de contratos salvos do usuário logado
│   │   ├── MasterDashboard.tsx    # Painel do Master — gestão de templates e links
│   │   ├── MasterTemplateEditor.tsx # Editor completo de template (campos, texto, versões)
│   │   ├── MasterReview.tsx       # Revisão de documento submetido por usuário
│   │   ├── SharedTemplate.tsx     # Acesso via link compartilhado (/s/:token)
│   │   └── NotFound.tsx           # Página 404
│   │
│   ├── components/                # Componentes reutilizáveis
│   │   │
│   │   ├── ContractForm.tsx       # Formulário legado de preenchimento (não-questionário)
│   │   ├── ContractPreviewModal.tsx # Modal de prévia do contrato gerado
│   │   ├── TemplateSelector.tsx   # Card de seleção de template na tela inicial
│   │   │
│   │   ├── admin/                 # Componentes do painel administrativo (admin/master)
│   │   │   ├── AddTemplateModal.tsx         # Modal para criar novo template
│   │   │   ├── ConditionalClauseHelper.tsx  # UI auxiliar para lógica condicional de cláusulas
│   │   │   ├── FieldConfigModal.tsx         # Modal de configuração detalhada de campo
│   │   │   ├── HelpSectionEditor.tsx        # Editor das seções de ajuda de um campo
│   │   │   ├── RenameTemplateModal.tsx      # Modal para renomear template
│   │   │   ├── SelectionConfirmationModal.tsx # Confirmação de seleção de template para edição
│   │   │   ├── SortableFieldItem.tsx        # Item arrastável de campo (dnd-kit)
│   │   │   ├── SortableFieldList.tsx        # Lista de campos com drag-and-drop
│   │   │   ├── TemplateEditor.tsx           # Editor principal — texto do template com variáveis
│   │   │   ├── TemplateImporter.tsx         # Import de template via JSON
│   │   │   └── TemplateVersionHistory.tsx   # Histórico de versões de um template
│   │   │
│   │   ├── auth/                  # Guards de rota
│   │   │   ├── ProtectedRoute.tsx       # Redireciona para /auth se não autenticado
│   │   │   └── MasterProtectedRoute.tsx # Redireciona se não tiver role 'master'
│   │   │
│   │   ├── contracts/             # Componentes da tela "Meus Contratos"
│   │   │   └── ContractCard.tsx   # Card de contrato salvo (status, ações)
│   │   │
│   │   ├── master/                # Componentes exclusivos do fluxo Master
│   │   │   └── GenerateLinkModal.tsx  # Modal para gerar link compartilhável de template
│   │   │
│   │   ├── questionnaire/         # Componentes do questionário guiado
│   │   │   ├── QuestionnaireWelcome.tsx      # Tela de boas-vindas do questionário
│   │   │   ├── QuestionnaireQuestion.tsx     # Renderiza uma pergunta/campo genérico
│   │   │   ├── QuestionnaireInfoCard.tsx     # Card informativo (type='info')
│   │   │   ├── QuestionnaireHelp.tsx         # Painel lateral de ajuda contextual
│   │   │   ├── PartyNumberQuestion.tsx       # Pergunta: quantas partes principais?
│   │   │   ├── PartyDataCard.tsx             # Formulário de dados de uma parte (PF/PJ)
│   │   │   ├── OtherPartiesNumberQuestion.tsx # Pergunta: quantas outras partes?
│   │   │   ├── OtherPartiesQuestion.tsx      # Formulário de dados das outras partes
│   │   │   ├── LocationDateQuestion.tsx      # Pergunta: cidade, estado e data do contrato
│   │   │   ├── RepeatableFieldCard.tsx       # Campo repetível por parte
│   │   │   └── AnswerTemplatesSelector.tsx   # Seletor de modelos de resposta pré-formatados
│   │   │
│   │   └── ui/                    # Componentes shadcn/ui (Radix primitives + Tailwind)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── button.tsx         # (gerado pelo shadcn)
│   │       ├── calendar.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx         # Toast via sonner
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle.tsx
│   │       ├── toggle-group.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts       # Hook de toast (shadcn)
│   │
│   ├── contexts/                  # React Contexts globais
│   │   ├── AuthContext.tsx        # Autenticação: user, session, isAdmin, isMaster, org
│   │   └── ContractContext.tsx    # Estado do questionário: template, respostas, partes, autosave
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── use-mobile.tsx         # Detecta viewport mobile
│   │   ├── use-toast.ts           # Hook de toast (shadcn)
│   │   ├── useAutoSave.ts         # Autosalvamento periódico no Supabase
│   │   ├── useContractPreviewScroll.ts # Scroll sincronizado na prévia do contrato
│   │   └── useKeyboardSelection.ts     # Navegação por teclado em listas de seleção
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Instância do cliente Supabase (createClient)
│   │       └── types.ts           # Tipos gerados do schema do banco (Database, Tables, Enums)
│   │
│   ├── types/                     # Interfaces TypeScript do domínio
│   │   ├── template.ts            # ContractTemplate, ContractField, PartyData, ConditionalLogic, etc.
│   │   └── document.ts            # DocumentData, DownloadOptions, DocumentFormat
│   │
│   ├── data/
│   │   └── contractTemplates.ts   # Templates padrão hardcoded (fallback local)
│   │
│   ├── utils/                     # Funções utilitárias puras
│   │   ├── conditionalLogic.ts    # Avaliação de lógica condicional (show/hide de campos)
│   │   ├── dateUtils.ts           # Formatação de datas (BR)
│   │   ├── formatters.ts          # Formatação de valores para o documento final
│   │   ├── seedDefaultTemplates.ts # Seed de templates padrão no Supabase
│   │   ├── templateExporter.ts    # Exportação de template como JSON
│   │   ├── templateImporter.ts    # Importação e validação de template JSON
│   │   ├── templateUtils.ts       # Utilitários de manipulação de templates
│   │   ├── validation.ts          # Validação de campos do formulário
│   │   └── versionUtils.ts        # Lógica de versionamento semântico de templates
│   │
│   └── lib/
│       └── utils.ts               # cn() — merge de classes Tailwind (clsx + tailwind-merge)
│
├── .env                           # Variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── .lovable/plan.md               # Plano de produto (Lovable)
├── components.json                # Configuração do shadcn/ui
├── eslint.config.js               # Configuração do ESLint
├── package.json                   # Dependências e scripts
├── postcss.config.js              # PostCSS (autoprefixer)
├── tailwind.config.ts             # Configuração do Tailwind CSS
├── tsconfig.json                  # Configuração do TypeScript
└── vite.config.ts                 # Configuração do Vite
```

---

## Roteamento

| Rota | Componente | Proteção | Descrição |
|------|-----------|----------|-----------|
| `/` | `Index` | Pública | Seleção de template e questionário guiado |
| `/auth` | `Auth` | Pública | Login e cadastro |
| `/meus-contratos` | `MeusContratos` | `ProtectedRoute` (user autenticado) | Lista de contratos salvos |
| `/master` | `MasterDashboard` | `MasterProtectedRoute` (role: master) | Painel de gestão de templates |
| `/master/template/:templateId` | `MasterTemplateEditor` | `MasterProtectedRoute` | Editor de template |
| `/master/review/:documentId` | `MasterReview` | `MasterProtectedRoute` | Revisão de documento submetido |
| `/s/:token` | `SharedTemplate` | Pública (via token) | Acesso por link compartilhado |
| `*` | `NotFound` | Pública | 404 |

---

## Banco de Dados (Supabase / PostgreSQL)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `contract_templates` | Templates de contratos (texto, campos, versão, metadados) |
| `organizations` | Organizações dos usuários Master |
| `party_types` | Tipos de partes (Contratante, Contratado, Fiador, etc.) |
| `profiles` | Perfil público dos usuários (nome, avatar, telefone) |
| `saved_contracts` | Contratos em andamento ou finalizados pelos usuários |
| `share_links` | Links temporários gerados pelo Master para acesso externo |
| `user_roles` | Roles dos usuários: `user`, `admin`, `master` |
| `contract_events` | Histórico imutável de eventos por contrato (criação, acesso, envio, revisão) |

### Funções RPC

| Função | Descrição |
|--------|-----------|
| `get_user_role()` | Retorna a role do usuário autenticado |
| `get_user_organization()` | Retorna organização do usuário |
| `has_role(_role, _user_id)` | Verifica se usuário tem determinada role |
| `is_master(_user_id?)` | Verifica se usuário é master |
| `promote_user_to_admin(email)` | Promove usuário a admin |
| `create_master_account(org_name, email)` | Cria conta master com organização |
| `validate_share_link(token)` | Valida token de link compartilhado |

---

## Papéis de Usuário

| Role | Acesso |
|------|--------|
| `user` | Questionário, salvar contratos, baixar documentos |
| `admin` | Idem + gestão de templates da organização |
| `master` | Idem + dashboard master, editor de templates, geração de links, revisão |

---

## Fluxo Principal (Questionário)

```
Index
 └── TemplateSelector           → usuário escolhe template
      └── ContractContext        → carrega template selecionado
           └── QuestionnaireWelcome
                └── PartyNumberQuestion     → quantas partes principais?
                     └── PartyDataCard (× N) → dados de cada parte (PF ou PJ)
                          └── OtherPartiesNumberQuestion → outras partes?
                               └── OtherPartiesQuestion (× M)
                                    └── QuestionnaireQuestion (campos do template)
                                         └── LocationDateQuestion → cidade/estado/data
                                              └── ContractPreviewModal → prévia + download
```

---

## Principais Dependências

| Pacote | Uso |
|--------|-----|
| `react-router-dom` | Roteamento SPA |
| `@supabase/supabase-js` | Backend (auth, banco, RPC) |
| `@tanstack/react-query` | Cache e fetching de dados |
| `@dnd-kit/core` + `sortable` | Drag-and-drop de campos no editor |
| `react-hook-form` + `zod` | Formulários e validação |
| `docx` | Geração de arquivos .docx |
| `jspdf` + `html2canvas` | Geração de PDF |
| `date-fns` | Manipulação de datas |
| `sonner` | Notificações toast |
| `tailwindcss` + `shadcn/ui` | UI e design system |
| `lucide-react` | Ícones |
| `dompurify` | Sanitização de HTML no editor de templates (prevenção de XSS) |
