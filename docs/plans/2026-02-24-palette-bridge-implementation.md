# Palette Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React web tool that maps Tailwind brand palette shades to Material Design 3 color roles, with live contrast ratio display and export to Kotlin, Material JSON, Tokens Studio JSON, and CSS.

**Architecture:** A single-page React app with `useReducer` + `localStorage` state management. The core data structure is a mapping JSON object (M3 role → palette shade reference). Pure library functions handle contrast calculation, OKLCH interpolation, and export generation. The UI is a table-based mapping editor with a component preview gallery.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Vitest

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tailwind.config.ts`, `postcss.config.js`

**Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

**Step 2: Install Tailwind CSS v4**

Run:
```bash
npm install tailwindcss @tailwindcss/vite
```

Add the Tailwind Vite plugin to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Replace `src/index.css` contents with:

```css
@import "tailwindcss";
```

**Step 3: Install Vitest**

Run:
```bash
npm install -D vitest
```

Add to `vite.config.ts`:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'node',
  },
})
```

**Step 4: Clean up scaffolded files**

- Delete `src/App.css`, `src/assets/`
- Replace `src/App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-2xl font-bold">Palette Bridge</h1>
  </div>
}

export default App
```

**Step 5: Verify it runs**

Run: `npm run dev`
Expected: App loads at localhost with "Palette Bridge" heading, Tailwind styles applied.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Tailwind + TypeScript project"
```

---

### Task 2: TypeScript Types and M3 Role Definitions

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/m3-roles.ts`

**Step 1: Write type definitions**

Create `src/types/index.ts`:

```typescript
export interface ShadeValue {
  hex: string
  oklch?: string
}

export interface Palette {
  shades: Record<string, ShadeValue>
}

export interface InterpolatedShade {
  hex: string
  oklch: string
  source: { between: [string, string]; position: number }
}

export interface PaletteConfig {
  palettes: Record<string, Palette>
  interpolated: Record<string, Record<string, InterpolatedShade>>
}

export interface ShadeRef {
  palette: string
  shade: string
}

export type M3RoleName =
  | 'primary' | 'onPrimary' | 'primaryContainer' | 'onPrimaryContainer'
  | 'secondary' | 'onSecondary' | 'secondaryContainer' | 'onSecondaryContainer'
  | 'tertiary' | 'onTertiary' | 'tertiaryContainer' | 'onTertiaryContainer'
  | 'error' | 'onError' | 'errorContainer' | 'onErrorContainer'
  | 'surface' | 'onSurface' | 'surfaceVariant' | 'onSurfaceVariant'
  | 'surfaceDim' | 'surfaceBright'
  | 'surfaceContainerLowest' | 'surfaceContainerLow' | 'surfaceContainer'
  | 'surfaceContainerHigh' | 'surfaceContainerHighest'
  | 'inverseSurface' | 'inverseOnSurface' | 'inversePrimary'
  | 'outline' | 'outlineVariant'
  | 'scrim' | 'shadow'
  | 'background' | 'onBackground'
  | 'surfaceTint'
  // Fixed colors (JSON export only, not in Kotlin ColorScheme)
  | 'primaryFixed' | 'onPrimaryFixed' | 'primaryFixedDim' | 'onPrimaryFixedVariant'
  | 'secondaryFixed' | 'onSecondaryFixed' | 'secondaryFixedDim' | 'onSecondaryFixedVariant'
  | 'tertiaryFixed' | 'onTertiaryFixed' | 'tertiaryFixedDim' | 'onTertiaryFixedVariant'

export type RoleAssignments = Record<M3RoleName, ShadeRef>

export type ContrastLevel = 'standard' | 'medium' | 'high'

export interface ThemeMapping {
  light: RoleAssignments
  dark: RoleAssignments
  mediumContrast: { light: RoleAssignments; dark: RoleAssignments }
  highContrast: { light: RoleAssignments; dark: RoleAssignments }
}

export type M3RoleFamily = 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface' | 'other'

export interface M3RoleInfo {
  name: M3RoleName
  family: M3RoleFamily
  pairedWith: M3RoleName | null // the "on" counterpart for contrast checking
  description: string
  // Which palette this role typically draws from
  defaultPalette: string
  inKotlinColorScheme: boolean // false for Fixed* roles
}

export interface AppState {
  paletteConfig: PaletteConfig
  themeMapping: ThemeMapping
  activeContrastLevel: ContrastLevel
  activeThemeMode: 'light' | 'dark'
  interpolationEnabled: boolean
}

export type AppAction =
  | { type: 'SET_PALETTE_CONFIG'; payload: PaletteConfig }
  | { type: 'SET_ROLE_ASSIGNMENT'; contrastLevel: ContrastLevel; themeMode: 'light' | 'dark'; role: M3RoleName; shade: ShadeRef }
  | { type: 'SET_CONTRAST_LEVEL'; payload: ContrastLevel }
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }
  | { type: 'RESET_CONTRAST_TO_DEFAULTS'; contrastLevel: ContrastLevel }
  | { type: 'TOGGLE_INTERPOLATION' }
  | { type: 'LOAD_STATE'; payload: AppState }
```

**Step 2: Write M3 role definitions**

Create `src/data/m3-roles.ts`:

```typescript
import type { M3RoleInfo, M3RoleName } from '../types'

// All 49 M3 color roles with metadata
export const M3_ROLES: M3RoleInfo[] = [
  // Primary family
  { name: 'primary', family: 'primary', pairedWith: 'onPrimary', description: 'Primary action color', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'onPrimary', family: 'primary', pairedWith: 'primary', description: 'Text/icon on primary', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'primaryContainer', family: 'primary', pairedWith: 'onPrimaryContainer', description: 'Primary container background', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'onPrimaryContainer', family: 'primary', pairedWith: 'primaryContainer', description: 'Text/icon on primary container', defaultPalette: 'primary', inKotlinColorScheme: true },

  // Secondary family
  { name: 'secondary', family: 'secondary', pairedWith: 'onSecondary', description: 'Secondary action color', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'onSecondary', family: 'secondary', pairedWith: 'secondary', description: 'Text/icon on secondary', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'secondaryContainer', family: 'secondary', pairedWith: 'onSecondaryContainer', description: 'Secondary container background', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'onSecondaryContainer', family: 'secondary', pairedWith: 'secondaryContainer', description: 'Text/icon on secondary container', defaultPalette: 'secondary', inKotlinColorScheme: true },

  // Tertiary family
  { name: 'tertiary', family: 'tertiary', pairedWith: 'onTertiary', description: 'Tertiary action color', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'onTertiary', family: 'tertiary', pairedWith: 'tertiary', description: 'Text/icon on tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'tertiaryContainer', family: 'tertiary', pairedWith: 'onTertiaryContainer', description: 'Tertiary container background', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'onTertiaryContainer', family: 'tertiary', pairedWith: 'tertiaryContainer', description: 'Text/icon on tertiary container', defaultPalette: 'tertiary', inKotlinColorScheme: true },

  // Error family
  { name: 'error', family: 'error', pairedWith: 'onError', description: 'Error color', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'onError', family: 'error', pairedWith: 'error', description: 'Text/icon on error', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'errorContainer', family: 'error', pairedWith: 'onErrorContainer', description: 'Error container background', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'onErrorContainer', family: 'error', pairedWith: 'errorContainer', description: 'Text/icon on error container', defaultPalette: 'error', inKotlinColorScheme: true },

  // Surface family
  { name: 'surface', family: 'surface', pairedWith: 'onSurface', description: 'Default surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onSurface', family: 'surface', pairedWith: 'surface', description: 'Text/icon on surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceVariant', family: 'surface', pairedWith: 'onSurfaceVariant', description: 'Surface variant', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onSurfaceVariant', family: 'surface', pairedWith: 'surfaceVariant', description: 'Text/icon on surface variant', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceDim', family: 'surface', pairedWith: 'onSurface', description: 'Dimmed surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceBright', family: 'surface', pairedWith: 'onSurface', description: 'Bright surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerLowest', family: 'surface', pairedWith: 'onSurface', description: 'Lowest elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerLow', family: 'surface', pairedWith: 'onSurface', description: 'Low elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainer', family: 'surface', pairedWith: 'onSurface', description: 'Default container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerHigh', family: 'surface', pairedWith: 'onSurface', description: 'High elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerHighest', family: 'surface', pairedWith: 'onSurface', description: 'Highest elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'inverseSurface', family: 'surface', pairedWith: 'inverseOnSurface', description: 'Inverse surface (snackbars)', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'inverseOnSurface', family: 'surface', pairedWith: 'inverseSurface', description: 'Text on inverse surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'background', family: 'surface', pairedWith: 'onBackground', description: 'Background', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onBackground', family: 'surface', pairedWith: 'background', description: 'Text/icon on background', defaultPalette: 'neutral', inKotlinColorScheme: true },

  // Other
  { name: 'inversePrimary', family: 'other', pairedWith: 'inverseSurface', description: 'Primary on inverse surface', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'outline', family: 'other', pairedWith: null, description: 'Border/divider', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'outlineVariant', family: 'other', pairedWith: null, description: 'Subtle border', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'scrim', family: 'other', pairedWith: null, description: 'Scrim overlay', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'shadow', family: 'other', pairedWith: null, description: 'Shadow color', defaultPalette: 'neutral', inKotlinColorScheme: false },
  { name: 'surfaceTint', family: 'other', pairedWith: null, description: 'Surface tint (elevation overlay)', defaultPalette: 'primary', inKotlinColorScheme: false },

  // Fixed colors (JSON export only)
  { name: 'primaryFixed', family: 'primary', pairedWith: 'onPrimaryFixed', description: 'Fixed primary (cross-theme)', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'onPrimaryFixed', family: 'primary', pairedWith: 'primaryFixed', description: 'On fixed primary', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'primaryFixedDim', family: 'primary', pairedWith: 'onPrimaryFixed', description: 'Dimmed fixed primary', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'onPrimaryFixedVariant', family: 'primary', pairedWith: 'primaryFixedDim', description: 'On fixed primary variant', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'secondaryFixed', family: 'secondary', pairedWith: 'onSecondaryFixed', description: 'Fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'onSecondaryFixed', family: 'secondary', pairedWith: 'secondaryFixed', description: 'On fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'secondaryFixedDim', family: 'secondary', pairedWith: 'onSecondaryFixed', description: 'Dimmed fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'onSecondaryFixedVariant', family: 'secondary', pairedWith: 'secondaryFixedDim', description: 'On fixed secondary variant', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'tertiaryFixed', family: 'tertiary', pairedWith: 'onTertiaryFixed', description: 'Fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'onTertiaryFixed', family: 'tertiary', pairedWith: 'tertiaryFixed', description: 'On fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'tertiaryFixedDim', family: 'tertiary', pairedWith: 'onTertiaryFixed', description: 'Dimmed fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'onTertiaryFixedVariant', family: 'tertiary', pairedWith: 'tertiaryFixedDim', description: 'On fixed tertiary variant', defaultPalette: 'tertiary', inKotlinColorScheme: false },
]

// Roles that appear in Kotlin's ColorScheme (35 roles)
export const KOTLIN_COLOR_SCHEME_ROLES: M3RoleName[] = M3_ROLES
  .filter(r => r.inKotlinColorScheme)
  .map(r => r.name)

// All 49 roles (for JSON export)
export const ALL_M3_ROLES: M3RoleName[] = M3_ROLES.map(r => r.name)

// Group roles by family for UI display
export const M3_ROLE_FAMILIES = ['primary', 'secondary', 'tertiary', 'error', 'surface', 'other'] as const

export function getRolesByFamily(family: M3RoleFamily): M3RoleInfo[] {
  return M3_ROLES.filter(r => r.family === family)
}
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/types/index.ts src/data/m3-roles.ts
git commit -m "feat: add TypeScript types and M3 role definitions"
```

---

### Task 3: Default Mapping and Contrast Shift Tables

**Files:**
- Create: `src/data/default-mapping.ts`
- Create: `src/data/contrast-shifts.ts`
- Create: `src/data/sample-palette.ts`
- Test: `src/data/__tests__/default-mapping.test.ts`

**Step 1: Write the failing test**

Create `src/data/__tests__/default-mapping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildDefaultMapping } from '../default-mapping'
import { SAMPLE_PALETTE_CONFIG } from '../sample-palette'

describe('buildDefaultMapping', () => {
  it('produces a complete ThemeMapping with all roles assigned', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    // Light standard should have all roles
    expect(Object.keys(mapping.light).length).toBeGreaterThanOrEqual(35)
    // Each role should reference a valid palette and shade
    expect(mapping.light.primary).toEqual({ palette: 'primary', shade: '600' })
    expect(mapping.light.onPrimary).toEqual({ palette: 'primary', shade: 'white' })
    expect(mapping.light.primaryContainer).toEqual({ palette: 'primary', shade: '100' })
    expect(mapping.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '700' })
  })

  it('maps dark theme with inverted tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.dark.primary).toEqual({ palette: 'primary', shade: '200' })
    expect(mapping.dark.onPrimary).toEqual({ palette: 'primary', shade: '800' })
    expect(mapping.dark.primaryContainer).toEqual({ palette: 'primary', shade: '700' })
    expect(mapping.dark.onPrimaryContainer).toEqual({ palette: 'primary', shade: '100' })
  })

  it('generates medium contrast with shifted tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    // Light medium: primary shifts from 600 → 700
    expect(mapping.mediumContrast.light.primary).toEqual({ palette: 'primary', shade: '700' })
    // Light medium: onPrimaryContainer shifts from 700 → 800
    expect(mapping.mediumContrast.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '800' })
  })

  it('generates high contrast with extreme tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    // Light high: onPrimaryContainer shifts to 900
    expect(mapping.highContrast.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '900' })
    // Dark high: onPrimary shifts to 950
    expect(mapping.highContrast.dark.onPrimary).toEqual({ palette: 'primary', shade: '950' })
  })

  it('maps surface roles to neutral palette', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.light.surface.palette).toBe('neutral')
    expect(mapping.light.onSurface.palette).toBe('neutral')
    expect(mapping.dark.surface.palette).toBe('neutral')
  })

  it('maps error roles to error palette', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.light.error.palette).toBe('error')
    expect(mapping.light.onError.palette).toBe('error')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/default-mapping.test.ts`
Expected: FAIL — modules not found.

**Step 3: Create sample palette**

Create `src/data/sample-palette.ts`:

```typescript
import type { PaletteConfig } from '../types'

// Sample palette using Tailwind's default blue, emerald, amber, red, and gray
// Users will replace these with their actual brand colors
export const SAMPLE_PALETTE_CONFIG: PaletteConfig = {
  palettes: {
    primary: {
      shades: {
        '50':  { hex: '#eff6ff' },
        '100': { hex: '#dbeafe' },
        '200': { hex: '#bfdbfe' },
        '300': { hex: '#93c5fd' },
        '400': { hex: '#60a5fa' },
        '500': { hex: '#3b82f6' },
        '600': { hex: '#2563eb' },
        '700': { hex: '#1d4ed8' },
        '800': { hex: '#1e40af' },
        '900': { hex: '#1e3a8a' },
        '950': { hex: '#172554' },
        'white': { hex: '#ffffff' },
        'black': { hex: '#000000' },
      },
    },
    secondary: {
      shades: {
        '50':  { hex: '#ecfdf5' },
        '100': { hex: '#d1fae5' },
        '200': { hex: '#a7f3d0' },
        '300': { hex: '#6ee7b7' },
        '400': { hex: '#34d399' },
        '500': { hex: '#10b981' },
        '600': { hex: '#059669' },
        '700': { hex: '#047857' },
        '800': { hex: '#065f46' },
        '900': { hex: '#064e3b' },
        '950': { hex: '#022c22' },
        'white': { hex: '#ffffff' },
        'black': { hex: '#000000' },
      },
    },
    tertiary: {
      shades: {
        '50':  { hex: '#fffbeb' },
        '100': { hex: '#fef3c7' },
        '200': { hex: '#fde68a' },
        '300': { hex: '#fcd34d' },
        '400': { hex: '#fbbf24' },
        '500': { hex: '#f59e0b' },
        '600': { hex: '#d97706' },
        '700': { hex: '#b45309' },
        '800': { hex: '#92400e' },
        '900': { hex: '#78350f' },
        '950': { hex: '#451a03' },
        'white': { hex: '#ffffff' },
        'black': { hex: '#000000' },
      },
    },
    error: {
      shades: {
        '50':  { hex: '#fef2f2' },
        '100': { hex: '#fee2e2' },
        '200': { hex: '#fecaca' },
        '300': { hex: '#fca5a5' },
        '400': { hex: '#f87171' },
        '500': { hex: '#ef4444' },
        '600': { hex: '#dc2626' },
        '700': { hex: '#b91c1c' },
        '800': { hex: '#991b1b' },
        '900': { hex: '#7f1d1d' },
        '950': { hex: '#450a0a' },
        'white': { hex: '#ffffff' },
        'black': { hex: '#000000' },
      },
    },
    neutral: {
      shades: {
        '50':  { hex: '#f9fafb' },
        '100': { hex: '#f3f4f6' },
        '200': { hex: '#e5e7eb' },
        '300': { hex: '#d1d5db' },
        '400': { hex: '#9ca3af' },
        '500': { hex: '#6b7280' },
        '600': { hex: '#4b5563' },
        '700': { hex: '#374151' },
        '800': { hex: '#1f2937' },
        '900': { hex: '#111827' },
        '950': { hex: '#030712' },
        'white': { hex: '#ffffff' },
        'black': { hex: '#000000' },
      },
    },
  },
  interpolated: {},
}
```

**Step 4: Create contrast shift tables**

Create `src/data/contrast-shifts.ts`:

```typescript
import type { M3RoleName, ShadeRef, ContrastLevel } from '../types'

// Maps M3 tone → Tailwind shade name
// Tone 0 = black, Tone 100 = white, intermediate tones map to numbered shades
export const TONE_TO_SHADE: Record<number, string> = {
  0: 'black',
  10: '900',
  15: '900',   // closest
  17: '900',   // closest
  20: '800',
  25: '800',   // closest
  30: '700',
  35: '700',   // closest
  40: '600',
  50: '500',
  60: '400',
  70: '300',
  80: '200',
  85: '200',   // closest (between 100 and 200)
  87: '200',   // closest
  90: '100',
  92: '100',   // closest
  93: '50',    // closest
  94: '100',   // closest
  95: '50',
  96: '50',    // closest
  97: '50',    // closest
  98: '50',    // closest (very light)
  99: '50',    // closest
  100: 'white',
}

// Defines which shade to use for each role at each contrast level and theme mode.
// Structure: [standard, medium, high] shade values
// 'X' is a placeholder for the accent palette name (primary/secondary/tertiary/error)

interface RoleToneSpec {
  palette: 'accent' | 'neutral' // 'accent' = use the family's own palette
  light: [string, string, string]  // [standard, medium, high] shade
  dark: [string, string, string]
}

// Accent family pattern (same for primary, secondary, tertiary, error)
const ACCENT_ROLE_SPECS: Record<string, RoleToneSpec> = {
  'X':              { palette: 'accent', light: ['600', '700', '700'],   dark: ['200', '100', '100'] },
  'onX':            { palette: 'accent', light: ['white', 'white', 'white'], dark: ['800', '900', '950'] },
  'XContainer':     { palette: 'accent', light: ['100', '200', '200'],  dark: ['700', '700', '600'] },
  'onXContainer':   { palette: 'accent', light: ['700', '800', '900'],  dark: ['100', '50', '50'] },
}

// Surface/neutral roles
const SURFACE_ROLE_SPECS: Record<M3RoleName, RoleToneSpec> = {
  surface:                  { palette: 'neutral', light: ['50', '50', '50'],     dark: ['900', '900', '900'] },
  onSurface:                { palette: 'neutral', light: ['900', '950', 'black'], dark: ['100', '50', 'white'] },
  surfaceVariant:           { palette: 'neutral', light: ['100', '100', '100'],  dark: ['700', '700', '700'] },
  onSurfaceVariant:         { palette: 'neutral', light: ['700', '800', '900'],  dark: ['200', '200', '100'] },
  surfaceDim:               { palette: 'neutral', light: ['200', '300', '300'],  dark: ['900', '900', '900'] },
  surfaceBright:            { palette: 'neutral', light: ['50', '50', '50'],     dark: ['800', '700', '700'] },
  surfaceContainerLowest:   { palette: 'neutral', light: ['white', 'white', 'white'], dark: ['950', '950', 'black'] },
  surfaceContainerLow:      { palette: 'neutral', light: ['50', '50', '50'],    dark: ['900', '900', '800'] },
  surfaceContainer:         { palette: 'neutral', light: ['100', '100', '100'],  dark: ['800', '800', '800'] },
  surfaceContainerHigh:     { palette: 'neutral', light: ['100', '200', '200'],  dark: ['800', '800', '700'] },
  surfaceContainerHighest:  { palette: 'neutral', light: ['100', '200', '200'],  dark: ['700', '700', '700'] },
  inverseSurface:           { palette: 'neutral', light: ['800', '800', '800'],  dark: ['100', '100', '100'] },
  inverseOnSurface:         { palette: 'neutral', light: ['50', '50', '50'],     dark: ['800', '800', '800'] },
  background:               { palette: 'neutral', light: ['50', '50', '50'],     dark: ['900', '900', '900'] },
  onBackground:             { palette: 'neutral', light: ['900', '900', '950'],  dark: ['100', '100', '50'] },
} as Record<M3RoleName, RoleToneSpec>

const OTHER_ROLE_SPECS: Record<string, RoleToneSpec> = {
  outline:          { palette: 'neutral', light: ['500', '600', '700'],  dark: ['400', '300', '200'] },
  outlineVariant:   { palette: 'neutral', light: ['200', '300', '400'],  dark: ['700', '600', '500'] },
  scrim:            { palette: 'neutral', light: ['black', 'black', 'black'], dark: ['black', 'black', 'black'] },
  shadow:           { palette: 'neutral', light: ['black', 'black', 'black'], dark: ['black', 'black', 'black'] },
  surfaceTint:      { palette: 'accent', light: ['600', '700', '700'],   dark: ['200', '100', '100'] }, // follows primary
}

// Fixed color specs (same values across light/dark, shift with contrast)
const FIXED_ROLE_SPECS: Record<string, RoleToneSpec> = {
  'XFixed':              { palette: 'accent', light: ['100', '100', '100'],  dark: ['100', '100', '100'] },
  'onXFixed':            { palette: 'accent', light: ['900', '950', '950'],  dark: ['900', '950', '950'] },
  'XFixedDim':           { palette: 'accent', light: ['200', '200', '200'],  dark: ['200', '200', '200'] },
  'onXFixedVariant':     { palette: 'accent', light: ['700', '800', '900'],  dark: ['700', '800', '900'] },
}

const ACCENT_FAMILIES = ['primary', 'secondary', 'tertiary', 'error'] as const

function expandAccentRoles(
  familyName: string,
  specs: Record<string, RoleToneSpec>,
  contrastIndex: number,
  themeMode: 'light' | 'dark',
): Record<string, ShadeRef> {
  const result: Record<string, ShadeRef> = {}
  for (const [pattern, spec] of Object.entries(specs)) {
    const roleName = pattern.replace(/X/g, familyName.charAt(0).toUpperCase() + familyName.slice(1))
      // Fix: 'X' at start → capitalize family, 'onX' → 'on' + capitalize
      .replace(/^on([A-Z])/, (_, c) => 'on' + c)
    // Actually let's do a proper replacement
    const actualRoleName = pattern
      .replace('onX', `on${familyName.charAt(0).toUpperCase()}${familyName.slice(1)}`)
      .replace('X', familyName)
    const shades = themeMode === 'light' ? spec.light : spec.dark
    result[actualRoleName] = {
      palette: spec.palette === 'accent' ? familyName : 'neutral',
      shade: shades[contrastIndex],
    }
  }
  return result
}

export function buildRoleAssignments(
  contrastLevel: ContrastLevel,
  themeMode: 'light' | 'dark',
): Record<string, ShadeRef> {
  const contrastIndex = contrastLevel === 'standard' ? 0 : contrastLevel === 'medium' ? 1 : 2
  let assignments: Record<string, ShadeRef> = {}

  // Expand accent families
  for (const family of ACCENT_FAMILIES) {
    Object.assign(assignments, expandAccentRoles(family, ACCENT_ROLE_SPECS, contrastIndex, themeMode))
    Object.assign(assignments, expandAccentRoles(family, FIXED_ROLE_SPECS, contrastIndex, themeMode))
  }

  // Surface/neutral roles
  for (const [roleName, spec] of Object.entries(SURFACE_ROLE_SPECS)) {
    const shades = themeMode === 'light' ? spec.light : spec.dark
    assignments[roleName] = { palette: 'neutral', shade: shades[contrastIndex] }
  }

  // Other roles
  for (const [roleName, spec] of Object.entries(OTHER_ROLE_SPECS)) {
    const shades = themeMode === 'light' ? spec.light : spec.dark
    const palette = spec.palette === 'accent' ? 'primary' : 'neutral' // surfaceTint follows primary
    assignments[roleName] = { palette, shade: shades[contrastIndex] }
  }

  // inversePrimary
  const ipShades: [string, string, string] = themeMode === 'light'
    ? ['200', '200', '200']
    : ['600', '700', '700']
  assignments['inversePrimary'] = { palette: 'primary', shade: ipShades[contrastIndex] }

  return assignments
}
```

Note: The `expandAccentRoles` function above has a naming bug — it will be corrected during implementation. The intent is to replace `X` with the family name (e.g., `XContainer` → `primaryContainer`, `onX` → `onPrimary`). The implementation task should write proper tests first and fix naming logic to match.

**Step 5: Create the default mapping builder**

Create `src/data/default-mapping.ts`:

```typescript
import type { PaletteConfig, ThemeMapping, RoleAssignments } from '../types'
import { buildRoleAssignments } from './contrast-shifts'

export function buildDefaultMapping(_paletteConfig: PaletteConfig): ThemeMapping {
  return {
    light: buildRoleAssignments('standard', 'light') as RoleAssignments,
    dark: buildRoleAssignments('standard', 'dark') as RoleAssignments,
    mediumContrast: {
      light: buildRoleAssignments('medium', 'light') as RoleAssignments,
      dark: buildRoleAssignments('medium', 'dark') as RoleAssignments,
    },
    highContrast: {
      light: buildRoleAssignments('high', 'light') as RoleAssignments,
      dark: buildRoleAssignments('high', 'dark') as RoleAssignments,
    },
  }
}
```

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/default-mapping.test.ts`
Expected: PASS. If the `expandAccentRoles` naming logic has bugs, fix them until tests pass.

**Step 7: Commit**

```bash
git add src/data/
git commit -m "feat: add default mapping builder and contrast shift tables"
```

---

### Task 4: WCAG Contrast Ratio Calculation

**Files:**
- Create: `src/lib/contrast.ts`
- Test: `src/lib/__tests__/contrast.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/contrast.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { hexToRgb, relativeLuminance, contrastRatio, meetsWCAG } from '../contrast'

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
  })

  it('handles uppercase', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0])
  })
})

describe('relativeLuminance', () => {
  it('returns 1 for white', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 4)
  })

  it('returns 0 for black', () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 4)
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('returns 1 for same color', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 1)
  })

  it('is symmetric', () => {
    const a = contrastRatio('#336699', '#ffffff')
    const b = contrastRatio('#ffffff', '#336699')
    expect(a).toBeCloseTo(b, 4)
  })
})

describe('meetsWCAG', () => {
  it('classifies contrast levels', () => {
    expect(meetsWCAG(21)).toBe('AAA')
    expect(meetsWCAG(7)).toBe('AAA')
    expect(meetsWCAG(4.5)).toBe('AA')
    expect(meetsWCAG(3)).toBe('AA-large')
    expect(meetsWCAG(2)).toBe('fail')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts`
Expected: FAIL.

**Step 3: Write implementation**

Create `src/lib/contrast.ts`:

```typescript
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WCAGLevel = 'AAA' | 'AA' | 'AA-large' | 'fail'

export function meetsWCAG(ratio: number): WCAGLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA-large'
  return 'fail'
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/contrast.ts src/lib/__tests__/contrast.test.ts
git commit -m "feat: add WCAG contrast ratio calculation"
```

---

### Task 5: OKLCH Interpolation for Neutral Shades

**Files:**
- Create: `src/lib/oklch.ts`
- Test: `src/lib/__tests__/oklch.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/oklch.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { hexToOklch, oklchToHex, interpolateOklch, generateIntermediateNeutrals } from '../oklch'

describe('hexToOklch', () => {
  it('converts white', () => {
    const [l, c, h] = hexToOklch('#ffffff')
    expect(l).toBeCloseTo(1, 1)
    expect(c).toBeCloseTo(0, 2)
  })

  it('converts black', () => {
    const [l, c, h] = hexToOklch('#000000')
    expect(l).toBeCloseTo(0, 1)
  })
})

describe('oklchToHex', () => {
  it('round-trips white', () => {
    const oklch = hexToOklch('#ffffff')
    const hex = oklchToHex(oklch[0], oklch[1], oklch[2])
    expect(hex.toLowerCase()).toBe('#ffffff')
  })

  it('round-trips black', () => {
    const oklch = hexToOklch('#000000')
    const hex = oklchToHex(oklch[0], oklch[1], oklch[2])
    expect(hex.toLowerCase()).toBe('#000000')
  })
})

describe('interpolateOklch', () => {
  it('returns start color at position 0', () => {
    const result = interpolateOklch('#000000', '#ffffff', 0)
    expect(result).toBe('#000000')
  })

  it('returns end color at position 1', () => {
    const result = interpolateOklch('#000000', '#ffffff', 1)
    expect(result).toBe('#ffffff')
  })

  it('returns a mid-gray at position 0.5', () => {
    const result = interpolateOklch('#000000', '#ffffff', 0.5)
    // Should be a gray value roughly in the middle perceptually
    const hex = result.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    expect(r).toBeGreaterThan(50)
    expect(r).toBeLessThan(200)
  })
})

describe('generateIntermediateNeutrals', () => {
  it('generates shades between existing palette entries', () => {
    const existing = {
      '50':  { hex: '#f9fafb' },
      '100': { hex: '#f3f4f6' },
      '200': { hex: '#e5e7eb' },
    }
    const targets = [75, 150] // tone targets that fall between shades
    const result = generateIntermediateNeutrals(existing, targets)

    expect(result).toHaveProperty('75')
    expect(result).toHaveProperty('150')
    expect(result['75'].source.between).toEqual(['50', '100'])
    expect(result['150'].source.between).toEqual(['100', '200'])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/oklch.test.ts`
Expected: FAIL.

**Step 3: Write implementation**

Create `src/lib/oklch.ts`:

This requires converting hex → sRGB → linear sRGB → OKLab → OKLCH and back. The implementation should use the standard OKLab conversion matrices. The code is roughly 80-100 lines of pure math (no dependencies needed).

Key functions:
- `hexToOklch(hex: string): [number, number, number]` — L, C, H
- `oklchToHex(l: number, c: number, h: number): string`
- `interpolateOklch(hex1: string, hex2: string, position: number): string`
- `generateIntermediateNeutrals(existing: Record<string, { hex: string }>, targets: number[]): Record<string, InterpolatedShade>`

The interpolation linearly blends L, C, and H (with hue wrapping). `generateIntermediateNeutrals` figures out which two existing shades each target falls between, and interpolates at the right position.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/oklch.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/oklch.ts src/lib/__tests__/oklch.test.ts
git commit -m "feat: add OKLCH interpolation for neutral shade generation"
```

---

### Task 6: Palette Resolution Helper

**Files:**
- Create: `src/lib/palette.ts`
- Test: `src/lib/__tests__/palette.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/palette.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveShadeRef, resolveAllRoles } from '../palette'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import type { ShadeRef, RoleAssignments } from '../../types'

describe('resolveShadeRef', () => {
  it('resolves a palette shade to a hex value', () => {
    const ref: ShadeRef = { palette: 'primary', shade: '600' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#2563eb')
  })

  it('resolves white', () => {
    const ref: ShadeRef = { palette: 'primary', shade: 'white' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#ffffff')
  })

  it('resolves black', () => {
    const ref: ShadeRef = { palette: 'neutral', shade: 'black' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#000000')
  })

  it('returns null for invalid reference', () => {
    const ref: ShadeRef = { palette: 'nonexistent', shade: '500' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBeNull()
  })
})

describe('resolveAllRoles', () => {
  it('resolves a full RoleAssignments to hex values', () => {
    const assignments: Partial<RoleAssignments> = {
      primary: { palette: 'primary', shade: '600' },
      onPrimary: { palette: 'primary', shade: 'white' },
    }
    const resolved = resolveAllRoles(SAMPLE_PALETTE_CONFIG, assignments as RoleAssignments)
    expect(resolved.primary).toBe('#2563eb')
    expect(resolved.onPrimary).toBe('#ffffff')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/palette.test.ts`

**Step 3: Write implementation**

Create `src/lib/palette.ts`:

```typescript
import type { PaletteConfig, ShadeRef, RoleAssignments, M3RoleName } from '../types'

export function resolveShadeRef(config: PaletteConfig, ref: ShadeRef): string | null {
  const palette = config.palettes[ref.palette]
  if (!palette) return null

  const shade = palette.shades[ref.shade]
  if (shade) return shade.hex

  // Check interpolated shades
  const interpolated = config.interpolated?.[ref.palette]?.[ref.shade]
  if (interpolated) return interpolated.hex

  return null
}

export function resolveAllRoles(
  config: PaletteConfig,
  assignments: RoleAssignments,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [role, ref] of Object.entries(assignments)) {
    const hex = resolveShadeRef(config, ref)
    if (hex) result[role] = hex
  }
  return result
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/palette.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/palette.ts src/lib/__tests__/palette.test.ts
git commit -m "feat: add palette shade resolution helpers"
```

---

### Task 7: State Management Hook

**Files:**
- Create: `src/hooks/useThemeMapping.ts`

**Step 1: Write the hook**

Create `src/hooks/useThemeMapping.ts`:

```typescript
import { useReducer, useEffect, useCallback } from 'react'
import type { AppState, AppAction, PaletteConfig, ContrastLevel, M3RoleName, ShadeRef } from '../types'
import { buildDefaultMapping } from '../data/default-mapping'
import { SAMPLE_PALETTE_CONFIG } from '../data/sample-palette'

const STORAGE_KEY = 'palette-bridge-state'

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function createInitialState(paletteConfig: PaletteConfig): AppState {
  return {
    paletteConfig,
    themeMapping: buildDefaultMapping(paletteConfig),
    activeContrastLevel: 'standard',
    activeThemeMode: 'light',
    interpolationEnabled: false,
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PALETTE_CONFIG':
      return { ...state, paletteConfig: action.payload }

    case 'SET_ROLE_ASSIGNMENT': {
      const { contrastLevel, themeMode, role, shade } = action
      const newState = structuredClone(state)
      if (contrastLevel === 'standard') {
        newState.themeMapping[themeMode][role] = shade
      } else if (contrastLevel === 'medium') {
        newState.themeMapping.mediumContrast[themeMode][role] = shade
      } else {
        newState.themeMapping.highContrast[themeMode][role] = shade
      }
      return newState
    }

    case 'SET_CONTRAST_LEVEL':
      return { ...state, activeContrastLevel: action.payload }

    case 'SET_THEME_MODE':
      return { ...state, activeThemeMode: action.payload }

    case 'RESET_CONTRAST_TO_DEFAULTS': {
      const newState = structuredClone(state)
      const defaults = buildDefaultMapping(state.paletteConfig)
      if (action.contrastLevel === 'standard') {
        newState.themeMapping.light = defaults.light
        newState.themeMapping.dark = defaults.dark
      } else if (action.contrastLevel === 'medium') {
        newState.themeMapping.mediumContrast = defaults.mediumContrast
      } else {
        newState.themeMapping.highContrast = defaults.highContrast
      }
      return newState
    }

    case 'TOGGLE_INTERPOLATION':
      return { ...state, interpolationEnabled: !state.interpolationEnabled }

    case 'LOAD_STATE':
      return action.payload

    default:
      return state
  }
}

export function useThemeMapping() {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => loadState() ?? createInitialState(SAMPLE_PALETTE_CONFIG),
  )

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setRoleAssignment = useCallback((
    contrastLevel: ContrastLevel,
    themeMode: 'light' | 'dark',
    role: M3RoleName,
    shade: ShadeRef,
  ) => {
    dispatch({ type: 'SET_ROLE_ASSIGNMENT', contrastLevel, themeMode, role, shade })
  }, [])

  const getActiveAssignments = useCallback(() => {
    const { activeContrastLevel, activeThemeMode, themeMapping } = state
    if (activeContrastLevel === 'standard') return themeMapping[activeThemeMode]
    if (activeContrastLevel === 'medium') return themeMapping.mediumContrast[activeThemeMode]
    return themeMapping.highContrast[activeThemeMode]
  }, [state])

  return {
    state,
    dispatch,
    setRoleAssignment,
    getActiveAssignments,
  }
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/hooks/useThemeMapping.ts
git commit -m "feat: add state management hook with localStorage persistence"
```

---

### Task 8: Palette Editor Component

**Files:**
- Create: `src/components/PaletteEditor.tsx`

**Step 1: Build the component**

Create `src/components/PaletteEditor.tsx`:

A horizontal swatch strip for each palette. Each swatch shows the shade number and hex value. The component receives the `PaletteConfig` and renders all 5 palettes (primary, secondary, tertiary, error, neutral).

Features:
- Each swatch is a colored rectangle with the shade label below
- Hex value shown on hover or always (small text)
- When `interpolationEnabled` is true, show interpolated shades with dashed borders
- Auto-contrast text color (white text on dark shades, black on light)

**Step 2: Integrate into App.tsx**

Import and render `PaletteEditor` at the top of `App.tsx`, passing the palette config from state.

**Step 3: Visual verification**

Run: `npm run dev`
Expected: Five palette strips displayed, each showing 11 colored swatches with hex labels.

**Step 4: Commit**

```bash
git add src/components/PaletteEditor.tsx src/App.tsx
git commit -m "feat: add palette editor component with swatch strips"
```

---

### Task 9: Contrast Badge Component

**Files:**
- Create: `src/components/ContrastBadge.tsx`

**Step 1: Build the component**

Create `src/components/ContrastBadge.tsx`:

Takes two hex colors (foreground + background), calculates the contrast ratio, and displays:
- The numeric ratio (e.g., "4.52:1")
- A colored badge: green for >= 4.5, yellow for >= 3, red for < 3
- The WCAG level label (AAA, AA, AA-large, fail)

Props: `{ fgHex: string; bgHex: string }`

**Step 2: Commit**

```bash
git add src/components/ContrastBadge.tsx
git commit -m "feat: add contrast badge component"
```

---

### Task 10: Shade Selector Component

**Files:**
- Create: `src/components/ShadeSelector.tsx`

**Step 1: Build the component**

Create `src/components/ShadeSelector.tsx`:

A popup/popover that shows the available shades from a given palette. Used when the user clicks an assignment cell in the mapping table.

Props:
- `palette: Palette` — the palette to show shades from
- `paletteName: string` — for display
- `currentShade: string` — currently selected shade (highlighted)
- `onSelect: (shade: string) => void`
- `onClose: () => void`

Renders as a horizontal strip of clickable swatch buttons. The currently selected shade has a ring/border indicator. Clicking a swatch calls `onSelect` and closes.

For the neutral palette, also show selectors for other palettes if the role can accept any palette's shade (with a palette toggle/tabs).

**Step 2: Commit**

```bash
git add src/components/ShadeSelector.tsx
git commit -m "feat: add shade selector popup component"
```

---

### Task 11: Mapping Table Component

**Files:**
- Create: `src/components/MappingTable.tsx`

**Step 1: Build the component**

Create `src/components/MappingTable.tsx`:

The main UI table. This is the largest component.

Layout:
- Grouped sections: Primary, Secondary, Tertiary, Error, Surface, Other
- Each section is collapsible
- Columns: Role Name | Light Swatch | Dark Swatch | Light Contrast | Dark Contrast
- Each swatch cell shows the assigned color as a filled rectangle with the shade label (e.g., "primary-600")
- Clicking a swatch cell opens the `ShadeSelector` popup for that role
- Contrast columns show `ContrastBadge` for paired roles

Props:
- Receives state + dispatch from `useThemeMapping`
- Reads the active contrast level to determine which assignment set to show
- Tabs at the top: Standard | Medium Contrast | High Contrast

**Step 2: Integrate into App.tsx**

Add the `MappingTable` component below the `PaletteEditor` in `App.tsx`.

**Step 3: Visual verification**

Run: `npm run dev`
Expected: Full mapping table rendered with all M3 roles grouped by family, color swatches visible, contrast ratios calculated and displayed for paired roles.

**Step 4: Commit**

```bash
git add src/components/MappingTable.tsx src/App.tsx
git commit -m "feat: add mapping table with shade assignment and contrast display"
```

---

### Task 12: Theme Preview Component

**Files:**
- Create: `src/components/ThemePreview.tsx`

**Step 1: Build the component**

Create `src/components/ThemePreview.tsx`:

A mock M3 component gallery rendered with the current theme mapping. Shows:
- Filled button, outlined button, tonal button, text button
- A card with title, subtitle, body text
- FAB (floating action button)
- Surface layer stack (showing container hierarchy as nested rectangles with labels)
- Text samples on various surfaces

Uses CSS custom properties set from the resolved mapping, so all preview elements automatically update when assignments change.

Props:
- `resolvedColors: Record<string, string>` — all M3 roles resolved to hex
- `themeMode: 'light' | 'dark'`

**Step 2: Add light/dark toggle and side-by-side mode**

The preview should support:
- A toggle switch for light/dark
- A side-by-side mode showing both themes simultaneously

**Step 3: Integrate into App.tsx**

Add `ThemePreview` to the right side or below the mapping table in `App.tsx`. Use a responsive layout: side-by-side on wide screens, stacked on narrow.

**Step 4: Visual verification**

Run: `npm run dev`
Expected: Mock M3 components rendered with actual mapped colors. Changing a shade assignment updates the preview in real time.

**Step 5: Commit**

```bash
git add src/components/ThemePreview.tsx src/App.tsx
git commit -m "feat: add theme preview with mock M3 component gallery"
```

---

### Task 13: Export — Kotlin

**Files:**
- Create: `src/lib/export-kotlin.ts`
- Test: `src/lib/__tests__/export-kotlin.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/export-kotlin.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateColorKt, generateThemeKt } from '../export-kotlin'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateColorKt', () => {
  it('produces valid Kotlin color declarations', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateColorKt(SAMPLE_PALETTE_CONFIG, mapping, 'com.example.ui.theme')

    expect(output).toContain('package com.example.ui.theme')
    expect(output).toContain('import androidx.compose.ui.graphics.Color')
    expect(output).toContain('val primaryLight = Color(0xFF')
    expect(output).toContain('val onPrimaryLight = Color(0xFFFFFFFF)')
    expect(output).toContain('val primaryDark = Color(0xFF')
    expect(output).toContain('val primaryLightMediumContrast = Color(0xFF')
    expect(output).toContain('val primaryDarkHighContrast = Color(0xFF')
  })

  it('uses uppercase hex without # prefix', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateColorKt(SAMPLE_PALETTE_CONFIG, mapping, 'com.example.ui.theme')

    // Should NOT contain lowercase hex or # symbols in color values
    expect(output).not.toMatch(/Color\(0xFF[a-f]/)
    expect(output).not.toContain('Color(#')
  })
})

describe('generateThemeKt', () => {
  it('produces six ColorScheme constructors', () => {
    const output = generateThemeKt('com.example.ui.theme')

    expect(output).toContain('private val lightScheme = lightColorScheme(')
    expect(output).toContain('private val darkScheme = darkColorScheme(')
    expect(output).toContain('private val mediumContrastLightColorScheme = lightColorScheme(')
    expect(output).toContain('private val highContrastLightColorScheme = lightColorScheme(')
    expect(output).toContain('private val mediumContrastDarkColorScheme = darkColorScheme(')
    expect(output).toContain('private val highContrastDarkColorScheme = darkColorScheme(')
  })

  it('references color constants with correct suffixes', () => {
    const output = generateThemeKt('com.example.ui.theme')

    expect(output).toContain('primary = primaryLight,')
    expect(output).toContain('primary = primaryDark,')
    expect(output).toContain('primary = primaryLightMediumContrast,')
    expect(output).toContain('primary = primaryDarkHighContrast,')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/export-kotlin.test.ts`

**Step 3: Write implementation**

Create `src/lib/export-kotlin.ts`:

The generator walks the `ThemeMapping`, resolves each `ShadeRef` to a hex value via `resolveShadeRef`, then formats it as `Color(0xFFRRGGBB)` using uppercase hex. The naming convention follows Material Theme Builder's current format: `{roleName}{Light|Dark}{|MediumContrast|HighContrast}`.

`generateColorKt` produces the Color.kt file with all 210 color constants (35 roles x 6 variants).

`generateThemeKt` produces the Theme.kt file with 6 `ColorScheme` constructors referencing the color constants.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/export-kotlin.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/export-kotlin.ts src/lib/__tests__/export-kotlin.test.ts
git commit -m "feat: add Kotlin Color.kt and Theme.kt export generator"
```

---

### Task 14: Export — Material Theme Builder JSON

**Files:**
- Create: `src/lib/export-material-json.ts`
- Test: `src/lib/__tests__/export-material-json.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { generateMaterialJson } from '../export-material-json'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateMaterialJson', () => {
  it('produces valid Material Theme Builder JSON structure', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(parsed).toHaveProperty('schemes')
    expect(parsed).toHaveProperty('palettes')
    expect(parsed.schemes).toHaveProperty('light')
    expect(parsed.schemes).toHaveProperty('dark')
    expect(parsed.schemes).toHaveProperty('light-medium-contrast')
    expect(parsed.schemes).toHaveProperty('light-high-contrast')
    expect(parsed.schemes).toHaveProperty('dark-medium-contrast')
    expect(parsed.schemes).toHaveProperty('dark-high-contrast')
  })

  it('includes all 49 color roles per scheme', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(Object.keys(parsed.schemes.light)).toHaveLength(49)
    expect(parsed.schemes.light).toHaveProperty('primary')
    expect(parsed.schemes.light).toHaveProperty('surfaceContainerHighest')
    expect(parsed.schemes.light).toHaveProperty('primaryFixed')
  })

  it('uses uppercase hex values with # prefix', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(parsed.schemes.light.primary).toMatch(/^#[0-9A-F]{6}$/)
  })
})
```

**Step 2: Run, implement, verify, commit** (same pattern as previous tasks)

The JSON structure matches the Material Theme Builder format:
```json
{
  "description": "Palette Bridge export ...",
  "source": "palette-bridge",
  "schemes": {
    "light": { ...49 roles as "#RRGGBB" },
    "light-medium-contrast": { ... },
    "light-high-contrast": { ... },
    "dark": { ... },
    "dark-medium-contrast": { ... },
    "dark-high-contrast": { ... }
  },
  "palettes": {
    "primary": { "0": "#...", "10": "#...", ... },
    ...
  }
}
```

```bash
git add src/lib/export-material-json.ts src/lib/__tests__/export-material-json.test.ts
git commit -m "feat: add Material Theme Builder JSON export"
```

---

### Task 15: Export — Tokens Studio JSON

**Files:**
- Create: `src/lib/export-tokens-studio.ts`
- Test: `src/lib/__tests__/export-tokens-studio.test.ts`

**Step 1: Write the failing test**

Test that the output follows W3C DTCG format with `$type` and `$value` fields, organized as `core.json` (palette primitives) + `light.json` / `dark.json` (semantic tokens with `{references}`).

**Step 2: Implement**

Generates three JSON files:
- `core.json` — palette shades as primitive color tokens
- `light.json` — light theme M3 roles referencing core tokens
- `dark.json` — dark theme M3 roles referencing core tokens

Each token uses the format:
```json
{ "$type": "color", "$value": "{palette.primary.600}" }
```

**Step 3: Test, commit**

```bash
git add src/lib/export-tokens-studio.ts src/lib/__tests__/export-tokens-studio.test.ts
git commit -m "feat: add Tokens Studio JSON export"
```

---

### Task 16: Export — CSS Custom Properties

**Files:**
- Create: `src/lib/export-css.ts`
- Test: `src/lib/__tests__/export-css.test.ts`

**Step 1: Write the failing test**

Test that the output produces valid CSS with `--md-sys-color-{role}: #{hex}` format for both light and dark themes, using `:root` and `[data-theme="dark"]` selectors.

**Step 2: Implement**

```typescript
export function generateCss(
  paletteConfig: PaletteConfig,
  mapping: ThemeMapping,
): string
```

Output format:
```css
:root {
  --md-sys-color-primary: #2563eb;
  --md-sys-color-on-primary: #ffffff;
  /* ... all roles */
}

[data-theme="dark"] {
  --md-sys-color-primary: #bfdbfe;
  /* ... */
}
```

**Step 3: Test, commit**

```bash
git add src/lib/export-css.ts src/lib/__tests__/export-css.test.ts
git commit -m "feat: add CSS custom properties export"
```

---

### Task 17: Export Panel Component

**Files:**
- Create: `src/components/ExportPanel.tsx`

**Step 1: Build the component**

Create `src/components/ExportPanel.tsx`:

A panel with export buttons:
- "Export Kotlin" → downloads `Color.kt` and `Theme.kt` as separate files (or a zip)
- "Export Material JSON" → downloads `material-theme.json`
- "Export Tokens Studio" → downloads a zip with `core.json`, `light.json`, `dark.json`
- "Export CSS" → downloads `theme.css`
- "Export Mapping" → downloads the raw mapping JSON for import later
- "Import Mapping" → file input that loads a mapping JSON and dispatches `LOAD_STATE`

For Kotlin export, include a text input for the package name (default: `com.example.ui.theme`).

Use `URL.createObjectURL` + hidden `<a>` element for downloads.

**Step 2: Integrate into App.tsx**

Add the `ExportPanel` at the bottom of the app layout.

**Step 3: Visual verification**

Run: `npm run dev`
Expected: Export buttons visible. Clicking each downloads the correct file format.

**Step 4: Commit**

```bash
git add src/components/ExportPanel.tsx src/App.tsx
git commit -m "feat: add export panel with all format download buttons"
```

---

### Task 18: App Layout and Integration

**Files:**
- Modify: `src/App.tsx`

**Step 1: Compose the full layout**

Wire everything together in `App.tsx`:

```
┌─────────────────────────────────────────────┐
│  Header: "Palette Bridge"                    │
├─────────────────────────────────────────────┤
│  PaletteEditor (all 5 palette strips)       │
├──────────────────────┬──────────────────────┤
│  MappingTable        │  ThemePreview         │
│  (scrollable)        │  (sticky sidebar)     │
│                      │                       │
│  [Standard|Med|High] │  [Light|Dark|Both]    │
│                      │                       │
│  Primary group       │  Mock components      │
│  Secondary group     │  rendered with         │
│  Tertiary group      │  current mapping       │
│  Error group         │                       │
│  Surface group       │                       │
│  Other group         │                       │
├──────────────────────┴──────────────────────┤
│  ExportPanel                                 │
└─────────────────────────────────────────────┘
```

Use a responsive grid: 2 columns on desktop (mapping table left, preview right), stacked on mobile.

**Step 2: Add global keyboard shortcuts**

- `1/2/3` to switch contrast levels
- `L/D` to switch light/dark

**Step 3: Visual verification**

Run: `npm run dev`
Expected: Full app layout with all panels functional. Changing shade assignments updates contrast ratios and preview in real time.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: compose full app layout with responsive grid"
```

---

### Task 19: End-to-End Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run type checker**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Manual testing checklist**

- [ ] All 5 palettes display correctly with correct hex values
- [ ] Clicking a shade in the mapping table opens the selector
- [ ] Selecting a new shade updates the swatch, contrast ratio, and preview
- [ ] Switching contrast level tabs shows different assignments
- [ ] "Reset to defaults" restores auto-generated assignments
- [ ] Light/dark toggle works in both mapping table and preview
- [ ] Export Kotlin produces valid Color.kt and Theme.kt files
- [ ] Export Material JSON matches the Material Theme Builder format
- [ ] Export Tokens Studio produces valid W3C DTCG JSON
- [ ] Export CSS produces valid custom properties
- [ ] Import/Export mapping JSON round-trips correctly
- [ ] State persists across page reloads (localStorage)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize Palette Bridge MVP"
```
