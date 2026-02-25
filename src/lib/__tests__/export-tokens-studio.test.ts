import { describe, it, expect } from 'vitest'
import { generateTokensStudio } from '../export-tokens-studio'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateTokensStudio', () => {
  it('produces W3C DTCG format with core, light, and dark', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const result = generateTokensStudio(SAMPLE_PALETTE_CONFIG, mapping)

    expect(result).toHaveProperty('core')
    expect(result).toHaveProperty('light')
    expect(result).toHaveProperty('dark')
  })

  it('core contains palette primitives with $type and $value', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const result = generateTokensStudio(SAMPLE_PALETTE_CONFIG, mapping)
    const core = JSON.parse(result.core)

    expect(core.palette.primary['600']).toEqual({
      $type: 'color',
      $value: '#2563eb',
    })
  })

  it('light theme uses references to core tokens', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const result = generateTokensStudio(SAMPLE_PALETTE_CONFIG, mapping)
    const light = JSON.parse(result.light)

    // primary in light standard maps to primary-600
    expect(light.color.primary.$type).toBe('color')
    expect(light.color.primary.$value).toBe('{palette.primary.600}')
  })

  it('dark theme uses references to core tokens', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const result = generateTokensStudio(SAMPLE_PALETTE_CONFIG, mapping)
    const dark = JSON.parse(result.dark)

    // primary in dark standard maps to primary-200
    expect(dark.color.primary.$type).toBe('color')
    expect(dark.color.primary.$value).toBe('{palette.primary.200}')
  })
})
