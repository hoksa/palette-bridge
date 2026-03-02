import type { PaletteConfig, ThemeMapping, RoleAssignments, M3RoleName } from '../types'
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
  '500': '50',
  '400': '60',
  '300': '70',
  '200': '80',
  '100': '90',
  '50': '95',
  'white': '100',
}

/** Missing M3 tones mapped to nearest available tone (nearest-neighbor fill) */
const NEAREST_TONE_FILL: Record<string, string> = {
  '5': '0',
  '15': '10',
  '25': '20',
  '35': '30',
  '98': '100',
  '99': '100',
}

/**
 * MTB role order — matches the exact insertion order from Material Theme Builder exports.
 * JSON is technically unordered, but MTB may rely on insertion order.
 */
const MTB_ROLE_ORDER: M3RoleName[] = [
  'primary', 'surfaceTint', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'outline', 'outlineVariant', 'shadow', 'scrim',
  'inverseSurface', 'inverseOnSurface', 'inversePrimary',
  'primaryFixed', 'onPrimaryFixed', 'primaryFixedDim', 'onPrimaryFixedVariant',
  'secondaryFixed', 'onSecondaryFixed', 'secondaryFixedDim', 'onSecondaryFixedVariant',
  'tertiaryFixed', 'onTertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixedVariant',
  'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
  'surfaceContainerHigh', 'surfaceContainerHighest',
]

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
  // Use MTB role order for consistent insertion order
  for (const role of MTB_ROLE_ORDER) {
    const ref = assignments[role]
    if (ref) {
      const hex = resolveShadeRef(config, ref)
      if (hex) {
        scheme[role] = toUpperHex(hex)
      }
    }
  }
  // Include any roles not in MTB_ROLE_ORDER (future-proofing)
  for (const role of ALL_M3_ROLES) {
    if (!(role in scheme)) {
      const ref = assignments[role]
      if (ref) {
        const hex = resolveShadeRef(config, ref)
        if (hex) {
          scheme[role] = toUpperHex(hex)
        }
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

    // Fill missing MTB tones with nearest available tone
    for (const [missingTone, nearestTone] of Object.entries(NEAREST_TONE_FILL)) {
      if (!(missingTone in tones) && nearestTone in tones) {
        tones[missingTone] = tones[nearestTone]
      }
    }

    // Output tones in numeric order for consistent JSON
    const sorted: Record<string, string> = {}
    for (const key of Object.keys(tones).sort((a, b) => Number(a) - Number(b))) {
      sorted[key] = tones[key]
    }

    for (const targetName of targetNames) {
      palettes[targetName] = { ...sorted }
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

  // seed = primary palette's shade 600 (tone 40, the "source" color)
  const seed = toUpperHex(config.palettes.primary?.shades['600']?.hex ?? '#000000')

  // coreColors = tone 40 (shade 600) for each MTB palette family
  const coreColors: Record<string, string> = {
    primary: toUpperHex(config.palettes.primary?.shades['600']?.hex ?? '#000000'),
    secondary: toUpperHex(config.palettes.secondary?.shades['600']?.hex ?? '#000000'),
    tertiary: toUpperHex(config.palettes.tertiary?.shades['600']?.hex ?? '#000000'),
    neutral: toUpperHex(config.palettes.neutral?.shades['600']?.hex ?? '#000000'),
    neutralVariant: toUpperHex(config.palettes.neutral?.shades['600']?.hex ?? '#000000'),
  }

  const output = {
    description: 'TYPE: CUSTOM\nPalette Bridge export',
    seed,
    coreColors,
    extendedColors: [] as unknown[],
    schemes,
    palettes: buildPalettes(config),
  }

  return JSON.stringify(output, null, 2)
}
