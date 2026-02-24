import { describe, it, expect } from 'vitest'
import { hexToOklch, oklchToHex, interpolateOklch, generateIntermediateNeutrals } from '../oklch'

describe('hexToOklch', () => {
  it('converts white', () => {
    const [l, c, h] = hexToOklch('#ffffff')
    expect(l).toBeCloseTo(1, 1)
    expect(c).toBeCloseTo(0, 2)
  })

  it('converts black', () => {
    const [l, c, h] = hexToOklch('#000000')
    expect(l).toBeCloseTo(0, 1)
  })
})

describe('oklchToHex', () => {
  it('round-trips white', () => {
    const oklch = hexToOklch('#ffffff')
    const hex = oklchToHex(oklch[0], oklch[1], oklch[2])
    expect(hex.toLowerCase()).toBe('#ffffff')
  })

  it('round-trips black', () => {
    const oklch = hexToOklch('#000000')
    const hex = oklchToHex(oklch[0], oklch[1], oklch[2])
    expect(hex.toLowerCase()).toBe('#000000')
  })
})

describe('interpolateOklch', () => {
  it('returns start color at position 0', () => {
    const result = interpolateOklch('#000000', '#ffffff', 0)
    expect(result).toBe('#000000')
  })

  it('returns end color at position 1', () => {
    const result = interpolateOklch('#000000', '#ffffff', 1)
    expect(result).toBe('#ffffff')
  })

  it('returns a mid-gray at position 0.5', () => {
    const result = interpolateOklch('#000000', '#ffffff', 0.5)
    const hex = result.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    expect(r).toBeGreaterThan(50)
    expect(r).toBeLessThan(200)
  })
})

describe('generateIntermediateNeutrals', () => {
  it('generates shades between existing palette entries', () => {
    const existing = {
      '50':  { hex: '#f9fafb' },
      '100': { hex: '#f3f4f6' },
      '200': { hex: '#e5e7eb' },
    }
    const targets = [75, 150]
    const result = generateIntermediateNeutrals(existing, targets)

    expect(result).toHaveProperty('75')
    expect(result).toHaveProperty('150')
    expect(result['75'].source.between).toEqual(['50', '100'])
    expect(result['150'].source.between).toEqual(['100', '200'])
  })
})
