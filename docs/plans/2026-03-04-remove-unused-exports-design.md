# Design: Remove Tokens Studio and CSS Exports

## Goal

Cut scope by removing two unused export formats (Tokens Studio DTCG and CSS custom properties).

## Changes

### Files to delete

- `src/lib/export-tokens-studio.ts` — Tokens Studio DTCG export
- `src/lib/export-css.ts` — CSS custom properties export
- `src/lib/__tests__/export-tokens-studio.test.ts` — tests
- `src/lib/__tests__/export-css.test.ts` — tests

### Files to edit

- `src/components/ExportPanel.tsx` — remove imports and the two export buttons
- `CLAUDE.md` — update export formats list

### No impact on

- Shared utilities (`resolveShadeRef`, `ALL_M3_ROLES`, types) — still used by Kotlin, Material JSON, Styleframe
- State management, color pipeline, or any other components

## Remaining exports after removal

- Kotlin (Color.kt + Theme.kt)
- Material JSON
- Styleframe (DTCG for Figma plugin)
- Mapping (AppState JSON for reimport)
