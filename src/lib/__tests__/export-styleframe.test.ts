import { describe, it, expect } from 'vitest'
import { generateStyleframeJson } from '../export-styleframe'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateStyleframeJson', () => {
  const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
  const json = generateStyleframeJson(SAMPLE_PALETTE_CONFIG, mapping)
  const parsed = JSON.parse(json)

  it('has correct top-level structure', () => {
    expect(parsed).toHaveProperty('$schema')
    expect(parsed).toHaveProperty('$extensions')
    expect(parsed).toHaveProperty('Schemes')
    expect(parsed).toHaveProperty('Surfaces')
    expect(parsed).toHaveProperty('Palettes')
    expect(parsed).toHaveProperty('State Layers')
    expect(parsed).toHaveProperty('$modifiers')
  })

  it('$extensions metadata has collection and six modes', () => {
    const ext = parsed.$extensions['dev.styleframe']

    expect(typeof ext.collection).toBe('string')
    expect(ext.modes).toEqual([
      'Light',
      'Light High Contrast',
      'Light Medium Contrast',
      'Dark',
      'Dark High Contrast',
      'Dark Medium Contrast',
    ])
  })

  it('Schemes has 49 tokens', () => {
    expect(Object.keys(parsed.Schemes)).toHaveLength(49)
  })

  it('Scheme token names are Title Case', () => {
    const schemeKeys = Object.keys(parsed.Schemes)

    // These Title Case names must exist
    expect(schemeKeys).toContain('Primary')
    expect(schemeKeys).toContain('Surface Tint')
    expect(schemeKeys).toContain('On Primary')
    expect(schemeKeys).toContain('Primary Container')
    expect(schemeKeys).toContain('On Primary Container')
    expect(schemeKeys).toContain('Surface Container Highest')
    expect(schemeKeys).toContain('On Tertiary Fixed Variant')
    expect(schemeKeys).toContain('Inverse On Surface')

    // camelCase names must NOT exist
    expect(schemeKeys).not.toContain('primaryContainer')
    expect(schemeKeys).not.toContain('onPrimary')
    expect(schemeKeys).not.toContain('surfaceTint')
  })

  it('Scheme values are lowercase hex with $type color', () => {
    for (const token of Object.values(parsed.Schemes)) {
      const t = token as { $value: string; $type: string }
      expect(t.$value).toMatch(/^#[0-9a-f]{6}$/)
      expect(t.$type).toBe('color')
    }
  })

  it('Palettes has 108 tokens', () => {
    expect(Object.keys(parsed.Palettes)).toHaveLength(108)
  })

  it('Palette token names follow "Family Tone" pattern', () => {
    const paletteKeys = Object.keys(parsed.Palettes)

    // These "Family Tone" names must exist
    expect(paletteKeys).toContain('Primary 40')
    expect(paletteKeys).toContain('Secondary 10')
    expect(paletteKeys).toContain('Tertiary 95')
    expect(paletteKeys).toContain('Error 0')
    expect(paletteKeys).toContain('Neutral 50')
    expect(paletteKeys).toContain('Neutral Variant 80')

    // Tailwind shade names must NOT exist
    expect(paletteKeys).not.toContain('Primary 600')
    expect(paletteKeys).not.toContain('Secondary 200')
    expect(paletteKeys).not.toContain('Neutral 950')
  })

  it('Palette values are lowercase hex with $type color', () => {
    for (const token of Object.values(parsed.Palettes)) {
      const t = token as { $value: string; $type: string }
      expect(t.$value).toMatch(/^#[0-9a-f]{6}$/)
      expect(t.$type).toBe('color')
    }
  })

  it('Surfaces has 5 tokens with 8-digit hex values', () => {
    const surfaceKeys = Object.keys(parsed.Surfaces)
    expect(surfaceKeys).toEqual([
      'Surface Tint 5%',
      'Surface Tint 8%',
      'Surface Tint 11%',
      'Surface Tint 12%',
      'Surface Tint 14%',
    ])

    for (const token of Object.values(parsed.Surfaces)) {
      const t = token as { $value: string; $type: string }
      expect(t.$value).toMatch(/^#[0-9a-f]{8}$/)
      expect(t.$type).toBe('color')
    }
  })

  it('State Layers has 49 groups with 3 sub-tokens each', () => {
    const stateLayers = parsed['State Layers']
    const groupKeys = Object.keys(stateLayers)
    expect(groupKeys).toHaveLength(49)

    for (const group of Object.values(stateLayers)) {
      const g = group as Record<string, { $value: string; $type: string }>
      const subKeys = Object.keys(g)
      expect(subKeys).toEqual(['Opacity-08', 'Opacity-10', 'Opacity-16'])

      for (const subToken of Object.values(g)) {
        expect(subToken.$value).toMatch(/^#[0-9a-f]{8}$/)
        expect(subToken.$type).toBe('color')
      }
    }
  })

  it('$modifiers has 5 theme contexts', () => {
    const contextKeys = Object.keys(parsed.$modifiers.theme.contexts)
    expect(contextKeys).toEqual([
      'Light High Contrast',
      'Light Medium Contrast',
      'Dark',
      'Dark High Contrast',
      'Dark Medium Contrast',
    ])
  })

  it('modifier overrides are sparse', () => {
    const darkCtx = parsed.$modifiers.theme.contexts.Dark

    expect(darkCtx).toHaveProperty('Schemes')
    expect(darkCtx).toHaveProperty('Surfaces')
    expect(darkCtx).toHaveProperty('State Layers')

    // Sparse: Dark Schemes should have fewer keys than the full 49
    const darkSchemeCount = Object.keys(darkCtx.Schemes).length
    expect(darkSchemeCount).toBeLessThan(49)
    expect(darkSchemeCount).toBeGreaterThan(0)
  })

  it('Palettes are NOT in $modifiers', () => {
    for (const context of Object.values(parsed.$modifiers.theme.contexts)) {
      const ctx = context as Record<string, unknown>
      expect(ctx).not.toHaveProperty('Palettes')
    }
  })
})
