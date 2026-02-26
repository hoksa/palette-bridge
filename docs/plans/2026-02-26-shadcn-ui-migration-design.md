# shadcn/ui Migration Design

Migrate all custom UI primitives to shadcn/ui components for accessibility, focus management, and keyboard navigation. Big-bang approach — all components in one pass.

## Decisions

- **Visual style**: Adopt shadcn/ui defaults (slate base color), tweak later
- **ThemePreview**: Keep as styled divs — visual demos, not interactive UI
- **ShadeSelector**: Replace with shadcn Popover
- **Toasts/feedback**: Out of scope — swap primitives only, no new UX behaviors
- **Keyboard shortcuts**: Remove entirely (1/2/3, L/D were experimental)
- **Collapsible fallback**: If Collapsible-in-Table is problematic, remove collapse feature and show all sections expanded

## Foundation Setup

1. Run `npx shadcn@latest init` — slate base, New York style
2. Set up `@/` path alias in tsconfig + vite config
3. Creates: `components.json`, `src/lib/utils.ts` (cn helper), CSS variables in `src/index.css`
4. Dependencies: `tailwind-merge`, `clsx`, `class-variance-authority`

### shadcn/ui Components to Install

button, tabs, toggle-group, popover, table, collapsible, input, label, badge, tooltip

## Component Migration Map

### App.tsx

- Remove keyboard shortcut `useEffect`
- Replace light/dark button pair with `<ToggleGroup>` (single select)
- Wrap app in `<TooltipProvider>`

### ContrastBadge.tsx

- Replace styled `<span>` with `<Badge>` (variant by pass/fail level)
- Replace `title` attribute with `<Tooltip>`

### ExportPanel.tsx

- Replace `<input type="text">` with `<Input>` + `<Label>` (proper htmlFor/id)
- Replace all export/import buttons with `<Button>` (default + outline variants)
- Hidden file input stays as-is

### MappingTable.tsx

- Replace contrast level buttons with `<Tabs>` / `<TabsList>` / `<TabsTrigger>` / `<TabsContent>`
- Replace reset button with `<Button variant="outline">`
- Replace raw `<table>` with `<Table>` / `<TableHeader>` / `<TableRow>` / `<TableHead>` / `<TableBody>` / `<TableCell>`
- Replace collapsible family rows with `<Collapsible>` (with `asChild` for table compat) — or remove if problematic
- Swatch cell becomes `<Popover>` + `<PopoverTrigger>` (button) + `<PopoverContent>` (shade grid)

### ShadeSelector.tsx

- Simplify to just rendering shade grid inside PopoverContent
- Remove click-outside `useEffect`, `onClose` prop, `position` prop
- Shade buttons become `<Button variant="ghost" size="sm">`
- Dismissal, focus trap, Escape key all handled by Radix Popover

### PaletteEditor.tsx

- Replace `title` attributes on swatches with `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>`
- Swatches stay as styled divs

### ThemePreview.tsx

- No changes

## What Stays Unchanged

- All business logic (`src/lib/`, `src/hooks/`, `src/data/`, `src/types/`)
- State management (`useThemeMapping` reducer, actions, localStorage)
- Export generators (`export-*.ts`)
- Existing tests (`src/lib/__tests__/`)
- Color pipeline (hex -> OKLCH, WCAG contrast)
