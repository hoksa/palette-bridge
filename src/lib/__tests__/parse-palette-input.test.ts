import { describe, it, expect } from 'vitest'
import { parsePaletteInput } from '../parse-palette-input'
import { oklchToHex } from '../oklch'

describe('parsePaletteInput', () => {
  describe('plain hex list (positional)', () => {
    it('maps hex values to shades in order (50, 100, 200, ...)', () => {
      const input = `#eff6ff
#dbeafe
#bfdbfe`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '200': '#bfdbfe',
      })
    })

    it('handles all 11 shades', () => {
      const hexes = [
        '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd',
        '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
        '#1e40af', '#1e3a8a', '#172554',
      ]
      const result = parsePaletteInput(hexes.join('\n'))
      expect(Object.keys(result)).toHaveLength(11)
      expect(result['50']).toBe('#eff6ff')
      expect(result['950']).toBe('#172554')
    })

    it('handles hex without # prefix', () => {
      const input = `eff6ff
dbeafe
bfdbfe`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '200': '#bfdbfe',
      })
    })
  })

  describe('labeled hex', () => {
    it('parses "50: #eff6ff" format', () => {
      const input = `50: #eff6ff
100: #dbeafe
500: #3b82f6`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })

    it('parses quoted JS object format', () => {
      const input = `'50': '#eff6ff',
'100': '#dbeafe',
'500': '#3b82f6',`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })

    it('parses space-separated format "50 #eff6ff"', () => {
      const input = `50 #eff6ff
100 #dbeafe
500 #3b82f6`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })
  })

  describe('CSS custom properties', () => {
    it('extracts shade from --color-primary-50: #eff6ff;', () => {
      const input = `--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-500: #3b82f6;`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
        '500': '#3b82f6',
      })
    })

    it('works with various variable naming patterns', () => {
      const input = `--primary-50: #eff6ff;
--blue-500: #3b82f6;`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '500': '#3b82f6',
      })
    })
  })

  describe('OKLCH values', () => {
    it('parses "50: oklch(0.97 0.01 250)" and converts to hex', () => {
      const input = '50: oklch(0.97 0.01 250)'
      const result = parsePaletteInput(input)
      const expected = oklchToHex(0.97, 0.01, 250)
      expect(result['50']).toBe(expected)
    })

    it('parses CSS var with oklch value', () => {
      const input = '--color-primary-50: oklch(0.97 0.01 250);'
      const result = parsePaletteInput(input)
      const expected = oklchToHex(0.97, 0.01, 250)
      expect(result['50']).toBe(expected)
    })

    it('normalizes percentage-based lightness oklch(97% 0.01 250) to 0.97', () => {
      const input = '50: oklch(97% 0.01 250)'
      const result = parsePaletteInput(input)
      const expected = oklchToHex(0.97, 0.01, 250)
      expect(result['50']).toBe(expected)
    })
  })

  describe('edge cases', () => {
    it('empty input returns {}', () => {
      expect(parsePaletteInput('')).toEqual({})
    })

    it('non-matching lines are ignored', () => {
      const input = `This is some random text
50: #eff6ff
Another line that should be ignored`
      const result = parsePaletteInput(input)
      expect(result).toEqual({ '50': '#eff6ff' })
    })

    it('invalid shade numbers are rejected (only 50,100,...,950 accepted)', () => {
      const input = `50: #eff6ff
75: #aabbcc
150: #ddeeff
500: #3b82f6`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '500': '#3b82f6',
      })
      expect(result).not.toHaveProperty('75')
      expect(result).not.toHaveProperty('150')
    })

    it('expands 3-digit hex shorthand (#fff → #ffffff)', () => {
      const input = `#fff
#000
#abc`
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#ffffff',
        '100': '#000000',
        '200': '#aabbcc',
      })
    })

    it('whitespace is trimmed', () => {
      const input = `  50: #eff6ff
  100:   #dbeafe  `
      const result = parsePaletteInput(input)
      expect(result).toEqual({
        '50': '#eff6ff',
        '100': '#dbeafe',
      })
    })
  })
})
