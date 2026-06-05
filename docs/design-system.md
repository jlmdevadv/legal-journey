# Design System — Refinado Documental

**Projeto:** Legal Journey — Documentos Jurídicos Inteligentes
**Versão do sistema:** 1.0
**Última atualização:** 2026-02-23

---

## 1. Visão Geral

O **Refinado Documental** é o design system do Legal Journey. Seu conceito central é _Corporativo Minimalista com identidade Documental_.

### Filosofia visual

O produto serve dois públicos simultâneos:

- **Profissionais jurídicos** (advogados, departamentos legais): precisam sentir credibilidade e autoridade institucional imediatamente.
- **Usuários não-juristas** preenchendo contratos: precisam de clareza, fluidez e baixa carga cognitiva.

A estética "Refinado Documental" atende os dois: tipografia serifada elegante transmite autoridade ao profissional, enquanto o layout limpo e espaçoso reduz a intimidação para o usuário leigo.

### Diferencial

O design sistema substitui os tokens genéricos do shadcn-ui (azul padrão, Inter implícita, bordas muito arredondadas) por uma identidade própria com:

- Paleta documental baseada em tons de pergaminho e azul marinho.
- Tipografia intencional com par DM Serif Display + DM Sans.
- Raio de borda mínimo (`4px`) para um vocabulário formal.
- Profundidade criada por diferença de cor entre superfícies, sem uso excessivo de sombras.

---

## 2. Tokens de Cor

Todos os tokens são definidos como propriedades CSS customizadas em `src/index.css` e mapeados para o Tailwind em `tailwind.config.ts`. Não há modo escuro — o tema é sempre claro (documental).

### 2.1 Superfícies

| Variável CSS            | Valor HSL            | Hex aproximado | Uso                                 |
|-------------------------|----------------------|----------------|-------------------------------------|
| `--background`          | `36 25% 95%`         | `#F7F5F0`      | Fundo geral da página (pergaminho)  |
| `--surface`             | `40 33% 99%`         | `#FDFCF9`      | Cards, modais, superfícies elevadas |
| `--surface-secondary`   | `34 22% 91%`         | `#EDE8DF`      | Hover sutil, backgrounds secundários |

### 2.2 Texto

| Variável CSS            | Valor HSL            | Hex aproximado | Uso                                  |
|-------------------------|----------------------|----------------|--------------------------------------|
| `--foreground`          | `0 0% 10%`           | `#1A1A1A`      | Texto principal (tinta)              |
| `--muted-foreground`    | `12 5% 40%`          | `#6B6260`      | Texto secundário, metadados          |
| `--subtle-foreground`   | `20 4% 61%`          | `#9E9894`      | Placeholders, texto desabilitado     |

### 2.3 Primária — Azul Marinho

| Variável CSS              | Valor HSL            | Hex aproximado | Uso                                  |
|---------------------------|----------------------|----------------|--------------------------------------|
| `--primary`               | `210 55% 23%`        | `#1B3A5C`      | Botão principal, links, foco         |
| `--primary-foreground`    | `36 25% 95%`         | `#F7F5F0`      | Texto sobre fundo primary            |
| `--ring`                  | `210 55% 23%`        | `#1B3A5C`      | Outline de foco (alias de primary)   |

### 2.4 Secundária e Muted

| Variável CSS                  | Valor HSL     | Hex aproximado | Uso                               |
|-------------------------------|---------------|----------------|-----------------------------------|
| `--secondary`                 | `34 22% 91%`  | `#EDE8DF`      | Botão secondary, backgrounds      |
| `--secondary-foreground`      | `0 0% 10%`    | `#1A1A1A`      | Texto sobre secondary             |
| `--muted`                     | `34 22% 91%`  | `#EDE8DF`      | Alias de secondary (shadcn)       |

### 2.5 Acento — Dourado

| Variável CSS           | Valor HSL / hex              | Hex aproximado | Uso                              |
|------------------------|------------------------------|----------------|----------------------------------|
| `--accent`             | `38 51% 60%`                 | `#C8A96E`      | Destaques, sidebar ring, icones  |
| `--accent-foreground`  | `0 0% 10%`                   | `#1A1A1A`      | Texto sobre fundo accent         |

### 2.6 Destrutivo — Vinho

| Variável CSS                    | Valor HSL     | Hex aproximado | Uso                                |
|---------------------------------|---------------|----------------|------------------------------------|
| `--destructive`                 | `350 63% 37%` | `#9B2335`      | Botão de exclusão/rejeição         |
| `--destructive-foreground`      | `40 33% 99%`  | `#FDFCF9`      | Texto sobre fundo destrutivo       |

### 2.7 Bordas e Inputs

| Variável CSS  | Valor HSL     | Hex aproximado | Uso                              |
|---------------|---------------|----------------|----------------------------------|
| `--border`    | `30 15% 81%`  | `#D5CEC4`      | Bordas de cards, inputs, divisores |
| `--input`     | `30 15% 81%`  | `#D5CEC4`      | Alias de border para inputs        |

### 2.8 Tokens de Status (hex direto)

Estes tokens usam hex direto (não HSL) e são aplicados via classes utilitárias `.badge-*` ou inline:

| Variável CSS              | Valor hex                     | Uso                          |
|---------------------------|-------------------------------|------------------------------|
| `--status-approved`       | `#2D6A4F`                     | Verde floresta — aprovado    |
| `--status-approved-bg`    | `rgba(45,106,79,0.10)`        | Fundo do badge aprovado      |
| `--status-pending`        | `#7D5A1E`                     | Âmbar escuro — pendente      |
| `--status-pending-bg`     | `rgba(125,90,30,0.10)`        | Fundo do badge pendente      |
| `--status-draft`          | `#5A5A5A`                     | Cinza neutro — rascunho      |
| `--status-draft-bg`       | `rgba(90,90,90,0.08)`         | Fundo do badge rascunho      |
| `--status-rejected`       | `#9B2335`                     | Vinho — reprovado            |
| `--status-rejected-bg`    | `rgba(155,35,53,0.10)`        | Fundo do badge reprovado     |

### 2.9 Sombras

| Variável CSS   | Valor                                        | Uso                              |
|----------------|----------------------------------------------|----------------------------------|
| `--shadow-sm`  | `0 1px 3px rgba(26,26,26,0.08)`              | Elementos levemente elevados     |
| `--shadow-md`  | `0 4px 12px rgba(26,26,26,0.10)`             | Modais, dropdowns flutuantes     |

Sombras devem ser usadas com moderação. A profundidade visual primária é criada pela diferença entre `--background` (pergaminho) e `--surface` (quase branco).

### 2.10 Sidebar

| Variável CSS                      | Mapeamento                   | Uso                                    |
|-----------------------------------|------------------------------|----------------------------------------|
| `--sidebar-background`            | `210 55% 23%` (= primary)    | Fundo da sidebar — azul marinho        |
| `--sidebar-foreground`            | `36 25% 95%` (= pergaminho)  | Texto da sidebar                       |
| `--sidebar-primary`               | `38 51% 60%` (= accent)      | Itens ativos na sidebar                |
| `--sidebar-primary-foreground`    | `0 0% 10%`                   | Texto sobre item ativo                 |
| `--sidebar-accent`                | `210 45% 30%`                | Hover nos itens da sidebar             |
| `--sidebar-accent-foreground`     | `36 25% 95%`                 | Texto sobre hover da sidebar           |
| `--sidebar-border`                | `210 45% 30%`                | Divisores da sidebar                   |
| `--sidebar-ring`                  | `38 51% 60%` (= accent)      | Foco dentro da sidebar                 |

---

## 3. Tipografia

### 3.1 Fontes carregadas

As fontes são carregadas via Google Fonts no `index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Serif+Display:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

| Família            | Tipo    | Variações carregadas                  | Token Tailwind        |
|--------------------|---------|---------------------------------------|-----------------------|
| **DM Sans**        | Sans-serif | peso 300–700, itálico, optical size 9–40 | `font-sans`      |
| **DM Serif Display** | Serif | regular (400), itálico               | `font-serif`          |

### 3.2 Aplicação das fontes

No `src/index.css`:

```css
body {
  font-family: 'DM Sans', sans-serif;  /* toda a UI */
  font-size: 14px;
  line-height: 1.6;
}

h1, h2, h3 {
  font-family: 'DM Serif Display', serif;  /* headings */
  font-weight: 400;
}
```

No `tailwind.config.ts`:

```ts
fontFamily: {
  sans:  ['DM Sans', 'sans-serif'],
  serif: ['DM Serif Display', 'serif'],
},
```

### 3.3 Escala tipográfica

| Token (conceitual) | Família             | Tamanho     | Peso | Uso                                       |
|--------------------|---------------------|-------------|------|-------------------------------------------|
| `text-display`     | DM Serif Display    | 32px / lh 1.2 | 400  | Títulos de página principais              |
| `text-h2`          | DM Serif Display    | 24px / lh 1.3 | 400  | Subtítulos de seção                       |
| `text-h3`          | DM Serif Display    | 18px / lh 1.4 | 400  | CardTitle, headings menores               |
| `text-body`        | DM Sans             | 14px / lh 1.6 | 400  | Texto corrido, parágrafos                 |
| `text-body-md`     | DM Sans             | 15px / lh 1.6 | 400  | Corpo em contextos de destaque            |
| `text-label`       | DM Sans             | 11px / lh 1.4 | 500  | Labels uppercase, headers de tabela       |
| `text-small`       | DM Sans             | 12px / lh 1.5 | 400  | Metadados, datas, texto auxiliar          |
| `text-button`      | DM Sans             | 14px / lh 1   | 500  | Botões, ações                             |

Labels e cabeçalhos de tabela usam `text-transform: uppercase; letter-spacing: 0.07em`.

### 3.4 Estilo documental (contrato)

O papel do contrato usa DM Serif Display para o corpo do texto, reforçando o aspecto de documento formal:

```css
/* src/index.css */
.contract-paper {
  background-color: #FDFCF9;       /* = --surface */
  font-family: 'DM Serif Display', serif;
  font-size: 14px;
  line-height: 1.8;
  padding: 40px 48px;
  color: #1A1A1A;                  /* = --foreground */
}

.contract-field {
  color: #1B3A5C;                  /* = --primary */
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}
```

---

## 4. Componentes-Chave

### 4.1 Button

Definido em `src/components/ui/button.tsx` usando `class-variance-authority`.

**Estilos base (aplicados em todas as variantes):**

```
inline-flex items-center justify-center gap-2
whitespace-nowrap text-sm font-medium
transition-colors duration-150
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
disabled:pointer-events-none disabled:opacity-50
```

#### Variantes

| Variante          | Fundo                   | Borda                    | Texto                    | Hover                             |
|-------------------|-------------------------|--------------------------|--------------------------|-----------------------------------|
| `default`         | `bg-primary`            | nenhuma                  | `text-primary-foreground`| `bg-primary/90`                   |
| `destructive`     | `bg-destructive`        | nenhuma                  | `text-destructive-foreground` | `bg-destructive/90`          |
| `outline`         | `bg-transparent`        | `border border-border`   | `text-foreground`        | `bg-surface-secondary`            |
| `secondary`       | `bg-transparent`        | `border border-border`   | `text-foreground`        | `bg-surface-secondary`            |
| `ghost`           | `bg-transparent`        | nenhuma                  | `text-muted-foreground`  | `bg-surface-secondary text-foreground` |
| `link`            | nenhum                  | nenhuma                  | `text-primary`           | sublinhado                        |
| `outline-primary` | `bg-transparent`        | `border border-primary`  | `text-primary`           | `bg-primary text-primary-foreground` |

**Nota:** `outline` e `secondary` são visualmente idênticos — ambos usam `border-border` com `bg-transparent`. A distinção semântica é mantida para consistência com o shadcn-ui.

#### Tamanhos

| Size      | Altura | Padding horizontal | Font size |
|-----------|--------|--------------------|-----------|
| `default` | `h-10` | `px-5`             | `text-sm` (14px) |
| `sm`      | `h-8`  | `px-3.5`           | `text-xs` (12px) |
| `lg`      | `h-11` | `px-7`             | `text-base` (16px) |
| `icon`    | `h-10 w-10` | —             | herda     |

#### Exemplos de uso

```tsx
// Ação principal
<Button>Criar Documento</Button>

// Ação destrutiva
<Button variant="destructive">Reprovar</Button>

// Ação secundária / neutra
<Button variant="outline">Cancelar</Button>

// Navegação / retorno
<Button variant="ghost">
  <ArrowLeft className="w-4 h-4 mr-2" />
  Voltar ao Painel
</Button>

// Destaque sem preenchimento (ex: "Enviar para revisão")
<Button variant="outline-primary">Enviar para Revisão</Button>

// Tamanho pequeno (ex: em tabelas)
<Button variant="ghost" size="sm">Editar</Button>
```

### 4.2 Card

Usado como container principal de conteúdo. Fundo `--surface` (`#FDFCF9`) sobre o fundo de pergaminho `--background` cria a diferença de profundidade.

**Estrutura padrão:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título da Seção</CardTitle>
  </CardHeader>
  <CardContent>
    {/* conteúdo */}
  </CardContent>
</Card>
```

**Propriedades visuais:**

| Propriedade      | Valor                         |
|------------------|-------------------------------|
| Fundo            | `--surface` (`#FDFCF9`)       |
| Borda            | `1px solid var(--border)`     |
| Raio             | `4px` (`--radius`)            |
| CardHeader       | `padding: 20px 24px`, com `border-bottom: 1px solid var(--border)` |
| CardTitle        | DM Serif Display 18px, `--foreground` |
| CardContent      | `padding: 24px`               |

**Variação — papel de contrato (dentro do Card):**

Na página `MasterReview`, o documento gerado é exibido dentro de um `Card` com a classe `.contract-paper`:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Prévia do Documento</CardTitle>
  </CardHeader>
  <CardContent>
    <div
      className="contract-paper rounded border border-border max-h-[60vh] sm:max-h-[500px] overflow-y-auto whitespace-pre-wrap break-words text-sm"
      dangerouslySetInnerHTML={{ __html: document.generated_document }}
    />
  </CardContent>
</Card>
```

Isso cria o "papel de pergaminho" dentro do card: fundo `#FDFCF9`, fonte DM Serif Display, espaçamento generoso e scroll interno limitado a `500px` no desktop.

### 4.3 Badges de Status

| Classe CSS      | Variante      | Label        | Cor de texto        | Fundo                          |
|-----------------|---------------|--------------|---------------------|--------------------------------|
| `.badge-approved` | `approved`  | Aprovado     | `--status-approved` (`#2D6A4F`) | `--status-approved-bg` |
| `.badge-pending`  | `pending`   | Pendente     | `--status-pending`  (`#7D5A1E`) | `--status-pending-bg`  |
| `.badge-draft`    | `draft`     | Rascunho     | `--status-draft`    (`#5A5A5A`) | `--status-draft-bg`    |
| `.badge-rejected` | `rejected`  | Reprovado    | `--status-rejected` (`#9B2335`) | `--status-rejected-bg` |

Todos os badges usam: DM Sans 11px uppercase, `letter-spacing: 0.06em`, `border-radius: 2px`, `padding: 3px 8px`.

### 4.4 Inputs e Textarea

**Estrutura visual:**

```
Label (DM Sans 11px uppercase, letter-spacing 0.07em)
┌─────────────────────────────────────────────────────┐
│  Placeholder em --subtle-foreground (#9E9894)       │
└─────────────────────────────────────────────────────┘
  border: 1px solid --border (#D5CEC4)
  border-radius: 4px
  background: --surface (#FDFCF9)
  focus: ring-2 ring-ring (= --primary #1B3A5C)
```

- Texto auxiliar abaixo: DM Sans 12px, `--muted-foreground`
- Estado de erro: borda `--destructive`, mensagem de erro abaixo em `--destructive`

---

## 5. Padrões de Layout

### 5.1 Container Base

Definido no `tailwind.config.ts`:

```ts
container: {
  center: true,
  padding: '1.5rem',
  screens: { '2xl': '1200px' }
}
```

Uso padrão: `<main className="container mx-auto px-4 py-8">`.

### 5.2 Layout do Questionário (Questionnaire)

Usado em `SharedQuestionnaireContainer`. Split 50/50 no desktop:

```
Navbar
Banner "Preenchendo para [Org] · [Template]"
└── Container (max 1200px)
    └── Grid 50/50
        ├── Painel esquerdo: Formulário
        │   ├── Indicador de progresso: barra 3px, cor --primary
        │   ├── Campo atual (label + input + helpText)
        │   └── Navegação: [← Anterior] ... [Próximo →]
        └── Painel direito: ContractPreview (sticky)
            └── Fundo --surface, fonte DM Serif, scroll próprio
```

- Barra de progresso: `height: 3px`, `background: --primary`, `border-radius: 0`
- Botão "Enviar para revisão" aparece somente na última etapa, variante `outline-primary`
- Em tablet (640–1024px): substituído por abas "Formulário" / "Prévia"
- Em mobile (< 640px): apenas formulário; botão flutuante "Ver prévia" abre bottom sheet

### 5.3 Layout de Revisão (MasterReview)

Container estreito para foco na leitura do documento:

```tsx
<main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
```

Estrutura:

```
Navbar
└── Container (max-w-3xl = ~768px)
    ├── Botão "Voltar ao Painel" (ghost)
    ├── Card: informações do documento + Badge de status
    ├── Card: Prévia do documento (.contract-paper, max-h-[500px] com scroll)
    ├── Card: Observações (Textarea)
    └── Card: Ações de revisão [Aprovar] [Reprovar]
```

Em mobile: botões "Aprovar" / "Reprovar" ficam fixos na barra inferior.

### 5.4 Layout do Dashboard Unificado (/dashboard)

O `/dashboard` é a página principal dos usuários autenticados. Usa layout de seções empilhadas verticalmente dentro do container padrão:

```
Navbar
└── Container (max 1200px)
    ├── Heading de página (DM Serif Display 32px)
    ├── StatsBar — métricas resumidas em linha
    ├── ContratosPropriosSection — contratos do usuário
    ├── MeusModelosSection — templates da org (apenas Master)
    ├── DocumentosRecebidosSection — documentos de organizações
    ├── PartyRegistrySection — cadastro de partes (todos os autenticados)
    └── DocumentosCompartilhadosSection — documentos da org (apenas Master)
```

- Seções separadas por `margin-top: 48px` com `heading + border-bottom`
- `StatsBar` exibe contadores horizontais no desktop; empilha verticalmente no mobile
- `PartyRegistrySection` disponível para todos os usuários autenticados (não apenas Master)

### 5.4.1 Layout do MasterDashboard (/master)

O painel exclusivo do Master em `/master` mantém um layout focado em gestão:

```
Navbar
└── Container (max 1200px)
    ├── Seção: Templates
    │   ├── Heading + botão "Novo Modelo"
    │   └── Lista de templates com ações (editar, gerar link, excluir)
    └── Seção: Documentos
        ├── Heading + filtro de status
        └── Tabela: Nome | Template | Status | Enviado em | Ações
```

- Tabela em mobile: cada linha vira um card empilhado
- Botão "Novo Modelo" abre o `ContentModal` → `TemplateWizard` (6 passos)

### 5.5 Responsividade

| Breakpoint | Range       | Comportamento                                          |
|------------|-------------|--------------------------------------------------------|
| `mobile`   | `< 640px`   | 1 coluna, navbar hambúrguer, tabelas viram cards       |
| `tablet`   | `640–1024px`| 2 colunas, questionnaire usa abas                     |
| `desktop`  | `> 1024px`  | Layout completo, split 50/50 no questionário           |

Touch targets mínimos: `44px` de altura em todos os elementos interativos no mobile.

---

## 6. Uso no Código

### 6.1 Aplicando cores via Tailwind

Os tokens CSS são mapeados diretamente para classes Tailwind. Exemplos práticos:

```tsx
// Fundo de página (pergaminho)
<div className="bg-background" />

// Card / superfície elevada
<div className="bg-surface border border-border rounded" />

// Hover sutil
<div className="hover:bg-surface-secondary" />

// Texto principal
<p className="text-foreground" />

// Texto secundário
<p className="text-muted-foreground" />

// Cor primária (azul marinho)
<span className="text-primary" />
<div className="bg-primary text-primary-foreground" />

// Acento dourado
<span className="text-accent" />

// Borda padrão
<div className="border border-border" />
```

### 6.2 Tipografia

```tsx
// Heading de página (DM Serif Display via h1/h2/h3 automático)
<h1>Título Principal</h1>

// Forçar fonte serif em outro elemento
<p className="font-serif text-xl">Título de destaque</p>

// Texto de UI padrão (DM Sans — já é o padrão do body)
<p className="text-sm">Texto de interface</p>

// Label uppercase
<label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
  Campo obrigatório
</label>

// Metadado / data
<span className="text-xs text-muted-foreground">Enviado em 01/03/2026</span>
```

### 6.3 Papel do contrato

Para exibir o conteúdo gerado de um contrato com estilo documental:

```tsx
<div className="contract-paper rounded border border-border overflow-y-auto">
  {/* HTML do contrato */}
</div>
```

Para campos preenchidos pelo usuário dentro do contrato (destaque em azul marinho):

```tsx
<span className="contract-field">{valorPreenchido}</span>
```

### 6.4 Badges de status

```tsx
// Via classe utilitária CSS (src/index.css)
<span className="badge-approved px-2 py-0.5 rounded-sm text-xs uppercase tracking-wider">
  Aprovado
</span>

// Via componente Badge (src/components/ui/badge.tsx)
<Badge variant="approved">Aprovado</Badge>
<Badge variant="pending">Pendente</Badge>
<Badge variant="draft">Rascunho</Badge>
<Badge variant="rejected">Reprovado</Badge>
```

### 6.5 Sombras (uso restrito)

Sombras devem ser aplicadas apenas em elementos flutuantes:

```tsx
// Apenas em modais, dropdowns, tooltips
<div style={{ boxShadow: 'var(--shadow-md)' }} />
```

No Tailwind, prefer as classes nativas (`shadow-sm`, `shadow-md`) somente quando os valores do design system coincidem. Caso contrário, use a variável CSS diretamente.

### 6.6 Raio de borda

```tsx
// Padrão (4px) — cards, botões, inputs
<div className="rounded" />         // = var(--radius) = 4px

// Menor (2px) — badges
<span className="rounded-sm" />     // = calc(var(--radius) - 2px)

// Circular — avatares
<div className="rounded-full" />
```

---

## 7. Arquivos de Referência

| Arquivo                                          | Conteúdo                                             |
|--------------------------------------------------|------------------------------------------------------|
| `src/index.css`                                  | Variáveis CSS customizadas, estilos base, `.contract-paper`, `.badge-*` |
| `tailwind.config.ts`                             | Mapeamento dos tokens CSS para classes Tailwind      |
| `index.html`                                     | Carregamento das fontes DM Sans e DM Serif Display   |
| `src/components/ui/button.tsx`                   | Variantes e tamanhos do componente Button            |
| `src/components/ui/badge.tsx`                    | Componente Badge com variantes de status             |
| `src/components/ui/card.tsx`                     | Card, CardHeader, CardTitle, CardContent             |
| `docs/plans/2026-02-23-redesign-design-system.md`| Especificação original do design system              |
