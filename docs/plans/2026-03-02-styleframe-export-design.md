# Styleframe DTCG Export

## Problem

Material Theme Builder (MTB) overrides the `primary` scheme role and regenerates all palette tones when importing our Material JSON. We cannot prevent this — it's MTB's intended behavior. To get exact color values from Palette Bridge into Figma variables, we need to bypass MTB entirely and import directly using the Styleframe Figma plugin.

## Approach

Add a new export format that produces a single DTCG JSON file matching the exact structure that Styleframe exports from Figma. The user drops this file into Styleframe's Import tab in Figma, and all 309 variables are created/updated with correct values across 6 modes.

## Format Specification

Based on an actual Styleframe export from the user's Figma file:

### Top-level structure

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "$extensions": {
    "dev.styleframe": {
      "collection": "<collection-name>",
      "modes": ["Light", "Light High Contrast", "Light Medium Contrast", "Dark", "Dark High Contrast", "Dark Medium Contrast"]
    }
  },
  "Schemes": { ... },
  "Surfaces": { ... },
  "Palettes": { ... },
  "State Layers": { ... },
  "$modifiers": { ... }
}
```

### Token groups

| Group | Tokens | Modes | Description |
|-------|--------|-------|-------------|
| Schemes | 49 | 6 (via $modifiers) | M3 semantic color roles |
| Surfaces | 5 | 6 (via $modifiers) | Surface tint at 5%, 8%, 11%, 12%, 14% opacity |
| Palettes | 108 | 1 (invariant) | 6 families × 18 tones |
| State Layers | 147 | 6 (via $modifiers) | 49 roles × 3 opacity levels (8%, 10%, 16%) |
| **Total** | **309** | | |

### Mode handling

- Root-level tokens represent the **Light** (base/default) mode
- `$modifiers.theme.contexts` contains **sparse overrides** for the other 5 modes
- Only tokens that differ from the base Light value appear in overrides
- Palettes are mode-invariant (no overrides)

### Token naming

- **Title Case with Spaces**: "Primary Container", "On Primary", "Surface Variant"
- **Palette tokens**: "Primary 40", "Neutral Variant 95" (family + space + tone)
- **Surface tokens**: "Surface Tint 5%", "Surface Tint 8%", etc.
- **State Layer sub-tokens**: "Opacity-08", "Opacity-10", "Opacity-16"

### Derived values

- **Surfaces**: surfaceTint hex + alpha byte
  - 5% = `0d`, 8% = `14`, 11% = `1c`, 12% = `1f`, 14% = `24`
- **State Layers**: each scheme role hex + alpha byte
  - 8% = `14`, 10% = `1a`, 16% = `29`
- Alpha bytes are computed as `Math.round(percentage / 100 * 255)` → 2-digit hex

### Palette families mapping

| Styleframe Name | Source Palette | Notes |
|-----------------|---------------|-------|
| Primary | primary | |
| Secondary | secondary | |
| Tertiary | tertiary | |
| Error | error | |
| Neutral | neutral | |
| Neutral Variant | neutral (copy) | Same source as neutral |

## Implementation

### Files

- `src/lib/export-styleframe.ts` — Export function
- `src/lib/__tests__/export-styleframe.test.ts` — Tests
- `src/components/ExportPanel.tsx` — Add Styleframe button

### Function signature

```typescript
export function generateStyleframeJson(
  config: PaletteConfig,
  mapping: ThemeMapping,
  collectionName?: string,
): string
```

### Key implementation details

1. **Role name mapping**: Convert camelCase M3 role names to Title Case ("primaryContainer" → "Primary Container", "onPrimary" → "On Primary", "inverseSurface" → "Inverse Surface")
2. **Scheme resolution**: Resolve all 6 schemes (standard/medium/high × light/dark) using existing `resolveShadeRef`
3. **Sparse modifiers**: Compare each non-Light scheme value against Light base; only include in overrides if different
4. **Palette tones**: Reuse SHADE_TO_TONE and NEAREST_TONE_FILL from material-json export; format as "Family Tone" tokens
5. **Surface tint**: Use the resolved `surfaceTint` role value + fixed alpha percentages
6. **State layers**: Use each of the 49 resolved scheme role values + 3 fixed alpha percentages

### Reusable from export-material-json.ts

- `SHADE_TO_TONE` mapping
- `NEAREST_TONE_FILL` mapping
- `toUpperHex()` helper (though Styleframe uses lowercase hex — need to check)

**Note**: Styleframe export uses **lowercase** hex values (`#34618d`), not uppercase. Our Material JSON export uses uppercase. The Styleframe exporter should use lowercase.

## Testing

- Structure: verify $schema, $extensions, top-level groups
- Schemes: 49 tokens, Title Case names, hex format
- Palettes: 108 tokens (6 × 18), mode-invariant, "Family Tone" naming
- Surfaces: 5 tokens, 8-digit hex with alpha
- State Layers: 49 groups × 3 sub-tokens, 8-digit hex
- Modifiers: sparse (only differing values), 5 contexts
- Round-trip: import into Styleframe should match structure
