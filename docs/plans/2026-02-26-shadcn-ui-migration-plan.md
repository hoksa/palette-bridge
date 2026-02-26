# shadcn/ui Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all custom UI primitives with shadcn/ui components for accessibility, focus management, and keyboard navigation.

**Architecture:** Big-bang migration of 6 component files. shadcn/ui init sets up the foundation (CSS variables, cn() helper, @/ alias). Then install 10 shadcn components and rewrite each file to use them. ShadeSelector merges into MappingTable's Popover pattern. ThemePreview and all business logic untouched.

**Tech Stack:** React 19, Tailwind CSS 4, shadcn/ui (Radix primitives), TypeScript 5.9 strict

---

### Task 1: Initialize shadcn/ui

**Files:**
- Modify: `tsconfig.app.json`
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Create: `components.json`
- Create: `src/lib/utils.ts`

**Step 1: Add @/ path alias to tsconfig.app.json**

Add `baseUrl` and `paths` to `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 2: Add @/ resolve alias to vite.config.ts**

```typescript
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
```

**Step 3: Run shadcn init**

Run: `npx shadcn@latest init -d`

If the interactive init doesn't detect the right settings, run with explicit flags:
```bash
npx shadcn@latest init --style new-york --base-color slate --css-variables
```

This should create:
- `components.json` — shadcn config pointing to `src/components/ui`
- `src/lib/utils.ts` — `cn()` helper (tailwind-merge + clsx)
- Updated `src/index.css` — CSS variables for shadcn theme
- Install dependencies: `tailwind-merge`, `clsx`, `class-variance-authority`

**Step 4: Verify the setup compiles**

Run: `npx tsc -b --noEmit`
Expected: No errors

Run: `npm run dev` (quick visual check, then kill)
Expected: App loads without errors

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: initialize shadcn/ui with slate base"
```

---

### Task 2: Install all shadcn/ui components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/toggle-group.tsx`
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/collapsible.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/tooltip.tsx`

**Step 1: Install all components in one batch**

Run:
```bash
npx shadcn@latest add button tabs toggle-group popover table collapsible input label badge tooltip
```

This installs the component files into `src/components/ui/` and adds Radix dependencies to `package.json`.

**Step 2: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: install shadcn/ui components"
```

---

### Task 3: Migrate App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Rewrite App.tsx**

Replace the entire App.tsx with:

```tsx
import { useMemo } from 'react'
import { useThemeMapping } from './hooks/useThemeMapping'
import { resolveAllRoles } from './lib/palette'
import { PaletteEditor } from './components/PaletteEditor'
import { MappingTable } from './components/MappingTable'
import { ThemePreview } from './components/ThemePreview'
import { ExportPanel } from './components/ExportPanel'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

function App() {
  const { state, dispatch } = useThemeMapping()

  const lightResolved = useMemo(
    () => resolveAllRoles(
      state.paletteConfig,
      state.activeContrastLevel === 'standard'
        ? state.themeMapping.light
        : state.activeContrastLevel === 'medium'
          ? state.themeMapping.mediumContrast.light
          : state.themeMapping.highContrast.light,
    ),
    [state],
  )

  const darkResolved = useMemo(
    () => resolveAllRoles(
      state.paletteConfig,
      state.activeContrastLevel === 'standard'
        ? state.themeMapping.dark
        : state.activeContrastLevel === 'medium'
          ? state.themeMapping.mediumContrast.dark
          : state.themeMapping.highContrast.dark,
    ),
    [state],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Palette Bridge</h1>
            <p className="text-sm text-gray-500">Map Tailwind palettes to Material Design 3 color roles</p>
          </div>
          <ToggleGroup
            type="single"
            value={state.activeThemeMode}
            onValueChange={(value) => {
              if (value) dispatch({ type: 'SET_THEME_MODE', payload: value as 'light' | 'dark' })
            }}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <PaletteEditor paletteConfig={state.paletteConfig} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <MappingTable state={state} dispatch={dispatch} />
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <ThemePreview resolvedColors={lightResolved} themeMode="light" />
            <ThemePreview resolvedColors={darkResolved} themeMode="dark" />
          </div>
        </div>

        <ExportPanel state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}

export default App
```

Key changes:
- Removed `useEffect` import and the keyboard shortcut effect entirely
- Replaced two `<button>` elements with `<ToggleGroup type="single">` + two `<ToggleGroupItem>`
- Guard against empty string in `onValueChange` (Radix sends `""` when deselecting)

**Step 2: Add TooltipProvider to main.tsx**

Wrap `<App />` with `<TooltipProvider>` (needed for all Tooltip components later):

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
)
```

**Step 3: Verify**

Run: `npx tsc -b --noEmit`
Expected: No errors

Run: `npm run dev` (visual check: header shows toggle group for Light/Dark)

**Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: migrate App.tsx to shadcn ToggleGroup, remove keyboard shortcuts"
```

---

### Task 4: Migrate ContrastBadge.tsx

**Files:**
- Modify: `src/components/ContrastBadge.tsx`

**Step 1: Rewrite ContrastBadge.tsx**

```tsx
import { contrastRatio, meetsWCAG } from '../lib/contrast'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ContrastBadgeProps {
  fgHex: string
  bgHex: string
}

const LEVEL_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'AAA': 'default',
  'AA': 'secondary',
  'AA-large': 'outline',
  'fail': 'destructive',
}

export function ContrastBadge({ fgHex, bgHex }: ContrastBadgeProps) {
  const ratio = contrastRatio(fgHex, bgHex)
  const level = meetsWCAG(ratio)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={LEVEL_VARIANTS[level]} className="font-mono text-[10px] gap-1 cursor-default">
          <span className="font-semibold">{ratio.toFixed(1)}:1</span>
          <span className="opacity-75">{level}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fgHex} on {bgHex}</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

Key changes:
- `<span>` → `<Badge>` with variant mapped to WCAG level
- `title` attribute → `<Tooltip>` with proper accessible content
- Custom color classes (bg-green-100 etc.) replaced by Badge variants

**Step 2: Verify**

Run: `npx tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ContrastBadge.tsx
git commit -m "feat: migrate ContrastBadge to shadcn Badge + Tooltip"
```

---

### Task 5: Migrate ExportPanel.tsx

**Files:**
- Modify: `src/components/ExportPanel.tsx`

**Step 1: Rewrite ExportPanel.tsx**

```tsx
import { useState, useRef } from 'react'
import type { AppState, AppAction } from '../types'
import { generateColorKt, generateThemeKt } from '../lib/export-kotlin'
import { generateMaterialJson } from '../lib/export-material-json'
import { generateTokensStudio } from '../lib/export-tokens-studio'
import { generateCss } from '../lib/export-css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExportPanelProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

function download(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportPanel({ state, dispatch }: ExportPanelProps) {
  const [packageName, setPackageName] = useState('com.example.ui.theme')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { paletteConfig, themeMapping } = state

  function exportKotlin() {
    const colorKt = generateColorKt(paletteConfig, themeMapping, packageName)
    const themeKt = generateThemeKt(packageName)
    download('Color.kt', colorKt)
    setTimeout(() => download('Theme.kt', themeKt), 100)
  }

  function exportMaterialJson() {
    const json = generateMaterialJson(paletteConfig, themeMapping)
    download('material-theme.json', json, 'application/json')
  }

  function exportTokensStudio() {
    const tokens = generateTokensStudio(paletteConfig, themeMapping)
    download('core.json', tokens.core, 'application/json')
    setTimeout(() => download('light.json', tokens.light, 'application/json'), 100)
    setTimeout(() => download('dark.json', tokens.dark, 'application/json'), 200)
  }

  function exportCss() {
    const css = generateCss(paletteConfig, themeMapping)
    download('theme.css', css, 'text/css')
  }

  function exportMapping() {
    const json = JSON.stringify(state, null, 2)
    download('palette-bridge-mapping.json', json, 'application/json')
  }

  function importMapping() {
    fileInputRef.current?.click()
  }

  function isValidAppState(value: unknown): value is AppState {
    if (typeof value !== 'object' || value === null) return false
    const obj = value as Record<string, unknown>
    if (typeof obj.paletteConfig !== 'object' || obj.paletteConfig === null) return false
    if (typeof obj.themeMapping !== 'object' || obj.themeMapping === null) return false
    if (!['standard', 'medium', 'high'].includes(obj.activeContrastLevel as string)) return false
    if (!['light', 'dark'].includes(obj.activeThemeMode as string)) return false
    if (typeof obj.interpolationEnabled !== 'boolean') return false
    const mapping = obj.themeMapping as Record<string, unknown>
    if (typeof mapping.light !== 'object' || typeof mapping.dark !== 'object') return false
    if (typeof mapping.mediumContrast !== 'object' || typeof mapping.highContrast !== 'object') return false
    return true
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        if (!isValidAppState(parsed)) {
          alert('Invalid mapping file: missing or malformed fields')
          return
        }
        dispatch({ type: 'LOAD_STATE', payload: parsed })
      } catch {
        alert('Invalid mapping file: not valid JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Export</h2>

      <div className="flex items-center gap-2">
        <Label htmlFor="kotlin-package" className="text-sm text-gray-500 shrink-0">
          Kotlin package:
        </Label>
        <Input
          id="kotlin-package"
          type="text"
          value={packageName}
          onChange={e => setPackageName(e.target.value)}
          className="flex-1 font-mono"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ExportButton label="Kotlin" description="Color.kt + Theme.kt" onClick={exportKotlin} />
        <ExportButton label="Material JSON" description="material-theme.json" onClick={exportMaterialJson} />
        <ExportButton label="Tokens Studio" description="core + light + dark JSON" onClick={exportTokensStudio} />
        <ExportButton label="CSS" description="Custom properties" onClick={exportCss} />
        <ExportButton label="Mapping" description="Save current state" onClick={exportMapping} />
        <ExportButton label="Import" description="Load mapping file" onClick={importMapping} variant="secondary" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  )
}

function ExportButton({ label, description, onClick, variant = 'primary' }: {
  label: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Button
      variant={variant === 'primary' ? 'outline' : 'secondary'}
      onClick={onClick}
      className="h-auto px-3 py-2 text-left flex flex-col items-start"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] opacity-60">{description}</span>
    </Button>
  )
}
```

Key changes:
- `<input>` → `<Input>` + `<Label>` with proper `htmlFor`/`id` association
- Custom `<button>` → shadcn `<Button>` with `variant="outline"` / `variant="secondary"`
- ExportButton sub-component uses `<Button>` with `h-auto` for multi-line content

**Step 2: Verify**

Run: `npx tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "feat: migrate ExportPanel to shadcn Button, Input, Label"
```

---

### Task 6: Migrate ShadeSelector.tsx + MappingTable.tsx

These two are tightly coupled — ShadeSelector becomes content inside MappingTable's Popover.

**Files:**
- Modify: `src/components/ShadeSelector.tsx`
- Modify: `src/components/MappingTable.tsx`

**Step 1: Simplify ShadeSelector.tsx**

Remove the click-outside handler, ref, and absolute positioning. This component now renders *only* the shade grid content — the Popover wrapper lives in MappingTable.

```tsx
import type { PaletteConfig } from '../types'
import { textColor } from '../lib/contrast'
import { Button } from '@/components/ui/button'

interface ShadeSelectorProps {
  paletteConfig: PaletteConfig
  currentPalette: string
  currentShade: string
  onSelect: (palette: string, shade: string) => void
}

const SHADE_ORDER = ['white', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', 'black']
const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const

export function ShadeSelector({ paletteConfig, currentPalette, currentShade, onSelect }: ShadeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Select shade</div>
      {PALETTE_ORDER.map(paletteName => {
        const palette = paletteConfig.palettes[paletteName]
        if (!palette) return null
        return (
          <div key={paletteName}>
            <div className="text-[10px] font-medium text-muted-foreground capitalize mb-0.5">{paletteName}</div>
            <div className="flex gap-0.5 flex-wrap">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                const isSelected = paletteName === currentPalette && shade === currentShade
                return (
                  <Button
                    key={shade}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(paletteName, shade)}
                    className={`w-7 h-7 p-0 text-[8px] font-mono ${
                      isSelected ? 'ring-2 ring-ring ring-offset-1 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: sv.hex, color: textColor(sv.hex) }}
                    aria-label={`${paletteName} ${shade}: ${sv.hex}`}
                    aria-pressed={isSelected}
                  >
                    {shade === 'white' ? 'W' : shade === 'black' ? 'B' : shade}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

Key changes:
- Removed `useRef`, `useEffect`, click-outside listener
- Removed `onClose` prop — Popover handles dismissal
- `<button>` → `<Button variant="ghost" size="sm">`
- Added `aria-label` with full shade name and hex value
- Added `aria-pressed` for selected state
- `title` attribute → `aria-label`
- Used `ring-ring` (shadcn token) instead of `ring-blue-500`
- Used `text-muted-foreground` (shadcn token) instead of `text-gray-500`

**Step 2: Rewrite MappingTable.tsx**

```tsx
import { useState, useMemo } from 'react'
import type { AppState, AppAction, ContrastLevel, M3RoleName, RoleAssignments } from '../types'
import { M3_ROLE_FAMILIES, getRolesByFamily } from '../data/m3-roles'
import { resolveShadeRef } from '../lib/palette'
import { ContrastBadge } from './ContrastBadge'
import { ShadeSelector } from './ShadeSelector'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MappingTableProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

function getAssignments(state: AppState, contrastLevel: ContrastLevel, themeMode: 'light' | 'dark'): RoleAssignments {
  if (contrastLevel === 'standard') return state.themeMapping[themeMode]
  if (contrastLevel === 'medium') return state.themeMapping.mediumContrast[themeMode]
  return state.themeMapping.highContrast[themeMode]
}

export function MappingTable({ state, dispatch }: MappingTableProps) {
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set())

  const { activeContrastLevel, paletteConfig } = state

  const lightAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'light'),
    [state, activeContrastLevel],
  )
  const darkAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'dark'),
    [state, activeContrastLevel],
  )

  function toggleFamily(family: string) {
    setCollapsedFamilies(prev => {
      const next = new Set(prev)
      if (next.has(family)) next.delete(family)
      else next.add(family)
      return next
    })
  }

  function handleShadeSelect(role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) {
    dispatch({
      type: 'SET_ROLE_ASSIGNMENT',
      contrastLevel: activeContrastLevel,
      themeMode,
      role,
      shade: { palette, shade },
    })
  }

  return (
    <div className="space-y-3">
      <Tabs
        value={activeContrastLevel}
        onValueChange={(value) => dispatch({ type: 'SET_CONTRAST_LEVEL', payload: value as ContrastLevel })}
      >
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
          </TabsList>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'RESET_CONTRAST_TO_DEFAULTS', contrastLevel: activeContrastLevel })}
          >
            Reset to defaults
          </Button>
        </div>

        {/* All three TabsContent share the same table, just different data */}
        {(['standard', 'medium', 'high'] as const).map(level => (
          <TabsContent key={level} value={level}>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Role</TableHead>
                    <TableHead className="w-28 text-center">Light</TableHead>
                    <TableHead className="w-28 text-center">Dark</TableHead>
                    <TableHead className="w-24 text-center">Light CR</TableHead>
                    <TableHead className="w-24 text-center">Dark CR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {M3_ROLE_FAMILIES.map(family => {
                    const roles = getRolesByFamily(family)
                    const isCollapsed = collapsedFamilies.has(family)
                    return (
                      <FamilySection
                        key={family}
                        family={family}
                        roles={roles}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleFamily(family)}
                        lightAssignments={lightAssignments}
                        darkAssignments={darkAssignments}
                        paletteConfig={paletteConfig}
                        onShadeSelect={handleShadeSelect}
                      />
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface FamilySectionProps {
  family: string
  roles: ReturnType<typeof getRolesByFamily>
  isCollapsed: boolean
  onToggle: () => void
  lightAssignments: RoleAssignments
  darkAssignments: RoleAssignments
  paletteConfig: AppState['paletteConfig']
  onShadeSelect: (role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) => void
}

function FamilySection({
  family, roles, isCollapsed, onToggle,
  lightAssignments, darkAssignments, paletteConfig,
  onShadeSelect,
}: FamilySectionProps) {
  // Try Collapsible with asChild for table compat.
  // If this causes DOM nesting issues, remove Collapsible and just
  // render all roles unconditionally (per design fallback).
  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggle()}>
      <TableRow className="bg-muted/50 hover:bg-muted/80 cursor-pointer" onClick={onToggle}>
        <TableCell colSpan={5} className="py-1.5 font-semibold text-muted-foreground capitalize text-xs tracking-wide">
          <CollapsibleTrigger asChild>
            <span>
              {isCollapsed ? '▶' : '▼'} {family} ({roles.length})
            </span>
          </CollapsibleTrigger>
        </TableCell>
      </TableRow>
      <CollapsibleContent>
        {roles.map(role => (
          <RoleRow
            key={role.name}
            role={role}
            lightAssignments={lightAssignments}
            darkAssignments={darkAssignments}
            paletteConfig={paletteConfig}
            onShadeSelect={onShadeSelect}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

interface RoleRowProps {
  role: ReturnType<typeof getRolesByFamily>[number]
  lightAssignments: RoleAssignments
  darkAssignments: RoleAssignments
  paletteConfig: AppState['paletteConfig']
  onShadeSelect: (role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) => void
}

function RoleRow({ role, lightAssignments, darkAssignments, paletteConfig, onShadeSelect }: RoleRowProps) {
  const lightRef = lightAssignments[role.name]
  const darkRef = darkAssignments[role.name]
  const lightHex = lightRef ? resolveShadeRef(paletteConfig, lightRef) : null
  const darkHex = darkRef ? resolveShadeRef(paletteConfig, darkRef) : null

  let lightContrastPair: string | null = null
  let darkContrastPair: string | null = null
  if (role.pairedWith) {
    const pairedLightRef = lightAssignments[role.pairedWith]
    const pairedDarkRef = darkAssignments[role.pairedWith]
    if (pairedLightRef) lightContrastPair = resolveShadeRef(paletteConfig, pairedLightRef)
    if (pairedDarkRef) darkContrastPair = resolveShadeRef(paletteConfig, pairedDarkRef)
  }

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="py-1.5">
        <div className="font-mono text-xs">{role.name}</div>
        <div className="text-[10px] text-muted-foreground">{role.description}</div>
      </TableCell>
      <TableCell className="py-1.5">
        <SwatchCell
          hex={lightHex}
          ref_={lightRef}
          paletteConfig={paletteConfig}
          onSelect={(p, s) => onShadeSelect(role.name, 'light', p, s)}
        />
      </TableCell>
      <TableCell className="py-1.5">
        <SwatchCell
          hex={darkHex}
          ref_={darkRef}
          paletteConfig={paletteConfig}
          onSelect={(p, s) => onShadeSelect(role.name, 'dark', p, s)}
        />
      </TableCell>
      <TableCell className="py-1.5 text-center">
        {lightHex && lightContrastPair && (
          <ContrastBadge fgHex={lightHex} bgHex={lightContrastPair} />
        )}
      </TableCell>
      <TableCell className="py-1.5 text-center">
        {darkHex && darkContrastPair && (
          <ContrastBadge fgHex={darkHex} bgHex={darkContrastPair} />
        )}
      </TableCell>
    </TableRow>
  )
}

interface SwatchCellProps {
  hex: string | null
  ref_: { palette: string; shade: string } | undefined
  paletteConfig: AppState['paletteConfig']
  onSelect: (palette: string, shade: string) => void
}

function SwatchCell({ hex, ref_, paletteConfig, onSelect }: SwatchCellProps) {
  if (!hex || !ref_) return <span className="text-muted-foreground text-xs">-</span>

  return (
    <div className="flex justify-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-auto px-1.5 py-0.5 gap-1.5"
          >
            <div
              className="w-5 h-5 rounded-sm border border-black/10"
              style={{ backgroundColor: hex }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {ref_.shade}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <ShadeSelector
            paletteConfig={paletteConfig}
            currentPalette={ref_.palette}
            currentShade={ref_.shade}
            onSelect={onSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

Key changes:
- Removed `openSelector`/`setOpenSelector` state — Popover manages its own open state
- Contrast level buttons → `<Tabs>` / `<TabsList>` / `<TabsTrigger>` / `<TabsContent>`
- Reset button → `<Button variant="outline" size="sm">`
- Raw `<table>` → shadcn `<Table>` components
- Family header → `<Collapsible>` wrapping table rows (with fallback note)
- SwatchCell → `<Popover>` + `<PopoverTrigger>` (Button) + `<PopoverContent>` (ShadeSelector)
- Removed `isOpen`/`onOpen`/`onClose` props from SwatchCell
- Used shadcn tokens (`text-muted-foreground`, `bg-muted/50`) instead of gray classes
- Extracted `RoleRow` as separate component for clarity

**NOTE on Collapsible-in-Table:** If `<Collapsible>` / `<CollapsibleContent>` renders `<div>` elements inside `<tbody>`, the browser will complain about invalid HTML nesting. If this happens during verification:

**Fallback:** Remove `<Collapsible>`, `<CollapsibleTrigger>`, `<CollapsibleContent>` wrappers. Remove the `collapsedFamilies` state and `toggleFamily` function. Remove the `isCollapsed`/`onToggle` props from `FamilySection`. Render the family header as a static non-clickable `<TableRow>` and always show all roles. Remove the `▶`/`▼` arrows.

**Step 3: Verify**

Run: `npx tsc -b --noEmit`
Expected: No errors

Run: `npm run dev` (visual check: tabs work, table renders, shade popovers open/close)

Check browser console for DOM nesting warnings. If present, apply the Collapsible fallback.

**Step 4: Commit**

```bash
git add src/components/ShadeSelector.tsx src/components/MappingTable.tsx
git commit -m "feat: migrate MappingTable + ShadeSelector to shadcn Tabs, Table, Popover"
```

---

### Task 7: Migrate PaletteEditor.tsx

**Files:**
- Modify: `src/components/PaletteEditor.tsx`

**Step 1: Rewrite PaletteEditor.tsx**

```tsx
import type { PaletteConfig } from '../types'
import { textColor } from '../lib/contrast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PaletteEditorProps {
  paletteConfig: PaletteConfig
}

const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const
const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

export function PaletteEditor({ paletteConfig }: PaletteEditorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-700">Palette Swatches</h2>
      {PALETTE_ORDER.map(name => {
        const palette = paletteConfig.palettes[name]
        if (!palette) return null
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="w-20 text-sm font-medium text-gray-600 capitalize shrink-0">
              {name}
            </span>
            <div className="flex gap-0.5 flex-1 min-w-0">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                return (
                  <Tooltip key={shade}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex-1 min-w-0 h-10 rounded flex flex-col items-center justify-center text-[9px] leading-tight font-mono cursor-default"
                        style={{ backgroundColor: sv.hex, color: textColor(sv.hex) }}
                      >
                        <span className="font-semibold">{shade}</span>
                        <span className="opacity-75 hidden sm:inline">{sv.hex}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{name}-{shade}: {sv.hex}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

Key changes:
- `title` attribute → `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>`
- Added `cursor-default` since swatches aren't clickable
- Swatches stay as styled `<div>`s (display-only)

**Step 2: Verify**

Run: `npx tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/PaletteEditor.tsx
git commit -m "feat: migrate PaletteEditor tooltips to shadcn Tooltip"
```

---

### Task 8: Final verification

**Step 1: Run type check**

Run: `npx tsc -b --noEmit`
Expected: No errors

**Step 2: Run existing tests**

Run: `npx vitest run`
Expected: All tests pass (tests are for pure logic, not components)

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors (fix any unused import warnings)

**Step 4: Run build**

Run: `npm run build`
Expected: Successful build with no errors

**Step 5: Manual visual check**

Run: `npm run dev`

Check:
- Header: ToggleGroup switches between Light/Dark
- Palette swatches: Tooltips appear on hover
- Tabs: Standard/Medium/High switch correctly
- Table: Renders all role families and rows
- Swatch buttons: Popover opens with shade grid, closes on Escape/click-outside
- Contrast badges: Show as shadcn Badge with tooltip
- Export panel: Input with label, buttons render correctly
- Collapsible: Family sections expand/collapse (or are static if fallback applied)
- No console errors or DOM nesting warnings

**Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "fix: address final migration issues"
```

(Skip if no fixes needed.)
