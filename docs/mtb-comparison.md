# Palette Bridge vs Material Theme Builder

This document describes how Palette Bridge's color pipeline differs from Material Theme Builder (MTB) and what that means for teams using the Material 3 Design Kit in Figma alongside Palette Bridge exports in code.

## Core design principle: no processing between input and output

Palette Bridge has a direct, transparent pipeline: the colors you paste into the palette swatches are the exact colors that end up in the exported M3 variables. There is no post-processing, no behind-the-scenes blending, and no derived color generation. Every M3 role resolves to a specific shade from a specific palette — the hex value the user provided is the hex value in the export.

This means if a user wants surface colors to carry a tint of their primary color, they build that into the neutral palette itself — for example, by providing a custom neutral scale with a warm or cool undertone baked in. Palette Bridge will faithfully assign those shades to surface roles without modifying them. The tool maps; it does not transform.

This is a deliberate design decision. It gives users full control and complete predictability: changing the primary palette never silently shifts surface colors, and the exported theme is always auditable back to the source palettes.

## How MTB generates colors

MTB uses Google's [material-color-utilities](https://github.com/material-foundation/material-color-utilities) library, which operates in the HCT color space (Hue, Chroma, Tone). From a single seed color it generates five tonal palettes:

| Palette | Hue source | Chroma | Purpose |
|---------|-----------|--------|---------|
| Primary (a1) | seed | ~48 | Main accent |
| Secondary (a2) | seed | 16 | Muted accent |
| Tertiary (a3) | seed + 60° | 24 | Complementary accent |
| Neutral (n1) | seed | **4** | Surfaces, backgrounds |
| Neutral variant (n2) | seed | **8** | Surface variants, outlines |

The critical detail: **neutral palettes inherit the seed color's hue** at very low chroma. A blue primary produces neutrals with a subtle cool-blue wash. An orange primary produces warm-tinted neutrals. Surface roles (`surface`, `surfaceDim`, `surfaceContainer*`, etc.) draw from the neutral palette (n1), so they always carry a faint tint of the primary color.

## How Palette Bridge maps colors

Palette Bridge does not generate palettes from a seed. It takes **user-provided Tailwind CSS palettes** as direct input and maps them straight to M3 roles:

1. The user supplies complete shade scales for each palette family (primary, secondary, tertiary, error, neutral).
2. Each M3 role is assigned to a specific palette and shade — e.g., `surface` → `neutral.50`, `primary` → `primary.600`.
3. At export time, each role resolves to a hex value via direct lookup: role → (palette name, shade) → hex from the user's input.
4. OKLCH interpolation can generate intermediate shades between existing ones within the same palette when finer granularity is needed. It does not blend across palettes.

## The difference in practice

| Aspect | Material Theme Builder | Palette Bridge |
|--------|----------------------|----------------|
| Input | 1–5 seed colors | Complete Tailwind shade scales |
| Neutral generation | Derived from primary hue at chroma 4 | User-provided neutral palette (e.g. Tailwind slate) |
| Surface tinting | Implicit — surfaces carry primary hue | None — surfaces are pure neutral |
| Color harmony | Automatic via shared hue lineage | Manual — user ensures palettes work together |
| Control | Limited (seed in, system out) | Full (every shade is explicit) |

## Figma alignment considerations

This difference creates a practical gap when using the **Material 3 Design Kit in Figma** alongside Palette Bridge exports in code.

### The problem

The M3 Design Kit in Figma uses MTB's algorithm internally. When you configure it with a primary color, it generates surface variables with the tinted-neutral behavior described above. If your codebase uses Palette Bridge exports (pure neutral surfaces), the two will not match exactly:

- **Figma** (M3 kit): `surfaceContainer` = neutral with subtle primary tint
- **Code** (Palette Bridge export): `surfaceContainer` = your pure slate/neutral shade

The visual difference is subtle (chroma 4 is barely perceptible) but measurable, and it compounds across the full set of ~13 surface-related tokens.

### Recommended workflow

To align Figma with Palette Bridge exports:

1. **Override the M3 kit's surface variables in Figma.** After configuring the kit with your brand colors, manually replace the generated surface/neutral color variables with the exact hex values from your Palette Bridge export. The Material JSON export format is useful for this — it lists all role values per scheme.
2. **Target these specific roles for override** (they all use the neutral palette):
   - `surface`, `onSurface`
   - `surfaceDim`, `surfaceBright`
   - `surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`
   - `surfaceVariant`, `onSurfaceVariant`
   - `inverseSurface`, `inverseOnSurface`
   - `outline`, `outlineVariant` (these use neutralVariant in MTB, which also carries tinting)
3. **Leave accent roles alone** if they already match your Palette Bridge configuration. The primary, secondary, tertiary, and error families don't have the tinting discrepancy — the gap is specific to neutral-derived roles.

### Why Palette Bridge does not add tinting

This follows from the core principle: Palette Bridge maps, it does not transform. Users who want tinted surfaces can build that tint into their neutral palette — the tool will faithfully pass those values through. The trade-off is that users must ensure their palettes harmonize with each other, which MTB handles automatically. For brand-first workflows where the neutral scale is a conscious design choice, this is the intended behavior.

## Related docs

- [Tone-shade mapping](./tone-shade-mapping.md) — how M3 tonal values map to Tailwind shades
- `src/data/contrast-shifts.ts` — all default role-to-shade assignments
- `src/lib/palette.ts` — shade resolution logic used at export time
