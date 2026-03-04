import type { PaletteConfig } from '../types'

/** Maps Tailwind shade names to M3 tone values. Inverse of the mapping in docs/tone-shade-mapping.md */
export const SHADE_TO_TONE: Record<string, string> = {
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
export const NEAREST_TONE_FILL: Record<string, string> = {
  '5': '0',
  '15': '10',
  '25': '20',
  '35': '30',
  '98': '100',
  '99': '100',
}

/**
 * Build a tonal palette for a single palette family.
 * Returns tone→hex map (18 tones, numerically sorted).
 * Hex values are raw (no case normalization) — callers normalize as needed.
 */
export function buildTonalPalette(
  config: PaletteConfig,
  paletteName: string,
): Record<string, string> {
  const palette = config.palettes[paletteName]
  if (!palette) return {}

  const tones: Record<string, string> = {}

  for (const [shade, value] of Object.entries(palette.shades)) {
    const tone = SHADE_TO_TONE[shade]
    if (tone !== undefined) {
      tones[tone] = value.hex
    }
  }

  const interpolated = config.interpolated?.[paletteName]
  if (interpolated) {
    for (const [shade, value] of Object.entries(interpolated)) {
      const tone = SHADE_TO_TONE[shade]
      if (tone !== undefined) {
        tones[tone] = value.hex
      }
    }
  }

  // Fill missing MTB tones with nearest available tone
  for (const [missingTone, nearestTone] of Object.entries(NEAREST_TONE_FILL)) {
    if (!(missingTone in tones) && nearestTone in tones) {
      tones[missingTone] = tones[nearestTone]
    }
  }

  // Sort numerically
  const sorted: Record<string, string> = {}
  for (const key of Object.keys(tones).sort((a, b) => Number(a) - Number(b))) {
    sorted[key] = tones[key]
  }

  return sorted
}
