# Custom Palette Input Design

**Date:** 2026-02-27
**Status:** Approved

## Goal

Make palette swatches customizable — currently hard-coded in `src/data/sample-palette.ts`. Users need to paste complete palettes (50–950) from various sources and fine-tune individual shades.

## Design

### Batch Editing (paste)

An edit button at the end of each palette row in `PaletteEditor`. Opens a **Popover** with:
- A textarea for pasting palette colors
- An "Apply" button to parse and merge

**Supported paste formats** (auto-detected):

1. **Plain hex list** — one hex per line, mapped positionally to SHADE_ORDER (50, 100, ..., 950). Partial lists map to the first N shades.
2. **Labeled hex** — lines like `50: #eff6ff` or `'50': '#eff6ff'`. Shade numbers extracted; partial sets work naturally.
3. **CSS custom properties** — lines like `--color-primary-50: #eff6ff;`. Shade number extracted from variable name.
4. **OKLCH values** — same label formats as above but with `oklch(...)` values instead of hex. Converted to hex internally.

**Parsing rules:**
- Lines that don't match any pattern are silently ignored (allows pasting surrounding code)
- If no shade labels are found, values map positionally to SHADE_ORDER
- Only recognized shade names (50, 100, ..., 950) are accepted
- Partial pastes update only matched shades, leaving the rest unchanged

### Individual Swatch Editing (click-to-edit)

Each shade square in the main palette view becomes clickable. Clicking a swatch opens a small **Popover** with a text input pre-filled with the current hex value. Edit, press Enter or blur, and the shade updates. Swatches get a subtle hover state to signal interactivity.

Separated from batch editing to keep the paste popover focused.

### State & Data Flow

No new state management needed:
- Pass `dispatch` to `PaletteEditor` (currently read-only)
- Individual edits: dispatch `SET_PALETTE_CONFIG` with cloned config, one shade changed
- Batch paste: parser returns `Record<string, string>` (shade→hex), merged into target palette
- Persistence already handled by existing localStorage mechanism

### New Code

| File | Purpose |
|------|---------|
| `src/lib/parse-palette-input.ts` | Pure parser: text → `Record<string, string>` (shade→hex) |
| `src/lib/__tests__/parse-palette-input.test.ts` | Tests for all 4 formats + edge cases |
| `src/components/PaletteEditor.tsx` | Modified: accept `dispatch`, add edit button, make swatches clickable |
| `src/components/PalettePastePopover.tsx` | New: textarea + apply button for batch paste |
| `src/components/ShadeEditPopover.tsx` | New: hex input for individual swatch editing |
| `src/App.tsx` | Pass `dispatch` to `PaletteEditor` |

### Out of Scope

- No changes to the shade scale (still 50–950)
- No changes to role assignments or contrast logic
- No palette presets/library
- No drag-and-drop reordering
- White/black special shades are not editable (stay fixed)
