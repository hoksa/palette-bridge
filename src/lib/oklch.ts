import type { InterpolatedShade } from '../types'
import { hexToRgb } from './contrast'

// sRGB → linear sRGB
function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

// linear sRGB → sRGB (0-255)
function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.min(255, Math.max(0, s * 255)))
}

// linear sRGB → OKLab
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l = Math.cbrt(l_)
  const m = Math.cbrt(m_)
  const s = Math.cbrt(s_)

  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

// OKLab → linear sRGB
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
}

// OKLab → OKLCH
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b)
  let h = Math.atan2(b, a) * (180 / Math.PI)
  if (h < 0) h += 360
  return [L, C, h]
}

// OKLCH → OKLab
function oklchToOklab(L: number, C: number, h: number): [number, number, number] {
  const hRad = h * (Math.PI / 180)
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)]
}

export function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const [L, a, ob] = linearRgbToOklab(lr, lg, lb)
  return oklabToOklch(L, a, ob)
}

export function oklchToHex(L: number, C: number, h: number): string {
  const [oL, a, b] = oklchToOklab(L, C, h)
  const [lr, lg, lb] = oklabToLinearRgb(oL, a, b)
  const r = linearToSrgb(lr)
  const g = linearToSrgb(lg)
  const bv = linearToSrgb(lb)
  return '#' + [r, g, bv].map(c => c.toString(16).padStart(2, '0')).join('')
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  let result = a + diff * t
  if (result < 0) result += 360
  if (result >= 360) result -= 360
  return result
}

export function interpolateOklch(hex1: string, hex2: string, position: number): string {
  const [l1, c1, h1] = hexToOklch(hex1)
  const [l2, c2, h2] = hexToOklch(hex2)

  const L = l1 + (l2 - l1) * position
  const C = c1 + (c2 - c1) * position
  // For achromatic colors (very low chroma), skip hue interpolation
  const H = (c1 < 0.001 && c2 < 0.001) ? 0 : lerpAngle(h1, h2, position)

  return oklchToHex(L, C, H)
}

export function generateIntermediateNeutrals(
  existing: Record<string, { hex: string }>,
  targets: number[],
): Record<string, InterpolatedShade> {
  const shadeKeys = Object.keys(existing)
    .map(Number)
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b)

  const result: Record<string, InterpolatedShade> = {}

  for (const target of targets) {
    // Find the two surrounding shades
    let lower = shadeKeys[0]
    let upper = shadeKeys[shadeKeys.length - 1]

    for (let i = 0; i < shadeKeys.length - 1; i++) {
      if (shadeKeys[i] <= target && shadeKeys[i + 1] >= target) {
        lower = shadeKeys[i]
        upper = shadeKeys[i + 1]
        break
      }
    }

    const position = upper === lower ? 0 : (target - lower) / (upper - lower)
    const hex1 = existing[String(lower)].hex
    const hex2 = existing[String(upper)].hex
    const interpolatedHex = interpolateOklch(hex1, hex2, position)
    const [l, c, h] = hexToOklch(interpolatedHex)

    result[String(target)] = {
      hex: interpolatedHex,
      oklch: `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(1)})`,
      source: {
        between: [String(lower), String(upper)],
        position,
      },
    }
  }

  return result
}
