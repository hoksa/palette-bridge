# Custom Palette Input Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to customize palette swatches by pasting full palettes (in multiple formats) and clicking individual shades to edit them.

**Architecture:** Add a pure parser function (`parsePaletteInput`) that auto-detects paste format and returns shade→hex pairs. Two new UI components — `PalettePastePopover` for batch paste and `ShadeEditPopover` for single-swatch editing — both dispatch `SET_PALETTE_CONFIG` to the existing reducer. `PaletteEditor` gains `dispatch` as a prop and becomes interactive.

**Tech Stack:** TypeScript, React 19, shadcn/ui (Popover, Input, Button), Vitest, existing `oklchToHex` from `src/lib/oklch.ts`

---

### Task 1: Parse Palette Input — Tests

**Files:**
- Create: `src/lib/__tests__/parse-palette-input.test.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect } from 'vitest'
import { parsePaletteInput } from '../parse-palette-input'

describe('parsePaletteInput', () => {
  describe('plain hex list (positional)', () => {
    it('maps hex values to shades in order', () => {
      const input = `#eff6ff
#dbeafe
#bfdbfe`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '200': '#bfdbfe',
      })
    })

    it('handles all 11 shades', () => {
      const input = `#eff6ff
#dbeafe
#bfdbfe
#93c5fd
#60a5fa
#3b82f6
#2563eb
#1d4ed8
#1e40af
#1e3a8a
#172554`
      const result = parsePaletteInput(input)
      expect(Object.keys(result)).toHaveLength(11)
      expect(result['50']).toBe('#eff6ff')
      expect(result['950']).toBe('#172554')
    })

    it('handles hex without # prefix', () => {
      const input = `eff6ff
dbeafe`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
      })
    })
  })

  describe('labeled hex', () => {
    it('parses shade: hex format', () => {
      const input = `50: #eff6ff
500: #3b82f6
950: #172554`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '500': '#3b82f6',
        '950': '#172554',
      })
    })

    it('parses quoted JS object format', () => {
      const input = `'50': '#eff6ff',
'100': '#dbeafe',
'500': '#3b82f6',`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })

    it('parses shade hex without colon', () => {
      const input = `50 #eff6ff
100 #dbeafe`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
      })
    })
  })

  describe('CSS custom properties', () => {
    it('extracts shade from variable name', () => {
      const input = `--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-500: #3b82f6;`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })

    it('works with various variable naming patterns', () => {
      const input = `--primary-50: #eff6ff;
--blue-500: #3b82f6;`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '500': '#3b82f6',
      })
    })
  })

  describe('OKLCH values', () => {
    it('parses labeled oklch values and converts to hex', () => {
      const input = `50: oklch(0.97 0.01 250)
500: oklch(0.62 0.19 260)`
      const result = parsePaletteInput(input)
      expect(result['50']).toMatch(/^#[0-9a-f]{6}$/)
      expect(result['500']).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('parses CSS var with oklch value', () => {
      const input = `--color-primary-50: oklch(0.97 0.01 250);`
      const result = parsePaletteInput(input)
      expect(result['50']).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  describe('edge cases', () => {
    it('returns empty object for empty input', () => {
      expect(parsePaletteInput('')).toEqual({})
    })

    it('ignores non-matching lines', () => {
      const input = `// primary palette colors
50: #eff6ff
some random text
500: #3b82f6
}`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '500': '#3b82f6',
      })
    })

    it('rejects invalid shade numbers', () => {
      const input = `25: #eff6ff
50: #dbeafe
999: #172554`
      const result = parsePaletteInput(input)
      expect(result).toEqual({ '50': '#dbeafe' })
    })

    it('trims whitespace from values', () => {
      const input = `  50:   #eff6ff
  100:  #dbeafe  `
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
      })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/parse-palette-input.test.ts`
Expected: FAIL — module `../parse-palette-input` not found

**Step 3: Commit**

```bash
git add src/lib/__tests__/parse-palette-input.test.ts
git commit -m "test: add parse-palette-input tests for all 4 formats"
```

---

### Task 2: Parse Palette Input — Implementation

**Files:**
- Create: `src/lib/parse-palette-input.ts`

**Step 1: Implement the parser**

```typescript
import { oklchToHex } from './oklch'

const VALID_SHADES = new Set(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'])
const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

const HEX_RE = /^#?([0-9a-fA-F]{6})$/
const OKLCH_RE = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/

function normalizeHex(raw: string): string | null {
  const match = raw.match(HEX_RE)
  return match ? `#${match[1].toLowerCase()}` : null
}

function parseOklch(raw: string): string | null {
  const match = raw.match(OKLCH_RE)
  if (!match) return null
  const [, l, c, h] = match
  return oklchToHex(parseFloat(l), parseFloat(c), parseFloat(h))
}

function parseColorValue(raw: string): string | null {
  return normalizeHex(raw) ?? parseOklch(raw)
}

interface ParsedLine {
  shade: string | null
  hex: string
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // CSS custom property: --anything-SHADE: value;
  const cssMatch = trimmed.match(/^--[\w-]+-(\d+)\s*:\s*(.+?)\s*;?\s*$/)
  if (cssMatch) {
    const shade = cssMatch[1]
    const hex = parseColorValue(cssMatch[2])
    if (hex && VALID_SHADES.has(shade)) return { shade, hex }
    return null
  }

  // Labeled: optional quotes, shade, optional colon, value, optional trailing comma
  const labeledMatch = trimmed.match(/^['"]?(\d+)['"]?\s*[:]\s*['"]?(.+?)['"]?\s*,?\s*$/)
  if (labeledMatch) {
    const shade = labeledMatch[1]
    const hex = parseColorValue(labeledMatch[2])
    if (hex && VALID_SHADES.has(shade)) return { shade, hex }
    return null
  }

  // Labeled without colon: shade space value
  const spacedMatch = trimmed.match(/^(\d+)\s+(.+)$/)
  if (spacedMatch) {
    const shade = spacedMatch[1]
    const hex = parseColorValue(spacedMatch[2])
    if (hex && VALID_SHADES.has(shade)) return { shade, hex }
    return null
  }

  // Plain hex or oklch (no label)
  const hex = parseColorValue(trimmed)
  if (hex) return { shade: null, hex }

  return null
}

export function parsePaletteInput(text: string): Record<string, string> {
  const lines = text.split('\n')
  const parsed: ParsedLine[] = []

  for (const line of lines) {
    const result = parseLine(line)
    if (result) parsed.push(result)
  }

  if (parsed.length === 0) return {}

  const hasLabels = parsed.some(p => p.shade !== null)

  const result: Record<string, string> = {}

  if (hasLabels) {
    for (const p of parsed) {
      if (p.shade) result[p.shade] = p.hex
    }
  } else {
    // Positional mapping
    for (let i = 0; i < parsed.length && i < SHADE_ORDER.length; i++) {
      result[SHADE_ORDER[i]] = parsed[i].hex
    }
  }

  return result
}
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/parse-palette-input.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/lib/parse-palette-input.ts
git commit -m "feat: add palette input parser with multi-format support"
```

---

### Task 3: ShadeEditPopover Component

**Files:**
- Create: `src/components/ShadeEditPopover.tsx`

This is the click-to-edit popover for individual swatches. It wraps the swatch element and shows a hex input on click.

**Step 1: Create the component**

```tsx
import { useState, useRef, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface ShadeEditPopoverProps {
  hex: string
  onSave: (hex: string) => void
  children: React.ReactNode
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ShadeEditPopover({ hex, onSave, children }: ShadeEditPopoverProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(hex)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(hex)
      // Focus after popover animation
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [open, hex])

  function commit() {
    const normalized = value.startsWith('#') ? value : `#${value}`
    if (HEX_RE.test(normalized)) {
      onSave(normalized.toLowerCase())
      setOpen(false)
    } else {
      setValue(hex) // revert
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="center" side="bottom">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setOpen(false)
          }}
          onBlur={commit}
          className="h-8 text-xs font-mono"
          spellCheck={false}
        />
      </PopoverContent>
    </Popover>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ShadeEditPopover.tsx
git commit -m "feat: add ShadeEditPopover for individual swatch editing"
```

---

### Task 4: PalettePastePopover Component

**Files:**
- Create: `src/components/PalettePastePopover.tsx`

This is the batch-paste popover with a textarea and Apply button.

**Step 1: Create the component**

```tsx
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { parsePaletteInput } from '../lib/parse-palette-input'

interface PalettePastePopoverProps {
  onApply: (shades: Record<string, string>) => void
  children: React.ReactNode
}

export function PalettePastePopover({ onApply, children }: PalettePastePopoverProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function handleApply() {
    const parsed = parsePaletteInput(text)
    if (Object.keys(parsed).length > 0) {
      onApply(parsed)
      setText('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" side="bottom">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Paste hex values, CSS variables, or OKLCH colors
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"50: #eff6ff\n100: #dbeafe\n..."}
            className="w-full h-32 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            spellCheck={false}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleApply}
            disabled={text.trim().length === 0}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/PalettePastePopover.tsx
git commit -m "feat: add PalettePastePopover for batch palette input"
```

---

### Task 5: Update PaletteEditor to Be Interactive

**Files:**
- Modify: `src/components/PaletteEditor.tsx` (full rewrite — currently 55 lines)
- Modify: `src/App.tsx:59` (pass `dispatch`)

**Step 1: Update PaletteEditor**

The component needs:
- Accept `dispatch` prop
- Wrap each swatch in `ShadeEditPopover` (skip white/black)
- Add a paste button per palette row that opens `PalettePastePopover`
- Helper to dispatch a single shade change
- Helper to dispatch a batch paste merge

Key changes to `src/components/PaletteEditor.tsx`:

1. Update the interface to accept `dispatch`:
```typescript
import type { PaletteConfig, AppAction } from '../types'
```
```typescript
interface PaletteEditorProps {
  paletteConfig: PaletteConfig
  dispatch: React.Dispatch<AppAction>
}
```

2. Add imports for the new components and Button:
```typescript
import { ShadeEditPopover } from './ShadeEditPopover'
import { PalettePastePopover } from './PalettePastePopover'
import { Button } from '@/components/ui/button'
```

3. Inside the component, add handler functions:
```typescript
function updateShade(paletteName: string, shade: string, hex: string) {
  const newConfig = structuredClone(paletteConfig)
  newConfig.palettes[paletteName].shades[shade] = { hex }
  dispatch({ type: 'SET_PALETTE_CONFIG', payload: newConfig })
}

function applyPaste(paletteName: string, shades: Record<string, string>) {
  const newConfig = structuredClone(paletteConfig)
  for (const [shade, hex] of Object.entries(shades)) {
    newConfig.palettes[paletteName].shades[shade] = { hex }
  }
  dispatch({ type: 'SET_PALETTE_CONFIG', payload: newConfig })
}
```

4. Wrap each swatch `div` (the one with `style={{ backgroundColor }}`) in `ShadeEditPopover`, but only for non-white/black shades. Add `cursor-pointer` and a hover ring to signal interactivity.

5. After the shade row, add the paste button:
```tsx
<PalettePastePopover onApply={(shades) => applyPaste(name, shades)}>
  <Button variant="ghost" size="sm" className="h-10 px-2 shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
  </Button>
</PalettePastePopover>
```

**Step 2: Update App.tsx — pass dispatch**

In `src/App.tsx:59`, change:
```tsx
<PaletteEditor paletteConfig={state.paletteConfig} />
```
to:
```tsx
<PaletteEditor paletteConfig={state.paletteConfig} dispatch={dispatch} />
```

**Step 3: Run the dev server and verify**

Run: `npm run dev`
- Each palette row should show swatches + a paste (clipboard) button at the end
- Clicking a swatch opens a hex input popover
- Clicking the paste button opens a textarea popover
- Pasting colors and clicking Apply updates the swatches
- Editing a single swatch updates immediately

**Step 4: Run full test suite and lint**

Run: `npx vitest run && npm run lint`
Expected: All tests pass, no lint errors

**Step 5: Commit**

```bash
git add src/components/PaletteEditor.tsx src/App.tsx
git commit -m "feat: make PaletteEditor interactive with paste and click-to-edit"
```

---

### Task 6: Type Check and Build Verification

**Files:** None (verification only)

**Step 1: Run type check + build**

Run: `npm run build`
Expected: Clean build, no type errors

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass including new parse-palette-input tests

**Step 3: Final commit if any fixes needed, then create PR**

Create PR against `master` with title summarizing the feature.
