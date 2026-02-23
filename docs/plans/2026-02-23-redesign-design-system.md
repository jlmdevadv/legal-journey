# Design System Redesign — Refinado Documental

**Data:** 2026-02-23
**Status:** Aprovado
**Escopo:** Design system completo — tokens, componentes globais, layouts de página, responsividade

---

## 1. Direção Estética

**Conceito:** Corporativo Minimalista com identidade Documental.

O produto serve dois públicos simultâneos:
- **Profissionais jurídicos** (advogados, departamentos legais) — precisam sentir credibilidade e autoridade institucional imediatamente.
- **Usuários não-juristas** preenchendo contratos — precisam de clareza, fluidez e baixa carga cognitiva.

A estética "Refinado Documental" atende os dois: tipografia serifada elegante transmite autoridade ao profissional, enquanto o layout limpo e espaçoso reduz a intimidação para o usuário leigo.

**Diferencial vs. design atual:** O design atual usa tokens shadcn-ui padrão (azul genérico, Inter implícita, bordas arredondadas) — característico de projetos Lovable. O redesign substitui isso por uma identidade própria com paleta documental, tipografia intencional e vocabulário formal.

---

## 2. Tokens de Design

### 2.1 Tipografia

| Papel | Família | Fonte Google Fonts |
|---|---|---|
| Display / Headings | **DM Serif Display** | `DM+Serif+Display` |
| UI / Corpo / Botões | **DM Sans** | `DM+Sans:ital,opsz,wght@0,9..40,300..700` |

**Escala tipográfica:**

| Token | Família | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `text-display` | DM Serif Display | 32px / lh 1.2 | 400 | Títulos de página principais |
| `text-h2` | DM Serif Display | 24px / lh 1.3 | 400 | Subtítulos de seção |
| `text-h3` | DM Serif Display | 18px / lh 1.4 | 400 | CardTitle, headings menores |
| `text-body` | DM Sans | 14px / lh 1.6 | 400 | Texto corrido, parágrafos |
| `text-body-md` | DM Sans | 15px / lh 1.6 | 400 | Corpo em contextos de destaque |
| `text-label` | DM Sans | 11px / lh 1.4 | 500 | Labels uppercase, headers de tabela |
| `text-small` | DM Sans | 12px / lh 1.5 | 400 | Metadados, datas, texto auxiliar |
| `text-button` | DM Sans | 14px / lh 1 | 500 | Botões, ações |

Labels e headers de tabela usam `text-transform: uppercase; letter-spacing: 0.07em`.

### 2.2 Paleta de Cores (CSS Variables)

```css
:root {
  /* Superfícies */
  --background:        #F7F5F0;  /* pergaminho — fundo geral */
  --surface:           #FDFCF9;  /* cards, modais, surfaces elevadas */
  --surface-secondary: #EDE8DF;  /* hover sutil, backgrounds secundários */

  /* Texto */
  --foreground:        #1A1A1A;  /* tinta — texto principal */
  --muted-foreground:  #6B6260;  /* texto secundário, metadados */
  --subtle-foreground: #9E9894;  /* placeholders, texto desabilitado */

  /* Primary — Azul Marinho */
  --primary:           #1B3A5C;
  --primary-foreground:#F7F5F0;
  --primary-hover:     #152D47;

  /* Bordas */
  --border:            #D5CEC4;  /* bordas de cards, inputs */
  --border-strong:     #B8B0A6;  /* divisores com mais peso */

  /* Accent — Dourado discreto */
  --accent:            #C8A96E;
  --accent-subtle:     rgba(200, 169, 110, 0.15);

  /* Status */
  --status-approved:   #2D6A4F;  /* verde floresta */
  --status-approved-bg:rgba(45, 106, 79, 0.10);
  --status-pending:    #7D5A1E;  /* âmbar escuro */
  --status-pending-bg: rgba(125, 90, 30, 0.10);
  --status-draft:      #5A5A5A;
  --status-draft-bg:   rgba(90, 90, 90, 0.08);
  --status-rejected:   #9B2335;  /* vinho */
  --status-rejected-bg:rgba(155, 35, 53, 0.10);

  /* Destructive */
  --destructive:       #9B2335;
  --destructive-foreground: #FDFCF9;

  /* Ring / Focus */
  --ring:              #1B3A5C;
}
```

### 2.3 Radius e Bordas

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `2px` | Badges, tags |
| `--radius` | `4px` | Cards, inputs, botões — padrão |
| `--radius-lg` | `8px` | Modais, dropdowns |

Cards usam `border: 1px solid var(--border)` sem box-shadow. Profundidade é criada por diferença de cor entre background e surface.

### 2.4 Sombras

Uso mínimo. Apenas para elementos flutuantes (modais, dropdowns):
```css
--shadow-sm: 0 1px 3px rgba(26, 26, 26, 0.08);
--shadow-md: 0 4px 12px rgba(26, 26, 26, 0.10);
```

### 2.5 Espaçamento e Container

- Container max-width: `1200px` (reduzido de 1400px para melhor densidade documental)
- Padding horizontal desktop: `32px`
- Padding horizontal mobile: `16px`
- Gap entre seções de página: `40px`
- Gap interno de cards: `24px`

---

## 3. Componentes Globais

### 3.1 Navbar

- **Fundo:** `--surface` com `border-bottom: 1px solid var(--border)`
- **Logo:** Nome em DM Serif Display, cor `--foreground`
- **Links:** DM Sans 14px, `--muted-foreground`, hover → `--foreground` com transição `150ms`
- **Avatar:** Círculo `32px`, fundo `--primary`, inicial em branco, DM Sans 13px bold
- **Mobile:** Hambúrguer icon; drawer lateral `280px` com `--surface` bg, mesmo estilo de links

### 3.2 Botões

Todos: `border-radius: var(--radius)`, `font-family: DM Sans`, `font-size: 14px`, `font-weight: 500`, `padding: 10px 20px`, `transition: all 150ms ease`.

| Variante | Background | Border | Texto | Hover |
|---|---|---|---|---|
| `default` (primary) | `--primary` | none | `--primary-foreground` | `--primary-hover` bg |
| `secondary` | transparent | `1px solid --border` | `--foreground` | `--surface-secondary` bg |
| `ghost` | transparent | none | `--muted-foreground` | `--surface-secondary` bg + `--foreground` texto |
| `destructive` | `--destructive` | none | `--destructive-foreground` | escurece 8% |
| `outline` (primary) | transparent | `1px solid --primary` | `--primary` | `--primary` bg + `--primary-foreground` texto |

Tamanho `sm`: `padding: 6px 14px`, `font-size: 13px`.
Tamanho `lg`: `padding: 13px 28px`, `font-size: 15px`.

### 3.3 Inputs e Textarea

```
Label (DM Sans 11px uppercase tracking)
┌─────────────────────────────────────┐
│  Placeholder em --subtle-foreground │
└─────────────────────────────────────┘
  border: 1px solid --border
  border-radius: 4px
  background: --surface
  focus: outline 2px solid --primary, outline-offset: 0
```

- `HelpText` abaixo: DM Sans 12px, `--muted-foreground`
- Estado de erro: borda `--destructive`, texto de erro abaixo em `--destructive`

### 3.4 Cards

- Fundo: `--surface`
- Borda: `1px solid var(--border)`
- Radius: `4px`
- `CardHeader`: `padding: 20px 24px`, `border-bottom: 1px solid var(--border)`
- `CardTitle`: DM Serif Display 18px, `--foreground`
- `CardContent`: `padding: 24px`

### 3.5 Badges de Status

| Status | Texto | Background | Border |
|---|---|---|---|
| `draft` | Rascunho | `--status-draft-bg` | `1px solid rgba(--status-draft, 0.2)` |
| `pending_review` | Pendente | `--status-pending-bg` | `1px solid rgba(--status-pending, 0.2)` |
| `approved` | Aprovado | `--status-approved-bg` | `1px solid rgba(--status-approved, 0.2)` |
| `rejected` | Reprovado | `--status-rejected-bg` | `1px solid rgba(--status-rejected, 0.2)` |

Todos: DM Sans 11px uppercase, `letter-spacing: 0.06em`, `border-radius: 2px`, `padding: 3px 8px`.

### 3.6 Tabelas

- Header: DM Sans 11px uppercase, `--muted-foreground`, sem fundo distinto
- Separador: `border-bottom: 1px solid var(--border)` em cada row
- Row hover: `background: var(--surface-secondary)`, transição `100ms`
- Coluna de ações: botões `ghost` `sm` alinhados à direita

---

## 4. Layouts de Página

### 4.1 MasterDashboard

**Estrutura:**
```
Navbar
└── Container (max 1200px)
    ├── Section: Templates
    │   ├── Heading "Templates" + botão "+ Novo template"
    │   └── Grid 3 colunas → cards de template
    │       └── Card: nome, contagem de documentos, [Gerar Link] [Editar]
    └── Section: Documentos
        ├── Heading "Documentos" + filtro de status (select)
        └── Tabela: Nome | Template | Status | Enviado em | Ações
```

- Seções separadas por `margin-top: 48px` e `heading + border-bottom`
- Grid de templates: `grid-template-columns: repeat(3, 1fr)` desktop, `1fr` mobile
- Sem abas (Tabs) — substituído por seções explícitas

### 4.2 Questionnaire / SharedQuestionnaireContainer

**Estrutura:**
```
Navbar
Banner "Preenchendo para [Org] · [Template]"
└── Container (max 1200px)
    └── Split layout 50/50
        ├── Painel esquerdo: Formulário
        │   ├── Progress indicator: "Pergunta X de Y" + barra --primary
        │   ├── Campo atual com label, input, helpText
        │   └── Navegação: [← Anterior] ... [Próximo →]
        └── Painel direito: ContractPreview
            └── Paper creme, fonte DM Serif, scroll próprio, sticky
```

- Barra de progresso: `height: 3px`, `background: --primary`, `border-radius: 0`
- Preview com fundo `--surface`, `border: 1px solid --border`, `font-family: DM Serif Display` para headings do contrato
- Botão "Enviar para revisão" aparece somente na última etapa em destaque `outline primary`

### 4.3 MasterReview

**Estrutura:**
```
Navbar
└── Container (max 800px — mais estreito, foco no documento)
    ├── Breadcrumb: ← Voltar ao painel
    ├── Header: [Nome do documento] [Badge status]
    │   └── Metadados: template, data de envio
    ├── Card: Documento Gerado
    │   └── Scroll interno max-h 500px, estilo paper
    ├── Textarea: Observações da revisão
    └── Action row: [Reprovar] ──────────── [Aprovar ✓]
```

- Container mais estreito (`max-width: 800px`) concentra a leitura
- Documento em card com `overflow-y: auto`, `max-height: 500px`
- Em mobile: botões de ação em sticky bottom bar

---

## 5. Responsividade

### Breakpoints

| Nome | Range | Comportamento geral |
|---|---|---|
| `mobile` | `< 640px` | 1 coluna, navbar hambúrguer, tabelas → cards |
| `tablet` | `640–1024px` | 2 colunas, questionnaire em abas |
| `desktop` | `> 1024px` | Layout completo |

### Regras por Componente

**Navbar:**
- `< 640px`: links colapsados em drawer lateral; hambúrguer button `44x44px`

**MasterDashboard:**
- Grid templates: `3 colunas` → `2 colunas (tablet)` → `1 coluna (mobile)`
- Tabela de documentos: em mobile transforma cada row em card empilhado com nome + badge + data + botão "Ver"

**Questionnaire:**
- `> 1024px`: side-by-side 50/50
- `640–1024px`: abas "Formulário" / "Prévia"
- `< 640px`: apenas formulário; FAB flutuante "👁 Ver prévia" abre bottom sheet

**MasterReview:**
- Em mobile: botões "Reprovar" / "Aprovar" fixos na barra inferior (`position: sticky bottom`)

**Princípios gerais:**
- Touch targets mínimos: `44px` de altura em todos elementos interativos mobile
- Nenhuma informação escondida no mobile — reorganizada verticalmente
- Padding de formulários mobile: `24px` horizontal para respiração generosa

---

## 6. Plano de Implementação (alto nível)

1. **Tokens** — Atualizar `src/index.css` (CSS variables) e `tailwind.config.ts`
2. **Fontes** — Adicionar DM Serif Display + DM Sans via `index.html` (Google Fonts)
3. **Componentes shadcn** — Sobrescrever estilos de `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Table` nos arquivos de componente em `src/components/ui/`
4. **Navbar** — Refatorar `src/components/Navbar.tsx` com novo estilo + mobile drawer
5. **MasterDashboard** — Redesenhar `src/pages/MasterDashboard.tsx`
6. **Questionnaire** — Redesenhar `src/components/QuestionnaireForm.tsx` + `SharedQuestionnaireContainer.tsx`
7. **MasterReview** — Redesenhar `src/pages/MasterReview.tsx`
8. **ContractPreview** — Ajustar estilo do paper do contrato
9. **Demais páginas** — Auth, MeusContratos, MasterTemplateEditor, SharedTemplate
