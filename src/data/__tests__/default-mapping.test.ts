import { describe, it, expect } from 'vitest'
import { buildDefaultMapping } from '../default-mapping'
import { SAMPLE_PALETTE_CONFIG } from '../sample-palette'

describe('buildDefaultMapping', () => {
  it('produces a complete ThemeMapping with all roles assigned', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(Object.keys(mapping.light).length).toBeGreaterThanOrEqual(35)
    expect(mapping.light.primary).toEqual({ palette: 'primary', shade: '600' })
    expect(mapping.light.onPrimary).toEqual({ palette: 'primary', shade: 'white' })
    expect(mapping.light.primaryContainer).toEqual({ palette: 'primary', shade: '100' })
    expect(mapping.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '700' })
  })

  it('maps dark theme with inverted tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.dark.primary).toEqual({ palette: 'primary', shade: '200' })
    expect(mapping.dark.onPrimary).toEqual({ palette: 'primary', shade: '800' })
    expect(mapping.dark.primaryContainer).toEqual({ palette: 'primary', shade: '700' })
    expect(mapping.dark.onPrimaryContainer).toEqual({ palette: 'primary', shade: '100' })
  })

  it('generates medium contrast with shifted tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.mediumContrast.light.primary).toEqual({ palette: 'primary', shade: '700' })
    expect(mapping.mediumContrast.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '800' })
  })

  it('generates high contrast with extreme tones', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.highContrast.light.onPrimaryContainer).toEqual({ palette: 'primary', shade: '900' })
    expect(mapping.highContrast.dark.onPrimary).toEqual({ palette: 'primary', shade: '950' })
  })

  it('maps surface roles to neutral palette', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.light.surface.palette).toBe('neutral')
    expect(mapping.light.onSurface.palette).toBe('neutral')
    expect(mapping.dark.surface.palette).toBe('neutral')
  })

  it('maps error roles to error palette', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)

    expect(mapping.light.error.palette).toBe('error')
    expect(mapping.light.onError.palette).toBe('error')
  })
})
