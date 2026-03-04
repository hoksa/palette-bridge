# Remove Tokens Studio and CSS Exports Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the Tokens Studio (DTCG) and CSS custom properties export formats to cut scope.

**Architecture:** Delete 4 files (2 exports + 2 tests), edit 2 files (ExportPanel + CLAUDE.md). No shared dependencies affected.

**Tech Stack:** React, TypeScript, Vitest

---

### Task 1: Delete export files and tests

**Files:**
- Delete: `src/lib/export-tokens-studio.ts`
- Delete: `src/lib/export-css.ts`
- Delete: `src/lib/__tests__/export-tokens-studio.test.ts`
- Delete: `src/lib/__tests__/export-css.test.ts`

**Step 1: Delete the four files**

```bash
rm src/lib/export-tokens-studio.ts src/lib/export-css.ts src/lib/__tests__/export-tokens-studio.test.ts src/lib/__tests__/export-css.test.ts
```

**Step 2: Commit**

```bash
git add -u
git commit -m "chore: delete Tokens Studio and CSS export files and tests"
```

---

### Task 2: Remove references from ExportPanel

**Files:**
- Modify: `src/components/ExportPanel.tsx`

**Step 1: Remove imports (lines 5-6)**

Remove these two lines:
```typescript
import { generateTokensStudio } from '../lib/export-tokens-studio'
import { generateCss } from '../lib/export-css'
```

**Step 2: Remove handler functions (lines 45-55)**

Remove `exportTokensStudio` function:
```typescript
  function exportTokensStudio() {
    const tokens = generateTokensStudio(paletteConfig, themeMapping)
    download('core.json', tokens.core, 'application/json')
    setTimeout(() => download('light.json', tokens.light, 'application/json'), 100)
    setTimeout(() => download('dark.json', tokens.dark, 'application/json'), 200)
  }
```

Remove `exportCss` function:
```typescript
  function exportCss() {
    const css = generateCss(paletteConfig, themeMapping)
    download('theme.css', css, 'text/css')
  }
```

**Step 3: Remove export buttons (lines 125-126)**

Remove these two lines from the button list:
```tsx
        <ExportButton label="Tokens Studio" description="core + light + dark JSON" onClick={exportTokensStudio} />
        <ExportButton label="CSS" description="Custom properties" onClick={exportCss} />
```

**Step 4: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "chore: remove Tokens Studio and CSS from ExportPanel"
```

---

### Task 3: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the export formats line (line 58)**

Change:
```
- **Export formats**: Kotlin (Color.kt + Theme.kt), Material JSON, Tokens Studio (DTCG), CSS custom properties
```
To:
```
- **Export formats**: Kotlin (Color.kt + Theme.kt), Material JSON, Styleframe (DTCG for Figma)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update export formats list in CLAUDE.md"
```

---

### Task 4: Verify

**Step 1: Run remaining tests**

```bash
npx vitest run
```

Expected: All remaining tests pass (export-kotlin, export-material-json, export-styleframe, palette tests).

**Step 2: Type-check and build**

```bash
npm run build
```

Expected: Clean build with no errors.

**Step 3: Run lint**

```bash
npm run lint
```

Expected: No lint errors.
