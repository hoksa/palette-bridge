import { describe, it, expect } from 'vitest'
import { generateMaterialJson } from '../export-material-json'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateMaterialJson', () => {
  it('produces valid Material Theme Builder JSON structure', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(parsed).toHaveProperty('schemes')
    expect(parsed).toHaveProperty('palettes')
    expect(parsed.schemes).toHaveProperty('light')
    expect(parsed.schemes).toHaveProperty('dark')
    expect(parsed.schemes).toHaveProperty('light-medium-contrast')
    expect(parsed.schemes).toHaveProperty('light-high-contrast')
    expect(parsed.schemes).toHaveProperty('dark-medium-contrast')
    expect(parsed.schemes).toHaveProperty('dark-high-contrast')
  })

  it('includes all 49 color roles per scheme', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(Object.keys(parsed.schemes.light)).toHaveLength(49)
    expect(parsed.schemes.light).toHaveProperty('primary')
    expect(parsed.schemes.light).toHaveProperty('surfaceContainerHighest')
    expect(parsed.schemes.light).toHaveProperty('primaryFixed')
  })

  it('uses uppercase hex values with # prefix', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const json = generateMaterialJson(SAMPLE_PALETTE_CONFIG, mapping)
    const parsed = JSON.parse(json)

    expect(parsed.schemes.light.primary).toMatch(/^#[0-9A-F]{6}$/)
  })
})
