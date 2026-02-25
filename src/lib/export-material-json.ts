import type { PaletteConfig, ThemeMapping, RoleAssignments, M3RoleName } from '../types'
import { resolveShadeRef } from '../lib/palette'
import { ALL_M3_ROLES } from '../data/m3-roles'

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
  for (const [name, palette] of Object.entries(config.palettes)) {
    const shades: Record<string, string> = {}
    for (const [key, value] of Object.entries(palette.shades)) {
      shades[key] = toUpperHex(value.hex)
    }
    // Include interpolated shades if present
    const interpolated = config.interpolated?.[name]
    if (interpolated) {
      for (const [key, value] of Object.entries(interpolated)) {
        shades[key] = toUpperHex(value.hex)
      }
    }
    palettes[name] = shades
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
