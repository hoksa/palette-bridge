# Styleframe Export — Implementation Plan

## Prerequisites
- Design doc: `docs/plans/2026-03-02-styleframe-export-design.md`
- Reference: actual Styleframe export from user's Figma file (in brainstorming session)

## Tasks

### Task 1: Extract shared palette utilities
**Files**: `src/lib/palette-tones.ts` (new), `src/lib/export-material-json.ts` (refactor)

Extract `SHADE_TO_TONE`, `NEAREST_TONE_FILL`, and palette-building logic into a shared module so both Material JSON and Styleframe exporters can use them. Keep `toUpperHex` in material-json (Styleframe uses lowercase). Keep `MTB_ROLE_ORDER` in material-json (Styleframe uses its own order).

Shared exports:
- `SHADE_TO_TONE: Record<string, string>`
- `NEAREST_TONE_FILL: Record<string, string>`
- `buildTonalPalette(config: PaletteConfig, paletteName: string): Record<string, string>` — returns tone→hex map with nearest-neighbor fill, lowercase hex

Verify: existing Material JSON tests still pass after refactor.

### Task 2: Write tests (TDD red phase)
**File**: `src/lib/__tests__/export-styleframe.test.ts`

Tests to write:
1. Top-level structure has $schema, $extensions, Schemes, Surfaces, Palettes, State Layers, $modifiers
2. $extensions.dev.styleframe has collection name and 6 modes
3. Schemes group has 49 tokens with $value and $type
4. Scheme token names are Title Case ("Primary Container", not "primaryContainer")
5. Scheme values are lowercase 6-digit hex (#rrggbb)
6. Palettes group has 108 tokens (6 families × 18 tones)
7. Palette token names follow "Family Tone" pattern ("Primary 40", "Neutral Variant 95")
8. Surfaces group has 5 tokens with 8-digit hex (rgba)
9. State Layers has 49 groups, each with 3 Opacity sub-tokens
10. State Layer values are 8-digit hex
11. $modifiers has 5 theme contexts (no "Light")
12. Modifier overrides are sparse (only differing values)
13. Palettes are NOT in $modifiers (mode-invariant)

### Task 3: Implement export-styleframe.ts
**File**: `src/lib/export-styleframe.ts`

Implementation steps:
1. Import shared utilities from palette-tones.ts
2. Implement `toTitleCase(camelCase: string): string` — convert M3 role names to Title Case
3. Implement `toLowerHex(hex: string): string` — normalize to lowercase #rrggbb
4. Implement `toHexAlpha(hex: string, percent: number): string` — append alpha byte for 8-digit hex
5. Implement `resolveAllSchemes(config, mapping)` — resolve all 6 schemes
6. Implement `buildSchemes(resolved)` — 49 tokens with $value/$type from Light scheme
7. Implement `buildSurfaces(resolved)` — 5 tokens using surfaceTint + alpha
8. Implement `buildPalettes(config)` — 108 tokens using shared buildTonalPalette
9. Implement `buildStateLayers(resolved)` — 49 groups × 3 opacity tokens
10. Implement `buildModifiers(resolved, lightScheme)` — sparse overrides for 5 non-Light modes
11. Assemble and export `generateStyleframeJson(config, mapping, collectionName?): string`

### Task 4: Wire up ExportPanel.tsx
**File**: `src/components/ExportPanel.tsx`

Add a "Styleframe" export button that calls `generateStyleframeJson()` and triggers download of a single `.json` file.

### Task 5: Full verification
Run all tests, type check, lint. Ensure existing 52 tests still pass + new Styleframe tests pass.

### Task 6: Commit and update PR
Conventional commit: `feat: add Styleframe DTCG export for direct Figma variable import`
Update PR #6 description to include the new Styleframe export.
