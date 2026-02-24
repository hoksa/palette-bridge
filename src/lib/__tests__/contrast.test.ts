import { describe, it, expect } from 'vitest'
import { hexToRgb, relativeLuminance, contrastRatio, meetsWCAG } from '../contrast'

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
  })

  it('handles uppercase', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0])
  })
})

describe('relativeLuminance', () => {
  it('returns 1 for white', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 4)
  })

  it('returns 0 for black', () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 4)
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('returns 1 for same color', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 1)
  })

  it('is symmetric', () => {
    const a = contrastRatio('#336699', '#ffffff')
    const b = contrastRatio('#ffffff', '#336699')
    expect(a).toBeCloseTo(b, 4)
  })
})

describe('meetsWCAG', () => {
  it('classifies contrast levels', () => {
    expect(meetsWCAG(21)).toBe('AAA')
    expect(meetsWCAG(7)).toBe('AAA')
    expect(meetsWCAG(4.5)).toBe('AA')
    expect(meetsWCAG(3)).toBe('AA-large')
    expect(meetsWCAG(2)).toBe('fail')
  })
})
