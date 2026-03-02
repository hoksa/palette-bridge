import { oklchToHex } from './oklch'

const VALID_SHADES = new Set([
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
])

const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

// Matches oklch(L C h) with optional % on lightness
const OKLCH_RE = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)/

// Matches hex color with or without # (6-digit or 3-digit shorthand)
const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

/**
 * Resolve a color value string to a hex color.
 * Supports hex (#rrggbb or rrggbb) and oklch(L C h).
 */
function resolveColor(raw: string): string | null {
  const trimmed = raw.trim().replace(/;$/, '').replace(/,\s*$/, '').trim()

  // Try OKLCH
  const oklchMatch = trimmed.match(OKLCH_RE)
  if (oklchMatch) {
    let L = parseFloat(oklchMatch[1])
    if (oklchMatch[2] === '%') L /= 100
    const C = parseFloat(oklchMatch[3])
    const h = parseFloat(oklchMatch[4])
    return oklchToHex(L, C, h)
  }

  // Try hex (strip quotes if present)
  const unquoted = trimmed.replace(/^['"]/, '').replace(/['"]$/, '').trim()
  const hexMatch = unquoted.match(HEX_RE)
  if (hexMatch) {
    let hex = hexMatch[1].toLowerCase()
    // Expand 3-digit shorthand: abc → aabbcc
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    return '#' + hex
  }

  return null
}

interface ParsedLine {
  shade: string | null
  hex: string
}

/**
 * Try to parse a single line into a shade label (if any) and a hex color.
 */
function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // 1. CSS custom property: --anything-SHADE: value;
  const cssMatch = trimmed.match(/^--[\w-]+-(\d+)\s*:\s*(.+?);?\s*$/)
  if (cssMatch) {
    const shade = cssMatch[1]
    const color = resolveColor(cssMatch[2])
    if (color && VALID_SHADES.has(shade)) {
      return { shade, hex: color }
    }
    return null
  }

  // 2. Labeled with colon: shade: value  or  'shade': 'value',
  const colonMatch = trimmed.match(/^['"]?(\d+)['"]?\s*:\s*(.+?),?\s*$/)
  if (colonMatch) {
    const shade = colonMatch[1]
    const color = resolveColor(colonMatch[2])
    if (color && VALID_SHADES.has(shade)) {
      return { shade, hex: color }
    }
    return null
  }

  // 3. Space-separated: shade value
  const spaceMatch = trimmed.match(/^(\d+)\s+(#?[0-9a-fA-F]{6}|oklch\(.+?\))\s*$/)
  if (spaceMatch) {
    const shade = spaceMatch[1]
    const color = resolveColor(spaceMatch[2])
    if (color && VALID_SHADES.has(shade)) {
      return { shade, hex: color }
    }
    return null
  }

  // 4. Plain hex or oklch (no label)
  const color = resolveColor(trimmed)
  if (color) {
    return { shade: null, hex: color }
  }

  return null
}

/**
 * Parse a multi-line text input into a shade-to-hex mapping.
 *
 * Supports 4 formats:
 * - Plain hex list (positional mapping to 50, 100, 200, ...)
 * - Labeled hex (colon or space-separated, with optional JS quotes)
 * - CSS custom properties (--var-name-shade: value;)
 * - OKLCH values (converted to hex via oklchToHex)
 *
 * @returns Record mapping shade names to hex colors
 */
export function parsePaletteInput(text: string): Record<string, string> {
  if (!text.trim()) return {}

  const lines = text.split('\n')
  const parsed: ParsedLine[] = []

  for (const line of lines) {
    const result = parseLine(line)
    if (result) {
      parsed.push(result)
    }
  }

  if (parsed.length === 0) return {}

  // Determine mode: if ANY parsed line has a shade label, use labeled mode
  const hasLabels = parsed.some(p => p.shade !== null)

  if (hasLabels) {
    const result: Record<string, string> = {}
    for (const p of parsed) {
      if (p.shade !== null) {
        result[p.shade] = p.hex
      }
    }
    return result
  }

  // Positional mode: assign shades in SHADE_ORDER
  const result: Record<string, string> = {}
  for (let i = 0; i < parsed.length && i < SHADE_ORDER.length; i++) {
    result[SHADE_ORDER[i]] = parsed[i].hex
  }
  return result
}
