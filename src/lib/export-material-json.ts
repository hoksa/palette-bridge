import type { PaletteConfig, ThemeMapping, RoleAssignments } from '../types'
import { resolveShadeRef } from '../lib/palette'
import { ALL_M3_ROLES } from '../data/m3-roles'

/** Maps Tailwind shade names to M3 tone values. Inverse of the mapping in docs/tone-shade-mapping.md */
const SHADE_TO_TONE: Record<string, string> = {
  'black': '0',
  '950': '0',
  '900': '10',
  '800': '20',
  '700': '30',
  '600': '40',
  '400': '60',
  '300': '70',
  '200': '80',
  '100': '90',
  '50': '95',
  'white': '100',
}

function toUpperHex(hex: string): string {
  return hex.startsWith('#')
    ? '#' + hex.slice(1).toUpperCase()
    : '#' + hex.toUpperCase()
}

function resolveScheme(
  config: PaletteConfig,
  assignments: RoleAssignments,
): Record<string, string> {
  const scheme: Record<string, string> = {}
  for (const role of ALL_M3_ROLES) {
    const ref = assignments[role]
    if (ref) {
      const hex = resolveShadeRef(config, ref)
      if (hex) {
        scheme[role] = toUpperHex(hex)
      }
    }
  }
  return scheme
}

function buildPalettes(config: PaletteConfig): Record<string, Record<string, string>> {
  const palettes: Record<string, Record<string, string>> = {}

  // MTB expects: primary, secondary, tertiary, neutral, neutral-variant
  // We have: primary, secondary, tertiary, error, neutral
  // Map neutral to both 'neutral' and 'neutral-variant'; exclude 'error'
  const familyMap: Record<string, string[]> = {
    primary: ['primary'],
    secondary: ['secondary'],
    tertiary: ['tertiary'],
    neutral: ['neutral', 'neutral-variant'],
  }

  for (const [sourceName, targetNames] of Object.entries(familyMap)) {
    const palette = config.palettes[sourceName]
    if (!palette) continue

    const tones: Record<string, string> = {}
    for (const [shade, value] of Object.entries(palette.shades)) {
      const tone = SHADE_TO_TONE[shade]
      if (tone !== undefined) {
        tones[tone] = toUpperHex(value.hex)
      }
    }
    // Include interpolated shades converted to tones
    const interpolated = config.interpolated?.[sourceName]
    if (interpolated) {
      for (const [shade, value] of Object.entries(interpolated)) {
        const tone = SHADE_TO_TONE[shade]
        if (tone !== undefined) {
          tones[tone] = toUpperHex(value.hex)
        }
      }
    }

    for (const targetName of targetNames) {
      palettes[targetName] = { ...tones }
    }
  }

  return palettes
}

export function generateMaterialJson(
  config: PaletteConfig,
  mapping: ThemeMapping,
): string {
  const schemes: Record<string, Record<string, string>> = {
    'light': resolveScheme(config, mapping.light),
    'dark': resolveScheme(config, mapping.dark),
    'light-medium-contrast': resolveScheme(config, mapping.mediumContrast.light),
    'dark-medium-contrast': resolveScheme(config, mapping.mediumContrast.dark),
    'light-high-contrast': resolveScheme(config, mapping.highContrast.light),
    'dark-high-contrast': resolveScheme(config, mapping.highContrast.dark),
  }

  const output = {
    description: 'Palette Bridge export',
    source: 'palette-bridge',
    schemes,
    palettes: buildPalettes(config),
  }

  return JSON.stringify(output, null, 2)
}
