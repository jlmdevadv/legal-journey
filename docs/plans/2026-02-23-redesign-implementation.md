# Design System Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic Lovable/shadcn default aesthetic with a "Refinado Documental" design system — DM Serif Display + DM Sans typography, parchment/navy/gold palette, 4px radius, full responsiveness.

**Architecture:** Update CSS tokens first (foundation), then shadcn-ui primitive components (building blocks), then page-level layouts top-to-bottom (application). No new dependencies beyond Google Fonts. No structural/logic changes — purely styling.

**Tech Stack:** React + TypeScript, Tailwind CSS v3, shadcn-ui (CVA + Radix), Vite

**Design reference:** `docs/plans/2026-02-23-redesign-design-system.md`

---

## Task 1: Fonts + CSS Tokens

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

### Step 1: Add Google Fonts to `index.html`

In `index.html`, inside `<head>`, add after `<meta name="viewport">`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Serif+Display:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

### Step 2: Replace CSS variables in `src/index.css`

Replace the entire `:root` and `.dark` blocks and the `@layer base` body styles with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Surfaces */
    --background:         36 25% 95%;    /* #F7F5F0 pergaminho */
    --surface:            40 33% 99%;    /* #FDFCF9 cards */
    --surface-secondary:  34 22% 91%;    /* #EDE8DF hover sutil */

    /* Text */
    --foreground:         0 0% 10%;      /* #1A1A1A tinta */
    --muted-foreground:   12 5% 40%;     /* #6B6260 */
    --subtle-foreground:  20 4% 61%;     /* #9E9894 */

    /* Card / Popover (alias surface) */
    --card:               40 33% 99%;
    --card-foreground:    0 0% 10%;
    --popover:            40 33% 99%;
    --popover-foreground: 0 0% 10%;

    /* Primary — Azul Marinho */
    --primary:            210 55% 23%;   /* #1B3A5C */
    --primary-foreground: 36 25% 95%;    /* parchment on navy */

    /* Secondary */
    --secondary:          34 22% 91%;    /* #EDE8DF */
    --secondary-foreground: 0 0% 10%;

    /* Muted */
    --muted:              34 22% 91%;
    --muted-foreground:   12 5% 40%;

    /* Accent — Dourado */
    --accent:             38 51% 60%;    /* #C8A96E */
    --accent-foreground:  0 0% 10%;

    /* Destructive — Vinho */
    --destructive:        350 63% 37%;   /* #9B2335 */
    --destructive-foreground: 40 33% 99%;

    /* Borders */
    --border:             30 15% 81%;    /* #D5CEC4 */
    --input:              30 15% 81%;
    --ring:               210 55% 23%;   /* primary */

    /* Radius */
    --radius: 0.25rem;                   /* 4px */

    /* Status tokens (raw hex, used in inline styles + custom classes) */
    --status-approved:    #2D6A4F;
    --status-approved-bg: rgba(45,106,79,0.10);
    --status-pending:     #7D5A1E;
    --status-pending-bg:  rgba(125,90,30,0.10);
    --status-draft:       #5A5A5A;
    --status-draft-bg:    rgba(90,90,90,0.08);
    --status-rejected:    #9B2335;
    --status-rejected-bg: rgba(155,35,53,0.10);

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(26,26,26,0.08);
    --shadow-md: 0 4px 12px rgba(26,26,26,0.10);

    /* Sidebar (keep existing structure, update colors) */
    --sidebar-background: 210 55% 23%;
    --sidebar-foreground: 36 25% 95%;
    --sidebar-primary:    38 51% 60%;
    --sidebar-primary-foreground: 0 0% 10%;
    --sidebar-accent:     210 45% 30%;
    --sidebar-accent-foreground: 36 25% 95%;
    --sidebar-border:     210 45% 30%;
    --sidebar-ring:       38 51% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-family: 'DM Serif Display', serif;
    font-weight: 400;
  }
}

/* Contract paper styles (used inside ContractPreview) */
.contract-paper {
  background-color: #FDFCF9;
  font-family: 'DM Serif Display', serif;
  font-size: 14px;
  line-height: 1.8;
  padding: 40px 48px;
  color: #1A1A1A;
}

.contract-field {
  color: #1B3A5C;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

/* Status badge helper classes */
.badge-approved  { color: var(--status-approved);  background: var(--status-approved-bg);  border: 1px solid rgba(45,106,79,0.20); }
.badge-pending   { color: var(--status-pending);   background: var(--status-pending-bg);   border: 1px solid rgba(125,90,30,0.20); }
.badge-draft     { color: var(--status-draft);     background: var(--status-draft-bg);     border: 1px solid rgba(90,90,90,0.15);  }
.badge-rejected  { color: var(--status-rejected);  background: var(--status-rejected-bg);  border: 1px solid rgba(155,35,53,0.20); }

@media print {
  body { font-family: 'DM Serif Display', serif; font-size: 12pt; line-height: 1.6; }
  .contract-paper { text-align: justify; }
  h1 { text-align: center; font-size: 14pt; font-weight: 400; text-transform: uppercase; }
}
```

### Step 3: Update `tailwind.config.ts`

Replace the `colors` extension block and `borderRadius` block with:

```ts
colors: {
  border:      'hsl(var(--border))',
  input:       'hsl(var(--input))',
  ring:        'hsl(var(--ring))',
  background:  'hsl(var(--background))',
  foreground:  'hsl(var(--foreground))',
  surface: {
    DEFAULT:   'hsl(var(--surface))',
    secondary: 'hsl(var(--surface-secondary))',
  },
  primary: {
    DEFAULT:    'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT:    'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  destructive: {
    DEFAULT:    'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  muted: {
    DEFAULT:    'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT:    'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  popover: {
    DEFAULT:    'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  card: {
    DEFAULT:    'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  sidebar: {
    DEFAULT:              'hsl(var(--sidebar-background))',
    foreground:           'hsl(var(--sidebar-foreground))',
    primary:              'hsl(var(--sidebar-primary))',
    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    accent:               'hsl(var(--sidebar-accent))',
    'accent-foreground':  'hsl(var(--sidebar-accent-foreground))',
    border:               'hsl(var(--sidebar-border))',
    ring:                 'hsl(var(--sidebar-ring))',
  },
},
borderRadius: {
  lg: 'var(--radius)',           /* 4px */
  md: 'var(--radius)',           /* 4px */
  sm: 'calc(var(--radius) - 2px)', /* 2px */
  full: '9999px',
},
fontFamily: {
  sans:    ['DM Sans', 'sans-serif'],
  serif:   ['DM Serif Display', 'serif'],
},
```

Also add `container` padding update (change `padding: '2rem'` to `padding: '1.5rem'`) and `screens['2xl']` to `'1200px'`.

### Step 4: Verify in browser

Run `npm run dev` and open the app. The background should now be parchment `#F7F5F0`, body font DM Sans. All headings should render in DM Serif Display.

### Step 5: Commit

```bash
git add index.html src/index.css tailwind.config.ts
git commit -m "feat: apply Refinado Documental design tokens and fonts"
```

---

## Task 2: Button Component

**Files:**
- Modify: `src/components/ui/button.tsx`

### Step 1: Replace `buttonVariants` cva definition

Replace the entire `cva(...)` call with:

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-secondary rounded",
        secondary:
          "bg-transparent border border-border text-foreground hover:bg-surface-secondary rounded",
        ghost:
          "text-muted-foreground hover:bg-surface-secondary hover:text-foreground rounded",
        link:
          "text-primary underline-offset-4 hover:underline",
        "outline-primary":
          "border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3.5 py-1.5 text-xs",
        lg:      "h-11 px-7 py-2.5 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Step 2: Verify

Check that buttons across the app render correctly — primary should be navy, ghost muted.

### Step 3: Commit

```bash
git add src/components/ui/button.tsx
git commit -m "feat: redesign Button component with Refinado Documental tokens"
```

---

## Task 3: Card Component

**Files:**
- Modify: `src/components/ui/card.tsx`

### Step 1: Update Card, CardHeader, CardTitle, CardContent

Replace the className strings as follows:

**Card** — change `"rounded-lg border bg-card text-card-foreground shadow-sm"` to:
```
"rounded border border-border bg-card text-card-foreground"
```

**CardHeader** — change `"flex flex-col space-y-1.5 p-6"` to:
```
"flex flex-col space-y-1 px-6 py-5 border-b border-border"
```

**CardTitle** — change `"text-2xl font-semibold leading-none tracking-tight"` to:
```
"font-serif text-lg font-normal leading-snug text-foreground"
```

**CardDescription** — no change needed.

**CardContent** — change `"p-6 pt-0"` to:
```
"px-6 py-5"
```

**CardFooter** — change `"flex items-center p-6 pt-0"` to:
```
"flex items-center px-6 py-4 border-t border-border"
```

### Step 2: Verify

Cards should show thin border, no shadow, serif card titles.

### Step 3: Commit

```bash
git add src/components/ui/card.tsx
git commit -m "feat: redesign Card component — border-only, serif title"
```

---

## Task 4: Badge Component

**Files:**
- Modify: `src/components/ui/badge.tsx`

### Step 1: Replace `badgeVariants`

Replace the entire cva call with:

```ts
const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider border transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground border-transparent",
        secondary:   "bg-surface-secondary text-muted-foreground border-border",
        destructive: "badge-rejected",
        outline:     "text-foreground border-border bg-transparent",
        approved:    "badge-approved",
        pending:     "badge-pending",
        draft:       "badge-draft",
        rejected:    "badge-rejected",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Step 2: Update `BadgeProps` interface to include new variants

The `VariantProps<typeof badgeVariants>` will automatically pick them up — no manual change needed beyond the cva update.

### Step 3: Verify

Check badges in MasterDashboard and MasterReview — they should show status-specific colors.

### Step 4: Commit

```bash
git add src/components/ui/badge.tsx
git commit -m "feat: redesign Badge with status-aware variants"
```

---

## Task 5: Input + Textarea Components

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`

### Step 1: Update Input className

Replace the long className string in `input.tsx` with:

```
"flex h-10 w-full rounded border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-subtle-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
```

### Step 2: Check `textarea.tsx` exists

```bash
ls src/components/ui/textarea.tsx
```

Apply the same border/bg/ring treatment:
```
"flex min-h-[80px] w-full rounded border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-subtle-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
```

### Step 3: Verify

Inputs should show thin border, parchment background, navy focus ring.

### Step 4: Commit

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx
git commit -m "feat: redesign Input and Textarea with surface bg and navy focus"
```

---

## Task 6: Navbar — Desktop Redesign

**Files:**
- Modify: `src/components/Navbar.tsx`

### Step 1: Update Navbar shell and logo

Replace:
```tsx
<header className="bg-white shadow-sm sticky top-0 z-50">
  <nav className="container mx-auto px-4 py-4">
```
With:
```tsx
<header className="bg-surface border-b border-border sticky top-0 z-50">
  <nav className="container mx-auto px-6 py-0 h-14 flex items-center justify-between">
```

Remove the inner `<div className="flex items-center justify-between">` since we moved flexbox to nav.

### Step 2: Update logo

Replace:
```tsx
<Link to="/" className="text-xl font-bold text-contractPrimary">
  Legal Journey
</Link>
```
With:
```tsx
<Link to="/" className="font-serif text-xl text-foreground tracking-tight hover:text-primary transition-colors duration-150">
  Legal Journey
</Link>
```

### Step 3: Update nav links (desktop)

Replace:
```tsx
<div className="hidden md:flex space-x-6">
  <a href="/" className="text-gray-700 hover:text-contractPrimary transition">
```
With:
```tsx
<div className="hidden md:flex items-center space-x-6 ml-8">
  <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
```
Apply same to other links.

### Step 4: Update Avatar fallback

Replace:
```tsx
<AvatarFallback className="bg-primary text-primary-foreground">
```
With:
```tsx
<AvatarFallback className="bg-primary text-primary-foreground font-sans text-sm font-medium">
```

### Step 5: Verify desktop

Nav should show parchment bg, thin bottom border, serif logo, muted links.

### Step 6: Commit

```bash
git add src/components/Navbar.tsx
git commit -m "feat: redesign Navbar — surface bg, serif logo, muted links"
```

---

## Task 7: Navbar — Mobile Hamburger Drawer

**Files:**
- Modify: `src/components/Navbar.tsx`

### Step 1: Add mobile state

At the top of the component, add:
```tsx
const [mobileOpen, setMobileOpen] = useState(false);
```
(The `useState` import is already present.)

### Step 2: Add hamburger button (right side, mobile only)

Inside the nav, after the desktop links div, add:
```tsx
{/* Mobile hamburger */}
<button
  className="md:hidden flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
  onClick={() => setMobileOpen(true)}
  aria-label="Abrir menu"
>
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
</button>
```

### Step 3: Add mobile drawer overlay

At the end of the component (before closing `</header>`), add:

```tsx
{/* Mobile drawer */}
{mobileOpen && (
  <>
    <div
      className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
      onClick={() => setMobileOpen(false)}
    />
    <div className="fixed top-0 right-0 z-50 h-full w-72 bg-surface border-l border-border flex flex-col md:hidden">
      <div className="flex items-center justify-between px-6 h-14 border-b border-border">
        <span className="font-serif text-lg text-foreground">Menu</span>
        <button
          className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <nav className="flex flex-col px-6 py-6 gap-1">
        <a href="/" className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Início</a>
        <a href="/#templates" className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Modelos</a>
        {user && (
          <>
            <Link to="/meus-contratos" className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Meus Contratos</Link>
            {isMaster && (
              <Link to="/master" className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Painel do Escritório</Link>
            )}
          </>
        )}
      </nav>
      {user && (
        <div className="mt-auto px-6 py-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 truncate">{user.email}</p>
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { signOut(); setMobileOpen(false); }}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  </>
)}
```

### Step 4: Hide hamburger when no user for logged-out state

The hamburger should only show when there are nav items to show. Wrap it with `{(user || true) && ...}` — always show since there are always public links.

### Step 5: Verify mobile (resize browser to < 640px)

Should show clean drawer sliding from right, overlay background.

### Step 6: Commit

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add mobile hamburger drawer to Navbar"
```

---

## Task 8: MasterDashboard Redesign

**Files:**
- Modify: `src/pages/MasterDashboard.tsx`

### Step 1: Update page heading section

Replace:
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
  <p className="text-muted-foreground mt-1">Painel de gerenciamento de modelos</p>
</div>
```
With:
```tsx
<div className="mb-10 pt-2">
  <h1 className="font-serif text-3xl text-foreground">{organization.name}</h1>
  <p className="text-sm text-muted-foreground mt-1">Painel de gerenciamento</p>
</div>
```

### Step 2: Update stats cards

Replace `<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">` with `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">`.

Inside each stat card, replace `<CardTitle className="text-sm font-medium text-muted-foreground">` with `<p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">` (remove the CardTitle component for stat labels to avoid serif rendering).

Replace `<div className="text-2xl font-bold">` with `<div className="text-3xl font-serif text-foreground mt-2">`.

### Step 3: Update Templates section heading

Replace:
```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-foreground">Seus Modelos</h2>
```
With:
```tsx
<div className="flex items-center justify-between mb-5">
  <div>
    <h2 className="font-serif text-xl text-foreground">Modelos</h2>
    <div className="mt-1 h-px w-full bg-border" />
  </div>
```

### Step 4: Update Documents section — replace Tabs with select filter

The current Tabs filter is replaced by a `<select>` for simplicity and cleaner look.

Replace the entire `<Tabs ...>` block:
```tsx
<Tabs value={docFilter} onValueChange={setDocFilter}>
  <TabsList>...</TabsList>
</Tabs>
```
With:
```tsx
<div className="flex items-center gap-3">
  <select
    value={docFilter}
    onChange={(e) => setDocFilter(e.target.value)}
    className="h-9 rounded border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  >
    <option value="all">Todos ({documents.length})</option>
    <option value="pending_review">Pendentes ({pendingCount})</option>
    <option value="approved">Aprovados ({approvedCount})</option>
    <option value="rejected">Reprovados ({rejectedCount})</option>
  </select>
</div>
```

### Step 5: Update Documents section heading

Replace:
```tsx
<h2 className="text-lg font-semibold text-foreground mb-4">Documentos Recebidos</h2>
```
With:
```tsx
<h2 className="font-serif text-xl text-foreground mb-4">Documentos Recebidos</h2>
```

### Step 6: Update status badges in documents table

Find the `statusMap` object and update variants to use new badge variants:
```tsx
const statusMap: Record<string, { label: string; variant: any }> = {
  draft:          { label: 'Rascunho',  variant: 'draft'     },
  pending_review: { label: 'Pendente',  variant: 'pending'   },
  approved:       { label: 'Aprovado',  variant: 'approved'  },
  rejected:       { label: 'Reprovado', variant: 'rejected'  },
  completed:      { label: 'Finalizado',variant: 'approved'  },
};
```

### Step 7: Mobile — templates table becomes responsive cards

In the templates section, wrap the existing `<Card><Table>` in a `hidden sm:block` div, and add a mobile card list below:
```tsx
{/* Mobile template list */}
<div className="sm:hidden flex flex-col gap-3 mb-8">
  {templates.map((t) => (
    <div key={t.id} className="rounded border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-sm font-medium text-foreground">{t.name}</p>
        <span className="text-xs text-muted-foreground shrink-0">{t.fields.length} campos</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => navigate(`/master/template/${t.id}`)}>
          <Edit className="w-3 h-3 mr-1" />Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLinkModal({ open: true, templateId: t.id, templateName: t.name })}>
          <Link2 className="w-3 h-3 mr-1" />Link
        </Button>
      </div>
    </div>
  ))}
</div>
```

### Step 8: Mobile — documents table becomes responsive cards

Same pattern: wrap existing table in `hidden sm:block`, add mobile card list for `sm:hidden`:
```tsx
<div className="sm:hidden flex flex-col gap-3">
  {filteredDocs.map((doc) => {
    const s = statusMap[doc.status] || { label: doc.status, variant: 'outline' as const };
    return (
      <div key={doc.id} className="rounded border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-foreground">{doc.name}</p>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>
        {doc.submitted_for_review_at && (
          <p className="text-xs text-muted-foreground mb-3">
            {format(new Date(doc.submitted_for_review_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate(`/master/review/${doc.id}`)}>
          <Eye className="w-3 h-3 mr-1" />Ver
        </Button>
      </div>
    );
  })}
</div>
```

### Step 9: Update `main` container padding

Replace `<main className="container mx-auto px-4 py-8">` with `<main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">`.

### Step 10: Verify desktop and mobile

Desktop: serif headings, parchment cards, new status badges.
Mobile (< 640px): templates and documents as stacked cards.

### Step 11: Commit

```bash
git add src/pages/MasterDashboard.tsx
git commit -m "feat: redesign MasterDashboard — serif headings, status badges, mobile cards"
```

---

## Task 9: MasterReview Redesign

**Files:**
- Modify: `src/pages/MasterReview.tsx`

### Step 1: Update page container

Replace `<main className="container mx-auto px-4 py-8 max-w-4xl">` with:
```tsx
<main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
```

### Step 2: Update document header

Replace the `CardTitle` in the document info card:
```tsx
<CardTitle className="flex items-center gap-2">
  <FileText className="w-5 h-5" />
  {document.name}
</CardTitle>
```
With:
```tsx
<div className="flex items-center gap-3">
  <h1 className="font-serif text-xl text-foreground">{document.name}</h1>
</div>
```
Move the `<Badge>` to be inline after the heading inside the same flex row.

### Step 3: Update status badge variant in review page

Replace:
```tsx
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_review: { label: 'Pendente',  variant: 'secondary'    },
  approved:       { label: 'Aprovado',  variant: 'default'      },
  rejected:       { label: 'Reprovado', variant: 'destructive'  },
  draft:          { label: 'Rascunho',  variant: 'outline'      },
};
```
With:
```tsx
const statusMap: Record<string, { label: string; variant: any }> = {
  pending_review: { label: 'Pendente',  variant: 'pending'   },
  approved:       { label: 'Aprovado',  variant: 'approved'  },
  rejected:       { label: 'Reprovado', variant: 'rejected'  },
  draft:          { label: 'Rascunho',  variant: 'draft'     },
};
```

### Step 4: Update generated document preview card

Replace:
```tsx
<div
  className="prose prose-sm max-w-none bg-white p-6 rounded border whitespace-pre-wrap"
  dangerouslySetInnerHTML={{ __html: document.generated_document }}
/>
```
With:
```tsx
<div
  className="contract-paper rounded border border-border max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm"
  dangerouslySetInnerHTML={{ __html: document.generated_document }}
/>
```

### Step 5: Update review action buttons

Replace:
```tsx
<Button
  onClick={() => handleReview('approved')}
  disabled={isSubmitting}
  className="flex-1 bg-green-600 hover:bg-green-700"
>
```
With:
```tsx
<Button
  onClick={() => handleReview('approved')}
  disabled={isSubmitting}
  className="flex-1"
>
```
(Uses the default primary/navy color.)

Replace:
```tsx
<Button
  onClick={() => handleReview('rejected')}
  disabled={isSubmitting}
  variant="destructive"
  className="flex-1"
>
```
No change needed — destructive variant is already correct.

### Step 6: Mobile sticky action bar

Wrap the action buttons card to be sticky on mobile:
```tsx
<div className="sm:sticky sm:bottom-0 sm:bg-background sm:border-t sm:border-border sm:px-4 sm:py-3">
  {/* existing Card with review buttons */}
</div>
```

Actually, keep it as a Card on desktop, and just add bottom padding on mobile so it doesn't clip. The simpler approach is no sticky — just ensure buttons are visible by reducing document preview max-height on mobile:

Add `className="max-h-[60vh] sm:max-h-[500px]"` to the document preview div.

### Step 7: Verify

Review page should show serif title, parchment document preview, navy approve button.

### Step 8: Commit

```bash
git add src/pages/MasterReview.tsx
git commit -m "feat: redesign MasterReview — serif heading, parchment doc, correct badges"
```

---

## Task 10: Questionnaire Progress Bar + Mobile Preview

**Files:**
- Modify: `src/components/QuestionnaireForm.tsx`
- Modify: `src/components/shared/SharedQuestionnaireContainer.tsx`
- Modify: `src/components/questionnaire/QuestionnaireQuestion.tsx` (if it exists)
- Modify: `src/components/questionnaire/QuestionnaireSummary.tsx` (check submit button)

### Step 1: Explore questionnaire subcomponents

```bash
ls src/components/questionnaire/
```

Read `src/components/questionnaire/QuestionnaireQuestion.tsx` — this is likely where the current question + navigation buttons are rendered. Also read `QuestionnaireSummary.tsx`.

### Step 2: Add progress bar to QuestionnaireForm

At the top of the returned JSX in `QuestionnaireForm.tsx` (before any step rendering), add a progress calculation and progress bar.

Find where `currentQuestionIndex` and `allVisibleFields` are available. Add:
```tsx
// Progress calculation
const totalSteps = allVisibleFields.length;
const progressPercent = totalSteps > 0
  ? Math.max(0, Math.min(100, (currentQuestionIndex / totalSteps) * 100))
  : 0;
```

Then, wrap the entire return in a container that includes the progress bar at the top. Instead of returning individual components directly, wrap them:
```tsx
return (
  <div className="flex flex-col h-full">
    {/* Progress bar */}
    {currentQuestionIndex >= 0 && totalSteps > 0 && (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-sans">
            Pergunta {currentQuestionIndex + 1} de {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    )}
    {/* Existing step content */}
    {/* ... all the existing conditional returns go here as one expression ... */}
  </div>
);
```

Note: The existing component has multiple early returns. The cleanest approach is to compute the content first, then wrap:
```tsx
const content = (() => {
  if (currentQuestionIndex === -1) return <QuestionnaireWelcome />;
  if (currentQuestionIndex === -2) return <PartyNumberQuestion />;
  // ... all other existing conditions ...
  return <QuestionnaireQuestion ... />;
})();

return (
  <div className="flex flex-col h-full">
    {progressBar}
    {content}
  </div>
);
```

### Step 3: Mobile preview toggle in SharedQuestionnaireContainer

In `SharedQuestionnaireContainer.tsx`, add mobile preview state:
```tsx
const [showMobilePreview, setShowMobilePreview] = useState(false);
```

Replace the layout section:
```tsx
<div className="flex flex-col md:flex-row gap-6">
  <div className="md:w-1/2 print:hidden">
    <QuestionnaireForm ... />
  </div>
  <div className="md:w-1/2 print:w-full">
```
With:
```tsx
<div className="flex flex-col md:flex-row gap-6">
  {/* Desktop: both panels. Mobile: form only (preview via button) */}
  <div className={`${showMobilePreview ? 'hidden' : 'block'} md:block md:w-1/2 print:hidden`}>
    <QuestionnaireForm isSharedContext={isSharedContext} onSubmitForReview={onSubmitForReview} />
    {/* Mobile preview toggle */}
    <button
      className="md:hidden mt-4 w-full flex items-center justify-center gap-2 h-11 rounded border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
      onClick={() => setShowMobilePreview(true)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
      Ver prévia do contrato
    </button>
  </div>
  <div className={`${showMobilePreview ? 'block' : 'hidden'} md:block md:w-1/2 print:w-full`}>
    {/* Mobile back button */}
    {showMobilePreview && (
      <button
        className="md:hidden mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setShowMobilePreview(false)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Voltar ao formulário
      </button>
    )}
```

Close the wrapping div properly after the `</ScrollArea>` and `</div>` that currently closes the preview panel.

### Step 4: Verify on mobile (≤ 640px)

Should show form only; "Ver prévia" button at bottom; tap shows preview with "Voltar" button.

### Step 5: Commit

```bash
git add src/components/QuestionnaireForm.tsx src/components/shared/SharedQuestionnaireContainer.tsx
git commit -m "feat: add progress bar to questionnaire and mobile preview toggle"
```

---

## Task 11: ContractPreview Paper Style

**Files:**
- Modify: `src/components/ContractPreview.tsx`

### Step 1: Read the full file

Read `src/components/ContractPreview.tsx` completely to find where the paper wrapper div is rendered.

### Step 2: Find the outer paper container

Look for the div that wraps the contract content (likely has `className="contract-paper"` or `bg-white` with padding). Ensure it uses the updated `.contract-paper` class from `index.css` (Task 1 already updated it). No code change needed if it already uses `.contract-paper`.

If it uses inline `bg-white` without the class, add `className="contract-paper"` to that container.

### Step 3: Update placeholder span colors

Find `className="bg-yellow-50 px-1 rounded border border-yellow-200 text-yellow-800"` and replace with:
```
"bg-surface-secondary px-1 rounded-sm border border-border text-primary font-sans text-[13px]"
```

Find `className="bg-purple-100 px-1 rounded border border-purple-300 text-purple-800 font-mono text-xs"` and replace with:
```
"bg-muted px-1 rounded-sm border border-border text-muted-foreground font-mono text-[11px]"
```

### Step 4: Verify

Contract preview should show parchment background, serif body text.

### Step 5: Commit

```bash
git add src/components/ContractPreview.tsx
git commit -m "feat: update ContractPreview paper styles to design system"
```

---

## Task 12: MeusContratos + Auth Pages

**Files:**
- Modify: `src/pages/MeusContratos.tsx`
- Modify: `src/pages/Auth.tsx`

### Step 1: Read both files fully

Read `src/pages/MeusContratos.tsx` (full) and `src/pages/Auth.tsx` (full).

### Step 2: MeusContratos — update heading and badge variants

- Replace `<h1 className="text-3xl font-bold ...">` with `<h1 className="font-serif text-3xl text-foreground">`
- Find the `statusLabels` usage and any `<Badge variant="...">` calls — update variants to use `draft`, `pending`, `approved`, `rejected` as in Task 4
- Replace any Tabs filter with a `<select>` using the same pattern from Task 8 Step 4
- Ensure container has responsive padding: `px-4 sm:px-6`

### Step 3: Auth page — update form styling

Find the login/register card. Update:
- Card should use redesigned Card component (no changes needed if shadcn imports are used)
- Heading: add `font-serif` class if it's a raw `<h1>` or `<h2>`
- Remove any hardcoded `bg-white` or `shadow-md` from the auth card wrapper
- Ensure the form uses the redesigned Input component (no code changes if it imports from `@/components/ui/input`)

### Step 4: Verify both pages

Auth: clean centered card on parchment background.
MeusContratos: serif heading, correct status badges.

### Step 5: Commit

```bash
git add src/pages/MeusContratos.tsx src/pages/Auth.tsx
git commit -m "feat: apply design system to MeusContratos and Auth pages"
```

---

## Task 13: Remaining Pages Sweep

**Files:**
- Modify: `src/pages/Index.tsx`
- Modify: `src/pages/SharedTemplate.tsx`
- Check: `src/pages/MasterTemplateEditor.tsx`

### Step 1: Read Index.tsx

Read `src/pages/Index.tsx`. Update any hardcoded colors (gray-*, blue-*), `font-bold` headings (→ `font-serif font-normal`), and `bg-white` cards.

### Step 2: Read SharedTemplate.tsx

Read `src/pages/SharedTemplate.tsx`. It wraps `SharedQuestionnaireContainer` — likely minimal changes. Check for any hardcoded colors on the wrapper.

### Step 3: Read MasterTemplateEditor.tsx briefly

Check for obvious design system violations (hardcoded colors, generic headings). Fix any `text-3xl font-bold` → `font-serif text-3xl font-normal`, hardcoded blues → `text-primary`.

### Step 4: Commit

```bash
git add src/pages/Index.tsx src/pages/SharedTemplate.tsx src/pages/MasterTemplateEditor.tsx
git commit -m "feat: apply design system sweep to remaining pages"
```

---

## Task 14: Final Visual QA

**No file changes — verification only.**

### Step 1: Check all breakpoints

Run `npm run dev`. Test at: 375px (mobile), 768px (tablet), 1280px (desktop).

Checklist:
- [ ] Parchment background on all pages
- [ ] DM Serif Display on all h1/h2/h3 and CardTitle
- [ ] DM Sans on body, labels, buttons
- [ ] Navy primary buttons (no generic blue)
- [ ] Status badges show correct colors (approved=green, pending=amber, draft=gray, rejected=red)
- [ ] Cards: thin border, no shadow, parchment surface
- [ ] Inputs: thin border, navy focus ring
- [ ] Navbar: surface bg, serif logo, thin border-bottom, mobile drawer working
- [ ] MasterDashboard: mobile cards for templates + documents
- [ ] Questionnaire: progress bar visible, "Ver prévia" button on mobile
- [ ] MasterReview: parchment document preview, max-height scroll

### Step 2: Fix any regressions found

If any component still shows old styling (e.g. hardcoded `bg-white`, `text-blue-600`), search and fix:
```bash
grep -r "text-blue-\|bg-blue-\|text-gray-\|bg-gray-\|bg-white\|font-bold" src/pages/ src/components/Navbar.tsx
```

Fix each occurrence to use design system tokens.

### Step 3: Final commit

```bash
git add -A
git commit -m "fix: resolve design system regressions from QA sweep"
```

---

## Summary

| Task | Files | Scope |
|---|---|---|
| 1 | `index.html`, `index.css`, `tailwind.config.ts` | Tokens, fonts |
| 2 | `ui/button.tsx` | Button variants |
| 3 | `ui/card.tsx` | Card styles |
| 4 | `ui/badge.tsx` | Status badges |
| 5 | `ui/input.tsx`, `ui/textarea.tsx` | Form inputs |
| 6–7 | `Navbar.tsx` | Desktop + mobile drawer |
| 8 | `MasterDashboard.tsx` | Dashboard + mobile cards |
| 9 | `MasterReview.tsx` | Review page |
| 10 | `QuestionnaireForm.tsx`, `SharedQuestionnaireContainer.tsx` | Progress bar + mobile preview |
| 11 | `ContractPreview.tsx` | Paper styles |
| 12 | `MeusContratos.tsx`, `Auth.tsx` | Secondary pages |
| 13 | `Index.tsx`, `SharedTemplate.tsx`, `MasterTemplateEditor.tsx` | Remaining pages sweep |
| 14 | — | Visual QA + regressions |
