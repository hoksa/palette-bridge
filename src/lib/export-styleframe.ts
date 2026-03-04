import type { PaletteConfig, ThemeMapping, RoleAssignments, M3RoleName } from '../types'
import { resolveShadeRef } from './palette'
import { buildTonalPalette } from './palette-tones'

/**
 * The 49 scheme roles in Material Theme Builder insertion order.
 * Same set and order as MTB_ROLE_ORDER in export-material-json.ts.
 */
const SCHEME_ROLES: M3RoleName[] = [
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

/** The 18 M3 tone stops in descending order (100 first, 0 last) — matches Styleframe export */
const TONE_STOPS_DESC = [100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 0]

/** Surface tint alpha percentages used for elevation overlays */
const SURFACE_TINT_ALPHAS = [5, 8, 11, 12, 14] as const

/** State layer opacity percentages */
const STATE_LAYER_OPACITIES = [8, 10, 16] as const

/** Mode names for the 6 scheme variants */
const MODE_NAMES = [
  'Light',
  'Light High Contrast',
  'Light Medium Contrast',
  'Dark',
  'Dark High Contrast',
  'Dark Medium Contrast',
] as const

type ModeName = typeof MODE_NAMES[number]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase M3 role name to Title Case with spaces */
function toTitleCase(name: string): string {
  const spaced = name.replace(/([A-Z])/g, ' $1')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Normalize to lowercase #rrggbb */
function toLowerHex(hex: string): string {
  const h = hex.startsWith('#') ? hex : '#' + hex
  return h.toLowerCase()
}

/** Create 8-digit hex with alpha channel */
function toHexAlpha(hex6: string, percent: number): string {
  const alpha = Math.round((percent / 100) * 255)
  return toLowerHex(hex6) + alpha.toString(16).padStart(2, '0')
}

// ---------------------------------------------------------------------------
// Scheme resolution
// ---------------------------------------------------------------------------

/** Resolve all 49 scheme roles for a given set of role assignments */
function resolveScheme(
  config: PaletteConfig,
  assignments: RoleAssignments,
): Record<M3RoleName, string> {
  const scheme = {} as Record<M3RoleName, string>
  for (const role of SCHEME_ROLES) {
    const ref = assignments[role]
    if (ref) {
      const hex = resolveShadeRef(config, ref)
      if (hex) {
        scheme[role] = toLowerHex(hex)
      }
    }
  }
  return scheme
}

/** Resolve all 6 schemes keyed by mode name */
function resolveAllSchemes(
  config: PaletteConfig,
  mapping: ThemeMapping,
): Record<ModeName, Record<M3RoleName, string>> {
  return {
    'Light': resolveScheme(config, mapping.light),
    'Light High Contrast': resolveScheme(config, mapping.highContrast.light),
    'Light Medium Contrast': resolveScheme(config, mapping.mediumContrast.light),
    'Dark': resolveScheme(config, mapping.dark),
    'Dark High Contrast': resolveScheme(config, mapping.highContrast.dark),
    'Dark Medium Contrast': resolveScheme(config, mapping.mediumContrast.dark),
  }
}

// ---------------------------------------------------------------------------
// Token builders
// ---------------------------------------------------------------------------

interface DtcgToken {
  $value: string
  $type: string
}

interface DtcgValueOnly {
  $value: string
}

/** Build the Schemes group from the Light base scheme */
function buildSchemesGroup(lightScheme: Record<M3RoleName, string>): Record<string, DtcgToken> {
  const tokens: Record<string, DtcgToken> = {}
  for (const role of SCHEME_ROLES) {
    const hex = lightScheme[role]
    if (hex) {
      tokens[toTitleCase(role)] = { $value: hex, $type: 'color' }
    }
  }
  return tokens
}

/** Build the Surfaces group from a surfaceTint hex value */
function buildSurfacesGroup(surfaceTintHex: string): Record<string, DtcgToken> {
  const tokens: Record<string, DtcgToken> = {}
  for (const pct of SURFACE_TINT_ALPHAS) {
    tokens[`Surface Tint ${pct}%`] = {
      $value: toHexAlpha(surfaceTintHex, pct),
      $type: 'color',
    }
  }
  return tokens
}

/** Build the Palettes group (6 families x 18 tones = 108 tokens) */
function buildPalettesGroup(config: PaletteConfig): Record<string, DtcgToken> {
  const tokens: Record<string, DtcgToken> = {}

  const families: Array<{ source: string; label: string }> = [
    { source: 'primary', label: 'Primary' },
    { source: 'secondary', label: 'Secondary' },
    { source: 'tertiary', label: 'Tertiary' },
    { source: 'error', label: 'Error' },
    { source: 'neutral', label: 'Neutral' },
    { source: 'neutral', label: 'Neutral Variant' },
  ]

  for (const { source, label } of families) {
    const toneMap = buildTonalPalette(config, source)
    // Output in descending tone order (100 first, 0 last) to match Styleframe
    for (const tone of TONE_STOPS_DESC) {
      const hex = toneMap[String(tone)]
      if (hex) {
        tokens[`${label} ${tone}`] = { $value: toLowerHex(hex), $type: 'color' }
      }
    }
  }

  return tokens
}

/** Build the State Layers group from a scheme */
function buildStateLayersGroup(
  scheme: Record<M3RoleName, string>,
): Record<string, Record<string, DtcgToken>> {
  const groups: Record<string, Record<string, DtcgToken>> = {}
  for (const role of SCHEME_ROLES) {
    const hex = scheme[role]
    if (hex) {
      const name = toTitleCase(role)
      groups[name] = {}
      for (const pct of STATE_LAYER_OPACITIES) {
        const key = `Opacity-${String(pct).padStart(2, '0')}`
        groups[name][key] = {
          $value: toHexAlpha(hex, pct),
          $type: 'color',
        }
      }
    }
  }
  return groups
}

// ---------------------------------------------------------------------------
// Modifier (delta) builders
// ---------------------------------------------------------------------------

/** Build Schemes overrides: only roles that differ from the Light base */
function buildSchemesOverrides(
  lightScheme: Record<M3RoleName, string>,
  contextScheme: Record<M3RoleName, string>,
): Record<string, DtcgValueOnly> | null {
  const overrides: Record<string, DtcgValueOnly> = {}
  let hasOverrides = false
  for (const role of SCHEME_ROLES) {
    const lightHex = lightScheme[role]
    const contextHex = contextScheme[role]
    if (contextHex && contextHex !== lightHex) {
      overrides[toTitleCase(role)] = { $value: contextHex }
      hasOverrides = true
    }
  }
  return hasOverrides ? overrides : null
}

/** Build Surfaces overrides for a context (always 5 tokens since surfaceTint varies) */
function buildSurfacesOverrides(surfaceTintHex: string): Record<string, DtcgValueOnly> {
  const tokens: Record<string, DtcgValueOnly> = {}
  for (const pct of SURFACE_TINT_ALPHAS) {
    tokens[`Surface Tint ${pct}%`] = {
      $value: toHexAlpha(surfaceTintHex, pct),
    }
  }
  return tokens
}

/** Build State Layers overrides: only groups whose scheme role color differs from Light */
function buildStateLayersOverrides(
  lightScheme: Record<M3RoleName, string>,
  contextScheme: Record<M3RoleName, string>,
): Record<string, Record<string, DtcgValueOnly>> | null {
  const groups: Record<string, Record<string, DtcgValueOnly>> = {}
  let hasOverrides = false
  for (const role of SCHEME_ROLES) {
    const lightHex = lightScheme[role]
    const contextHex = contextScheme[role]
    if (contextHex && contextHex !== lightHex) {
      const name = toTitleCase(role)
      groups[name] = {}
      for (const pct of STATE_LAYER_OPACITIES) {
        const key = `Opacity-${String(pct).padStart(2, '0')}`
        groups[name][key] = { $value: toHexAlpha(contextHex, pct) }
      }
      hasOverrides = true
    }
  }
  return hasOverrides ? groups : null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateStyleframeJson(
  config: PaletteConfig,
  mapping: ThemeMapping,
  collectionName?: string,
): string {
  const allSchemes = resolveAllSchemes(config, mapping)
  const lightScheme = allSchemes['Light']

  // Build the base (Light) groups
  const schemes = buildSchemesGroup(lightScheme)
  const surfaces = buildSurfacesGroup(lightScheme.surfaceTint)
  const palettes = buildPalettesGroup(config)
  const stateLayers = buildStateLayersGroup(lightScheme)

  // Build modifiers for each non-Light mode
  const nonLightModes: ModeName[] = [
    'Light High Contrast',
    'Light Medium Contrast',
    'Dark',
    'Dark High Contrast',
    'Dark Medium Contrast',
  ]

  const contexts: Record<string, Record<string, unknown>> = {}

  for (const mode of nonLightModes) {
    const contextScheme = allSchemes[mode]
    const context: Record<string, unknown> = {}

    const schemesOverrides = buildSchemesOverrides(lightScheme, contextScheme)
    if (schemesOverrides) {
      context['Schemes'] = schemesOverrides
    }

    // Surfaces always included (surfaceTint changes per scheme)
    context['Surfaces'] = buildSurfacesOverrides(contextScheme.surfaceTint)

    const stateLayersOverrides = buildStateLayersOverrides(lightScheme, contextScheme)
    if (stateLayersOverrides) {
      context['State Layers'] = stateLayersOverrides
    }

    contexts[mode] = context
  }

  const output = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    $extensions: {
      'dev.styleframe': {
        collection: collectionName ?? 'Palette Bridge',
        modes: [...MODE_NAMES],
      },
    },
    Schemes: schemes,
    Surfaces: surfaces,
    Palettes: palettes,
    'State Layers': stateLayers,
    $modifiers: {
      theme: {
        $type: 'modifier',
        contexts,
      },
    },
  }

  return JSON.stringify(output, null, 2)
}
