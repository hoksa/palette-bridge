# shadcn/ui Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded Tailwind gray colors with shadcn CSS variable tokens, normalize spacing/typography/border-radius, adopt Card component for ThemePreview, and clean up unused CSS variables.

**Architecture:** Pure styling refactor across 6 files — no logic changes. Each task touches one file, can be verified independently with `npm run build` (type-check + Vite build). The only new dependency is the shadcn Card component installed via CLI.

**Tech Stack:** React 19, Tailwind CSS 4, shadcn/ui (new-york style), Vite 7, TypeScript 5.9 strict

---

### Task 1: Clean up unused CSS variables in index.css

**Files:**
- Modify: `src/index.css`

**Step 1: Remove chart and sidebar variables from `@theme inline` block**

In `src/index.css`, remove lines 33-45 (the `--color-chart-*` and `--color-sidebar-*` declarations) from the `@theme inline` block:

```css
/* REMOVE these lines from @theme inline: */
    --color-chart-1: var(--chart-1);
    --color-chart-2: var(--chart-2);
    --color-chart-3: var(--chart-3);
    --color-chart-4: var(--chart-4);
    --color-chart-5: var(--chart-5);
    --color-sidebar: var(--sidebar);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-ring: var(--sidebar-ring);
```

**Step 2: Remove chart and sidebar variables from `:root` block**

Remove lines 68-80 from `:root`:

```css
/* REMOVE these lines from :root: */
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.205 0 0);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);
```

**Step 3: Remove chart and sidebar variables from `.dark` block**

Remove lines 102-114 from `.dark`:

```css
/* REMOVE these lines from .dark: */
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.556 0 0);
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 5: Commit**

```bash
git add src/index.css
git commit -m "chore: remove unused chart and sidebar CSS variables"
```

---

### Task 2: Replace color tokens in App.tsx

**Files:**
- Modify: `src/App.tsx:38-43`

**Step 1: Replace hardcoded colors and adjust typography/spacing**

On line 38, replace `bg-gray-50` with `bg-muted`:
```tsx
// Before:
<div className="min-h-screen bg-gray-50">
// After:
<div className="min-h-screen bg-muted">
```

On line 39, replace `bg-white border-b border-gray-200 px-6 py-4` with `bg-background border-b border-border px-6 py-3`:
```tsx
// Before:
<header className="bg-white border-b border-gray-200 px-6 py-4">
// After:
<header className="bg-background border-b border-border px-6 py-3">
```

On line 42, replace `text-xl font-bold text-gray-900` with `text-xl font-semibold tracking-tight text-foreground`:
```tsx
// Before:
<h1 className="text-xl font-bold text-gray-900">Palette Bridge</h1>
// After:
<h1 className="text-xl font-semibold tracking-tight text-foreground">Palette Bridge</h1>
```

On line 43, replace `text-sm text-gray-500` with `text-sm text-muted-foreground`:
```tsx
// Before:
<p className="text-sm text-gray-500">Map Tailwind palettes to Material Design 3 color roles</p>
// After:
<p className="text-sm text-muted-foreground">Map Tailwind palettes to Material Design 3 color roles</p>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "fix: replace hardcoded gray tokens with shadcn variables in App"
```

---

### Task 3: Replace color tokens in ExportPanel.tsx

**Files:**
- Modify: `src/components/ExportPanel.tsx:100-104`

**Step 1: Replace container and text colors**

On line 100, replace `border border-gray-200 rounded-lg bg-white` with `border border-border rounded-lg bg-background`:
```tsx
// Before:
<div className="border border-gray-200 rounded-lg bg-white p-4 space-y-4">
// After:
<div className="border border-border rounded-lg bg-background p-4 space-y-4">
```

On line 101, replace `text-gray-700` with `text-foreground`:
```tsx
// Before:
<h2 className="text-lg font-semibold text-gray-700">Export</h2>
// After:
<h2 className="text-lg font-semibold text-foreground">Export</h2>
```

On line 104, replace `text-sm text-gray-500` with `text-sm text-muted-foreground`:
```tsx
// Before:
<Label htmlFor="kotlin-package" className="text-sm text-gray-500 shrink-0">
// After:
<Label htmlFor="kotlin-package" className="text-sm text-muted-foreground shrink-0">
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "fix: replace hardcoded gray tokens with shadcn variables in ExportPanel"
```

---

### Task 4: Replace color tokens and border-radius in PaletteEditor.tsx

**Files:**
- Modify: `src/components/PaletteEditor.tsx:19,25,36`

**Step 1: Replace heading color**

On line 19, replace `text-gray-700` with `text-foreground`:
```tsx
// Before:
<h2 className="text-lg font-semibold text-gray-700">Palette Swatches</h2>
// After:
<h2 className="text-lg font-semibold text-foreground">Palette Swatches</h2>
```

**Step 2: Replace palette label color**

On line 25, replace `text-gray-600` with `text-muted-foreground`:
```tsx
// Before:
<span className="w-20 text-sm font-medium text-gray-600 capitalize shrink-0">
// After:
<span className="w-20 text-sm font-medium text-muted-foreground capitalize shrink-0">
```

**Step 3: Normalize swatch border-radius**

On line 36, replace `rounded` with `rounded-sm`:
```tsx
// Before:
className="flex-1 min-w-0 h-10 rounded flex flex-col items-center justify-center text-[9px] leading-tight font-mono cursor-default"
// After:
className="flex-1 min-w-0 h-10 rounded-sm flex flex-col items-center justify-center text-[9px] leading-tight font-mono cursor-default"
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 5: Commit**

```bash
git add src/components/PaletteEditor.tsx
git commit -m "fix: replace hardcoded gray tokens and normalize border-radius in PaletteEditor"
```

---

### Task 5: Replace swatch border token in MappingTable.tsx

**Files:**
- Modify: `src/components/MappingTable.tsx:228`

**Step 1: Replace border color**

On line 228, replace `border-black/10` with `border-border`:
```tsx
// Before:
className="w-5 h-5 rounded-sm border border-black/10"
// After:
className="w-5 h-5 rounded-sm border border-border"
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add src/components/MappingTable.tsx
git commit -m "fix: replace hardcoded border-black/10 with border-border in MappingTable"
```

---

### Task 6: Install Card component and refactor ThemePreview

**Files:**
- Create: `src/components/ui/card.tsx` (via shadcn CLI)
- Modify: `src/components/ThemePreview.tsx`

**Step 1: Install shadcn Card component**

Run: `npx shadcn@latest add card --yes`
Expected: Creates `src/components/ui/card.tsx`

**Step 2: Refactor ThemePreview to use Card**

Replace the entire `src/components/ThemePreview.tsx` with:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ThemePreviewProps {
  resolvedColors: Record<string, string>
  themeMode: 'light' | 'dark'
}

export function ThemePreview({ resolvedColors, themeMode }: ThemePreviewProps) {
  const c = resolvedColors
  const label = themeMode === 'light' ? 'Light' : 'Dark'

  return (
    <Card
      className="overflow-hidden"
      style={{
        backgroundColor: c.background || c.surface || '#ffffff',
        color: c.onBackground || c.onSurface || '#000000',
        borderColor: c.outlineVariant,
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold opacity-60">{label} Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: c.primary, color: c.onPrimary }}
          >
            Filled
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium border"
            style={{ borderColor: c.outline, color: c.primary }}
          >
            Outlined
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}
          >
            Tonal
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ color: c.primary }}
          >
            Text
          </button>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-4 space-y-2"
          style={{
            backgroundColor: c.surfaceContainerLow || c.surface,
            borderColor: c.outlineVariant,
          }}
        >
          <div className="text-base font-semibold" style={{ color: c.onSurface }}>
            Card Title
          </div>
          <div className="text-sm" style={{ color: c.onSurfaceVariant }}>
            Subtitle text using onSurfaceVariant
          </div>
          <div className="text-sm" style={{ color: c.onSurface }}>
            Body text sits on the surface container.
          </div>
          <div className="flex gap-2 pt-1">
            <button
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: c.primary, color: c.onPrimary }}
            >
              Action
            </button>
            <button
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ color: c.primary }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* FAB */}
        <div className="flex gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
            style={{ backgroundColor: c.primaryContainer, color: c.onPrimaryContainer }}
          >
            +
          </div>
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
            style={{ backgroundColor: c.tertiaryContainer, color: c.onTertiaryContainer }}
          >
            ★
          </div>
        </div>

        {/* Surface hierarchy */}
        <div className="space-y-1">
          <div className="text-xs font-semibold opacity-50 mb-1">Surfaces</div>
          {[
            { name: 'Lowest', bg: c.surfaceContainerLowest },
            { name: 'Low', bg: c.surfaceContainerLow },
            { name: 'Container', bg: c.surfaceContainer },
            { name: 'High', bg: c.surfaceContainerHigh },
            { name: 'Highest', bg: c.surfaceContainerHighest },
          ].map(s => (
            <div
              key={s.name}
              className="px-3 py-1.5 rounded-lg text-xs flex justify-between items-center"
              style={{ backgroundColor: s.bg, color: c.onSurface }}
            >
              <span>{s.name}</span>
              <span className="font-mono opacity-50">{s.bg}</span>
            </div>
          ))}
        </div>

        {/* Error state */}
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: c.errorContainer, color: c.onErrorContainer }}
        >
          Error: Something went wrong. This uses errorContainer.
        </div>

        {/* Chips */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="px-3 py-1 rounded-full text-xs border"
            style={{ borderColor: c.outline, color: c.onSurfaceVariant }}
          >
            Outlined Chip
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}
          >
            Filled Chip
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
```

Key changes from original:
- Outer `div` → `Card` with `CardHeader`/`CardContent`
- Removed `#e0e0e0` fallback from `borderColor` (base CSS handles `border-border`)
- `rounded-xl` → removed (Card handles its own radius)
- Inner M3 card mock: `rounded-xl` → `rounded-lg`
- Error block: `rounded-xl` → `rounded-lg`
- FABs: `rounded-2xl` → `rounded-xl`

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add src/components/ui/card.tsx src/components/ThemePreview.tsx
git commit -m "feat: adopt shadcn Card component for ThemePreview panels"
```

---

### Task 7: Final verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, zero errors, zero warnings.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors.

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass. (Tests are for pure lib logic, not component styling, so no test changes needed.)

**Step 4: Grep for remaining hardcoded gray tokens**

Run: `grep -rn "gray-\|border-black" src/components/ src/App.tsx`
Expected: Zero matches — all hardcoded grays eliminated.

**Step 5: Visual check**

Run: `npm run dev`
Open in browser, verify:
- Header uses correct background, border, text colors
- PaletteEditor labels are visible, swatches have slightly rounded corners
- MappingTable swatch borders look correct
- ThemePreview panels render inside Card with header/content separation
- ExportPanel container has correct border and background
- No visible layout regressions
