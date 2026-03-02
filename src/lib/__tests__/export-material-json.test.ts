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

  it('uses uppercase hex values with # prefix in schemes', () => {
    expect(parsed.schemes.light.primary).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('palettes use M3 tone keys (0-100) not Tailwind shade keys', () => {
    const toneKeys = Object.keys(parsed.palettes.primary)
    // Must have M3 tone numbers, not Tailwind shade names
    expect(toneKeys).toContain('0')
    expect(toneKeys).toContain('10')
    expect(toneKeys).toContain('40')
    expect(toneKeys).toContain('90')
    expect(toneKeys).toContain('100')
    // Must NOT have Tailwind shade names
    expect(toneKeys).toContain('50')  // M3 tone 50, mapped from Tailwind shade 500
    expect(toneKeys).not.toContain('200')
    expect(toneKeys).not.toContain('white')
    expect(toneKeys).not.toContain('black')
  })

  it('palettes include MTB families: primary, secondary, tertiary, neutral, neutral-variant', () => {
    expect(parsed.palettes).toHaveProperty('primary')
    expect(parsed.palettes).toHaveProperty('secondary')
    expect(parsed.palettes).toHaveProperty('tertiary')
    expect(parsed.palettes).toHaveProperty('neutral')
    expect(parsed.palettes).toHaveProperty('neutral-variant')
  })

  it('palette hex values are uppercase with # prefix', () => {
    expect(parsed.palettes.primary['40']).toMatch(/^#[0-9A-F]{6}$/)
  })
})
