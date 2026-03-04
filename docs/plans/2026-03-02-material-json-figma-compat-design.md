# Material JSON Export: Figma Compatibility

## Problem

The Material JSON export from Palette Bridge is not accepted by Figma's Material Theme Builder plugin (or the web version). The plugin silently ignores the file because the structure doesn't match the expected format.

## Root cause

Three structural mismatches between our output and the Material Theme Builder JSON format:

1. **Missing top-level fields**: MTB expects `seed`, `coreColors`, `extendedColors`. We have `source` (which MTB doesn't recognize).
2. **Palette keys use Tailwind shades instead of M3 tones**: We output `50, 100, 200...950, white, black`. MTB expects `0, 5, 10, 15...95, 98, 99, 100`.
3. **Missing `neutral-variant` palette**: MTB expects 5 palettes (`primary`, `secondary`, `tertiary`, `neutral`, `neutral-variant`). We output `primary`, `secondary`, `tertiary`, `error`, `neutral`.

The `schemes` section is already structurally correct — same 6 scheme keys and same 49 role names.

## Approach

Structural alignment only — convert our existing data to match MTB's expected shape. No new dependencies, no HCT algorithm, no additional tone interpolation.

## Changes

### Top-level metadata

- Add `seed`: primary palette's shade-600 hex (tone 40 equivalent, the "source" color)
- Add `coreColors`: `{ primary, secondary, tertiary, neutral, neutralVariant }` — each family's shade-600 hex
- Add `extendedColors`: empty array `[]`
- Remove `source` field

### Palette key conversion

Invert the tone-shade mapping from `docs/tone-shade-mapping.md`:

| Tailwind shade | M3 tone |
|---|---|
| black / 950 | 0 |
| 900 | 10 |
| 800 | 20 |
| 700 | 30 |
| 600 | 40 |
| 500 | 50 |
| 400 | 60 |
| 300 | 70 |
| 200 | 80 |
| 100 | 90 |
| 50 | 95 |
| white | 100 |

Tones 5, 15, 25, 35, 98, 99 are omitted (no corresponding Tailwind shade). If MTB requires all 18 stops, this can be addressed in a follow-up with OKLCH interpolation.

### Palette families

- Output `neutral-variant` as a copy of `neutral` (we don't maintain a separate neutral-variant palette)
- Exclude `error` from the `palettes` section (MTB doesn't include it there; error colors are still present in `schemes`)

### Schemes

No changes — already matches MTB format.

## Files affected

- `src/lib/export-material-json.ts` — rewrite export structure
- `src/lib/__tests__/export-material-json.test.ts` — update tests

## Risks

- MTB may reject palettes with fewer than 18 tone stops. Mitigation: test with the actual Figma plugin after implementation. If it fails, follow up with interpolation for the 6 missing stops.
- `neutral-variant` duplication is an approximation. In true M3, neutral-variant has slightly more chroma than neutral.
