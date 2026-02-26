/**
 * M3 Color Role → Tailwind Shade assignment tables.
 *
 * Every shade value in this file derives from a positional correspondence
 * between M3's tonal palette (0–100, light-to-dark) and Tailwind's shade
 * scale (50–950, light-to-dark). For example, M3 tone 40 maps to Tailwind
 * shade 600 because both sit at ~60% of their respective scales.
 *
 * The M3 tone for each role comes from the Material Design 3 source code's
 * ContrastCurve definitions. Contrast levels (standard/medium/high) shift
 * these tones, which are then resolved to the nearest Tailwind shade.
 *
 * Full rationale and correspondence table: docs/tone-shade-mapping.md
 */
import type { ShadeRef, ContrastLevel } from '../types'

interface RoleToneSpec {
  palette: 'accent' | 'neutral'
  light: [string, string, string]  // [standard, medium, high] shade
  dark: [string, string, string]
}

// Accent family pattern (same for primary, secondary, tertiary, error)
// 'X' is replaced with the capitalized family name, 'x' with lowercase
const ACCENT_ROLE_SPECS: Record<string, RoleToneSpec> = {
  '{x}':              { palette: 'accent', light: ['600', '700', '700'],   dark: ['200', '100', '100'] },
  'on{X}':            { palette: 'accent', light: ['white', 'white', 'white'], dark: ['800', '900', '950'] },
  '{x}Container':     { palette: 'accent', light: ['100', '200', '200'],  dark: ['700', '700', '600'] },
  'on{X}Container':   { palette: 'accent', light: ['700', '800', '900'],  dark: ['100', '50', '50'] },
}

// Surface/neutral roles
const SURFACE_ROLE_SPECS: Record<string, RoleToneSpec> = {
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
}

const OTHER_ROLE_SPECS: Record<string, RoleToneSpec> = {
  outline:          { palette: 'neutral', light: ['500', '600', '700'],  dark: ['400', '300', '200'] },
  outlineVariant:   { palette: 'neutral', light: ['200', '300', '400'],  dark: ['700', '600', '500'] },
  scrim:            { palette: 'neutral', light: ['black', 'black', 'black'], dark: ['black', 'black', 'black'] },
  shadow:           { palette: 'neutral', light: ['black', 'black', 'black'], dark: ['black', 'black', 'black'] },
  surfaceTint:      { palette: 'accent', light: ['600', '700', '700'],   dark: ['200', '100', '100'] },
}

// Fixed color specs (same values across light/dark, shift with contrast)
const FIXED_ROLE_SPECS: Record<string, RoleToneSpec> = {
  '{x}Fixed':              { palette: 'accent', light: ['100', '100', '100'],  dark: ['100', '100', '100'] },
  'on{X}Fixed':            { palette: 'accent', light: ['900', '950', '950'],  dark: ['900', '950', '950'] },
  '{x}FixedDim':           { palette: 'accent', light: ['200', '200', '200'],  dark: ['200', '200', '200'] },
  'on{X}FixedVariant':     { palette: 'accent', light: ['700', '800', '900'],  dark: ['700', '800', '900'] },
}

const ACCENT_FAMILIES = ['primary', 'secondary', 'tertiary', 'error'] as const

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function expandAccentRoles(
  familyName: string,
  specs: Record<string, RoleToneSpec>,
  contrastIndex: number,
  themeMode: 'light' | 'dark',
): Record<string, ShadeRef> {
  const result: Record<string, ShadeRef> = {}
  const cap = capitalize(familyName)

  for (const [pattern, spec] of Object.entries(specs)) {
    const roleName = pattern
      .replace(/\{X\}/g, cap)
      .replace(/\{x\}/g, familyName)

    const shades = themeMode === 'light' ? spec.light : spec.dark
    result[roleName] = {
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
  const assignments: Record<string, ShadeRef> = {}

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
    const palette = spec.palette === 'accent' ? 'primary' : 'neutral'
    assignments[roleName] = { palette, shade: shades[contrastIndex] }
  }

  // inversePrimary
  const ipShades: [string, string, string] = themeMode === 'light'
    ? ['200', '200', '200']
    : ['600', '700', '700']
  assignments['inversePrimary'] = { palette: 'primary', shade: ipShades[contrastIndex] }

  return assignments
}
