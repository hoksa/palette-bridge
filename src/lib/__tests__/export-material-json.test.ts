import { describe, it, expect } from 'vitest'
import { generateMaterialJson } from '../export-material-json'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateMaterialJson', () => {
  const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
  const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
  const parsed = JSON.parse(json)

  it('includes MTB top-level metadata fields', () => {
    expect(parsed).toHaveProperty('description')
    expect(parsed).toHaveProperty('seed')
    expect(parsed).toHaveProperty('coreColors')
    expect(parsed).toHaveProperty('extendedColors')
    expect(parsed).not.toHaveProperty('source')
  })

  it('description starts with TYPE: CUSTOM', () => {
    expect(parsed.description).toMatch(/^TYPE: CUSTOM/)
  })

  it('seed is the primary palette shade-600 hex', () => {
    expect(parsed.seed).toMatch(/^#[0-9A-F]{6}$/)
    expect(parsed.seed).toBe('#2563EB')
  })

  it('coreColors contains all 5 MTB palette families', () => {
    expect(Object.keys(parsed.coreColors)).toEqual(
      expect.arrayContaining(['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant'])
    )
    for (const hex of Object.values(parsed.coreColors)) {
      expect(hex).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('extendedColors is an empty array', () => {
    expect(parsed.extendedColors).toEqual([])
  })

  it('produces valid scheme structure with all 6 schemes', () => {
    expect(parsed).toHaveProperty('schemes')
    expect(parsed.schemes).toHaveProperty('light')
    expect(parsed.schemes).toHaveProperty('dark')
    expect(parsed.schemes).toHaveProperty('light-medium-contrast')
    expect(parsed.schemes).toHaveProperty('light-high-contrast')
    expect(parsed.schemes).toHaveProperty('dark-medium-contrast')
    expect(parsed.schemes).toHaveProperty('dark-high-contrast')
  })

  it('includes all 49 color roles per scheme', () => {
    expect(Object.keys(parsed.schemes.light)).toHaveLength(49)
    expect(parsed.schemes.light).toHaveProperty('primary')
    expect(parsed.schemes.light).toHaveProperty('surfaceContainerHighest')
    expect(parsed.schemes.light).toHaveProperty('primaryFixed')
  })

  it('scheme roles are in MTB order (surfaceTint after primary)', () => {
    const roles = Object.keys(parsed.schemes.light)
    expect(roles[0]).toBe('primary')
    expect(roles[1]).toBe('surfaceTint')
    expect(roles[2]).toBe('onPrimary')
  })

  it('uses uppercase hex values with # prefix in schemes', () => {
    expect(parsed.schemes.light.primary).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('palettes have all 18 MTB tone stops', () => {
    const toneKeys = Object.keys(parsed.palettes.primary)
    const expectedTones = ['0', '5', '10', '15', '20', '25', '30', '35', '40', '50', '60', '70', '80', '90', '95', '98', '99', '100']
    for (const tone of expectedTones) {
      expect(toneKeys).toContain(tone)
    }
    expect(toneKeys).toHaveLength(18)
    // Must NOT have Tailwind shade names
    expect(toneKeys).not.toContain('200')
    expect(toneKeys).not.toContain('white')
    expect(toneKeys).not.toContain('black')
  })

  it('palette tones are in numeric order', () => {
    const toneKeys = Object.keys(parsed.palettes.primary)
    const asNumbers = toneKeys.map(Number)
    for (let i = 1; i < asNumbers.length; i++) {
      expect(asNumbers[i]).toBeGreaterThan(asNumbers[i - 1])
    }
  })

  it('palettes include MTB families: primary, secondary, tertiary, neutral, neutral-variant', () => {
    expect(parsed.palettes).toHaveProperty('primary')
    expect(parsed.palettes).toHaveProperty('secondary')
    expect(parsed.palettes).toHaveProperty('tertiary')
    expect(parsed.palettes).toHaveProperty('neutral')
    expect(parsed.palettes).toHaveProperty('neutral-variant')
    expect(parsed.palettes).not.toHaveProperty('error')
  })

  it('palette hex values are uppercase with # prefix', () => {
    expect(parsed.palettes.primary['40']).toMatch(/^#[0-9A-F]{6}$/)
  })
})
