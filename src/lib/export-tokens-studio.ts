import type { PaletteConfig, ThemeMapping } from '../types'
import { ALL_M3_ROLES } from '../data/m3-roles'

interface DtcgToken {
  $type: string
  $value: string
}

export function generateTokensStudio(
  config: PaletteConfig,
  mapping: ThemeMapping,
): { core: string; light: string; dark: string } {
  // Build core: palette primitives
  const core: Record<string, Record<string, Record<string, DtcgToken>>> = { palette: {} }

  for (const [paletteName, palette] of Object.entries(config.palettes)) {
    const shadeTokens: Record<string, DtcgToken> = {}
    for (const [shade, value] of Object.entries(palette.shades)) {
      shadeTokens[shade] = { $type: 'color', $value: value.hex }
    }
    // Include interpolated shades
    const interpolated = config.interpolated?.[paletteName]
    if (interpolated) {
      for (const [shade, value] of Object.entries(interpolated)) {
        shadeTokens[shade] = { $type: 'color', $value: value.hex }
      }
    }
    core.palette[paletteName] = shadeTokens
  }

  // Build light theme: references to core tokens
  const light: Record<string, Record<string, DtcgToken>> = { color: {} }
  for (const roleName of ALL_M3_ROLES) {
    const ref = mapping.light[roleName]
    if (ref) {
      light.color[roleName] = {
        $type: 'color',
        $value: `{palette.${ref.palette}.${ref.shade}}`,
      }
    }
  }

  // Build dark theme: references to core tokens
  const dark: Record<string, Record<string, DtcgToken>> = { color: {} }
  for (const roleName of ALL_M3_ROLES) {
    const ref = mapping.dark[roleName]
    if (ref) {
      dark.color[roleName] = {
        $type: 'color',
        $value: `{palette.${ref.palette}.${ref.shade}}`,
      }
    }
  }

  return {
    core: JSON.stringify(core, null, 2),
    light: JSON.stringify(light, null, 2),
    dark: JSON.stringify(dark, null, 2),
  }
}
