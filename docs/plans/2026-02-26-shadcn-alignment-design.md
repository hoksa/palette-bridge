# shadcn/ui Alignment — Full Visual Audit

After migrating to shadcn/ui primitives (commit 902ad1a), the component-level usage is correct but the application-level styling still uses hardcoded Tailwind gray utilities instead of shadcn's CSS variable system. This design covers token alignment, spacing/typography normalization, Card component adoption, and CSS cleanup.

## Section 1: Color Token Replacements

Replace all hardcoded Tailwind gray colors with shadcn semantic tokens:

| Current | Replacement | Where |
|---------|-------------|-------|
| `bg-gray-50` | `bg-muted` | App.tsx page background |
| `bg-white` (header) | `bg-background` | App.tsx header |
| `bg-white` (container) | `bg-background` | ExportPanel container |
| `border-gray-200` | `border-border` | App.tsx header, ExportPanel |
| `text-gray-900` | `text-foreground` | App.tsx h1 |
| `text-gray-700` | `text-foreground` | ExportPanel h2, PaletteEditor h2 |
| `text-gray-600` | `text-muted-foreground` | PaletteEditor palette labels |
| `text-gray-500` | `text-muted-foreground` | App.tsx subtitle, ExportPanel label |
| `border-black/10` | `border-border` | MappingTable swatch border |
| `#e0e0e0` fallback | remove (CSS already sets `border-border` globally) | ThemePreview |

ThemePreview inline `style={{ backgroundColor: c.primary }}` etc. remain — those are dynamic M3 preview colors, not app chrome. The `#ffffff`/`#000000` fallbacks in ThemePreview also stay as M3 palette-data fallbacks.

## Section 2: Spacing & Typography Normalization

### Border radius

| Current | Normalize to | Where |
|---------|-------------|-------|
| `rounded-xl` | `rounded-lg` | ThemePreview outer wrapper |
| `rounded-xl` | `rounded-lg` | ThemePreview inner card, error block |
| `rounded-2xl` | `rounded-xl` | ThemePreview FAB elements |
| `rounded-full` | keep | M3 pill-shaped buttons/chips (intentional) |
| `rounded` | `rounded-sm` | PaletteEditor swatch cells |
| `rounded-lg` | keep | ExportPanel, MappingTable (already correct) |

### Typography

| Current | Normalize to | Where |
|---------|-------------|-------|
| `text-xl font-bold` | `text-xl font-semibold tracking-tight` | App.tsx h1 |
| `text-lg font-semibold` | keep | Section headings |

### Spacing

| Current | Normalize to | Where |
|---------|-------------|-------|
| `px-6 py-4` | `px-6 py-3` | App.tsx header (tighten to match shadcn compact feel) |

All other spacing (`space-y-6`, `gap-6`, `gap-2`, etc.) is already consistent with Tailwind's 4px scale.

## Section 3: ThemePreview Card Component

Install shadcn Card (`npx shadcn@latest add card`) and wrap each ThemePreview in Card/CardHeader/CardContent.

The Card's visual styling (background, border, text) still comes from dynamic M3 `resolvedColors` via inline styles. Card provides structure and semantic markup, not color tokens.

```tsx
// Before
<div className="rounded-xl p-4 space-y-4 border" style={{ backgroundColor, color, borderColor }}>
  <h3 className="text-sm font-semibold opacity-60">{label} Preview</h3>
  {/* content */}
</div>

// After
<Card className="overflow-hidden" style={{ backgroundColor, color, borderColor }}>
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-semibold opacity-60">{label} Preview</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* content */}
  </CardContent>
</Card>
```

The inner M3 preview card mock-up stays as a plain `div`.

## Section 4: CSS Variable Cleanup

Remove unused variables from `src/index.css` (both `:root` and `.dark` blocks, plus `@theme inline`):

- `--chart-1` through `--chart-5` — no charts in this app
- `--sidebar` through `--sidebar-ring` — no sidebar

This removes ~36 lines of dead CSS. `npx shadcn@latest add sidebar` re-adds them if needed.

## Files Changed

- `src/index.css` — remove unused CSS variables
- `src/App.tsx` — token replacements, typography, header spacing
- `src/components/ExportPanel.tsx` — token replacements
- `src/components/PaletteEditor.tsx` — token replacements, border-radius
- `src/components/ThemePreview.tsx` — Card component, border-radius, remove hex fallback
- `src/components/MappingTable.tsx` — swatch border token
- `src/components/ui/card.tsx` — new (installed via shadcn CLI)
