# Material JSON Figma Compatibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Material JSON export match the Material Theme Builder format so Figma's MTB plugin accepts it.

**Architecture:** Rewrite `export-material-json.ts` to output the standard MTB JSON structure — add `seed`/`coreColors`/`extendedColors` metadata, convert palette keys from Tailwind shades to M3 tones, and add `neutral-variant` palette. The `schemes` section already matches and needs no changes.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Update tests to expect new MTB structure

**Files:**
- Modify: `src/lib/__tests__/export-material-json.test.ts`

**Step 1: Write the failing tests**

Replace the entire test file with tests that validate the new MTB-compatible structure:

```typescript
import { describe, it, expect } from 'vitest'
import { generateMaterialJson } from '../export-material-json'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateMaterialJson', () => {
  const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
  const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
  const parsed = JSON.parse(json)

  it('includes MTB top-level metadata fields', () => {
    expect(parsed).toHaveProperty('description')
    expect(parsed).toHaveProperty('seed')
    expect(parsed).toHaveProperty('coreColors')
    expect(parsed).toHaveProperty('extendedColors')
    expect(parsed).not.toHaveProperty('source')
  })

  it('seed is the primary palette shade-600 hex', () => {
    expect(parsed.seed).toMatch(/^#[0-9A-F]{6}$/)
    expect(parsed.seed).toBe('#2563EB')
  })

  it('coreColors contains all 5 MTB palette families', () => {
    expect(Object.keys(parsed.coreColors)).toEqual(
      expect.arrayContaining(['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant'])
    )
    for (const hex of Object.values(parsed.coreColors)) {
      expect(hex).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('extendedColors is an empty array', () => {
    expect(parsed.extendedColors).toEqual([])
  })

  it('produces valid scheme structure with all 6 schemes', () => {
    expect(parsed).toHaveProperty('schemes')
    expect(parsed.schemes).toHaveProperty('light')
    expect(parsed.schemes).toHaveProperty('dark')
    expect(parsed.schemes).toHaveProperty('light-medium-contrast')
    expect(parsed.schemes).toHaveProperty('light-high-contrast')
    expect(parsed.schemes).toHaveProperty('dark-medium-contrast')
    expect(parsed.schemes).toHaveProperty('dark-high-contrast')
  })

  it('includes all 49 color roles per scheme', () => {
    expect(Object.keys(parsed.schemes.light)).toHaveLength(49)
    expect(parsed.schemes.light).toHaveProperty('primary')
    expect(parsed.schemes.light).toHaveProperty('surfaceContainerHighest')
    expect(parsed.schemes.light).toHaveProperty('primaryFixed')
  })

  it('uses uppercase hex values with # prefix in schemes', () => {
    expect(parsed.schemes.light.primary).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('palettes use M3 tone keys (0-100) not Tailwind shade keys', () => {
    const toneKeys = Object.keys(parsed.palettes.primary)
    // Must have M3 tone numbers, not Tailwind shade names
    expect(toneKeys).toContain('0')
    expect(toneKeys).toContain('10')
    expect(toneKeys).toContain('40')
    expect(toneKeys).toContain('90')
    expect(toneKeys).toContain('100')
    // Must NOT have Tailwind shade names
    expect(toneKeys).not.toContain('50')  // '50' is a Tailwind shade; M3 tone 50 maps from shade 500
    expect(toneKeys).not.toContain('200')
    expect(toneKeys).not.toContain('white')
    expect(toneKeys).not.toContain('black')
  })

  it('palettes include MTB families: primary, secondary, tertiary, neutral, neutral-variant', () => {
    expect(parsed.palettes).toHaveProperty('primary')
    expect(parsed.palettes).toHaveProperty('secondary')
    expect(parsed.palettes).toHaveProperty('tertiary')
    expect(parsed.palettes).toHaveProperty('neutral')
    expect(parsed.palettes).toHaveProperty('neutral-variant')
  })

  it('palette hex values are uppercase with # prefix', () => {
    expect(parsed.palettes.primary['40']).toMatch(/^#[0-9A-F]{6}$/)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/export-material-json.test.ts`
Expected: Multiple FAIL — `seed` not found, palette keys still use Tailwind shades, etc.

**Step 3: Commit the failing tests**

```bash
git add src/lib/__tests__/export-material-json.test.ts
git commit -m "test: update Material JSON tests for MTB-compatible format"
```

---

### Task 2: Add shade-to-tone mapping constant

**Files:**
- Modify: `src/lib/export-material-json.ts`

**Step 1: Add the SHADE_TO_TONE mapping**

Add this constant at the top of the file (after imports):

```typescript
/** Maps Tailwind shade names to M3 tone values. Inverse of the mapping in docs/tone-shade-mapping.md */
const SHADE_TO_TONE: Record<string, string> = {
  'black': '0',
  '950': '0',
  '900': '10',
  '800': '20',
  '700': '30',
  '600': '40',
  '500': '50',
  '400': '60',
  '300': '70',
  '200': '80',
  '100': '90',
  '50': '95',
  'white': '100',
}
```

No test to run yet — this is a constant used by the next step.

**Step 2: Commit**

```bash
git add src/lib/export-material-json.ts
git commit -m "feat: add Tailwind shade to M3 tone mapping constant"
```

---

### Task 3: Rewrite buildPalettes to use M3 tone keys and MTB families

**Files:**
- Modify: `src/lib/export-material-json.ts`

**Step 1: Rewrite the `buildPalettes` function**

Replace the existing `buildPalettes` function with:

```typescript
function buildPalettes(config: PaletteConfig): Record<string, Record<string, string>> {
  const palettes: Record<string, Record<string, string>> = {}

  // MTB expects: primary, secondary, tertiary, neutral, neutral-variant
  // We have: primary, secondary, tertiary, error, neutral
  // Map neutral to both 'neutral' and 'neutral-variant'; exclude 'error'
  const familyMap: Record<string, string[]> = {
    primary: ['primary'],
    secondary: ['secondary'],
    tertiary: ['tertiary'],
    neutral: ['neutral', 'neutral-variant'],
  }

  for (const [sourceName, targetNames] of Object.entries(familyMap)) {
    const palette = config.palettes[sourceName]
    if (!palette) continue

    const tones: Record<string, string> = {}
    for (const [shade, value] of Object.entries(palette.shades)) {
      const tone = SHADE_TO_TONE[shade]
      if (tone !== undefined) {
        tones[tone] = toUpperHex(value.hex)
      }
    }
    // Include interpolated shades converted to tones
    const interpolated = config.interpolated?.[sourceName]
    if (interpolated) {
      for (const [shade, value] of Object.entries(interpolated)) {
        const tone = SHADE_TO_TONE[shade]
        if (tone !== undefined) {
          tones[tone] = toUpperHex(value.hex)
        }
      }
    }

    for (const targetName of targetNames) {
      palettes[targetName] = { ...tones }
    }
  }

  return palettes
}
```

**Step 2: Run the palette-related tests**

Run: `npx vitest run src/lib/__tests__/export-material-json.test.ts`
Expected: Palette tests should now pass. Top-level metadata tests still fail.

**Step 3: Commit**

```bash
git add src/lib/export-material-json.ts
git commit -m "feat: convert palette keys to M3 tones and add neutral-variant"
```

---

### Task 4: Add top-level MTB metadata and finalize export

**Files:**
- Modify: `src/lib/export-material-json.ts`

**Step 1: Rewrite `generateMaterialJson` to add metadata**

Replace the existing `generateMaterialJson` function with:

```typescript
export function generateMaterialJson(
  config: PaletteConfig,
  mapping: ThemeMapping,
): string {
  const schemes: Record<string, Record<string, string>> = {
    'light': resolveScheme(config, mapping.light),
    'dark': resolveScheme(config, mapping.dark),
    'light-medium-contrast': resolveScheme(config, mapping.mediumContrast.light),
    'dark-medium-contrast': resolveScheme(config, mapping.mediumContrast.dark),
    'light-high-contrast': resolveScheme(config, mapping.highContrast.light),
    'dark-high-contrast': resolveScheme(config, mapping.highContrast.dark),
  }

  // seed = primary palette's shade 600 (tone 40, the "source" color)
  const seed = toUpperHex(config.palettes.primary?.shades['600']?.hex ?? '#000000')

  // coreColors = tone 40 (shade 600) for each MTB palette family
  const coreColors: Record<string, string> = {
    primary: toUpperHex(config.palettes.primary?.shades['600']?.hex ?? '#000000'),
    secondary: toUpperHex(config.palettes.secondary?.shades['600']?.hex ?? '#000000'),
    tertiary: toUpperHex(config.palettes.tertiary?.shades['600']?.hex ?? '#000000'),
    neutral: toUpperHex(config.palettes.neutral?.shades['600']?.hex ?? '#000000'),
    neutralVariant: toUpperHex(config.palettes.neutral?.shades['600']?.hex ?? '#000000'),
  }

  const output = {
    description: 'Palette Bridge export',
    seed,
    coreColors,
    extendedColors: [] as unknown[],
    schemes,
    palettes: buildPalettes(config),
  }

  return JSON.stringify(output, null, 2)
}
```

**Step 2: Run all tests**

Run: `npx vitest run src/lib/__tests__/export-material-json.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/export-material-json.ts
git commit -m "feat: add MTB metadata (seed, coreColors, extendedColors)"
```

---

### Task 5: Run full test suite and type check

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors.

**Step 4: Commit any fixes if needed, then final commit**

If all green, no commit needed for this task.

---

### Task 6: Manual verification with sample output

**Files:** None (verification only)

**Step 1: Inspect the exported JSON structure**

Create a quick script or use the dev server to trigger an export, then verify the output matches the MTB structure:
- Has `seed`, `coreColors`, `extendedColors` at top level
- `palettes` keys are M3 tones (`0`, `10`, `20`... not `50`, `100`, `200`...)
- `palettes` has `neutral-variant` and no `error`
- `schemes` still has all 6 schemes with 49 roles each
- No `source` field

This can also be verified by adding a quick `console.log` in the test or by reading the test assertions carefully.
