import { describe, it, expect } from 'vitest'
import { generateCss } from '../export-css'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateCss', () => {
  it('produces :root selector with light theme variables', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateCss(SAMPLE_PALETTE_CONFIG, mapping)

    expect(output).toContain(':root {')
    expect(output).toContain('--md-sys-color-primary:')
  })

  it('produces dark theme selector', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateCss(SAMPLE_PALETTE_CONFIG, mapping)

    expect(output).toContain('[data-theme="dark"] {')
  })

  it('uses kebab-case role names', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateCss(SAMPLE_PALETTE_CONFIG, mapping)

    expect(output).toContain('--md-sys-color-on-primary:')
    expect(output).toContain('--md-sys-color-primary-container:')
    expect(output).toContain('--md-sys-color-surface-container-highest:')
  })

  it('includes hex values', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateCss(SAMPLE_PALETTE_CONFIG, mapping)

    expect(output).toMatch(/--md-sys-color-primary: #[0-9a-f]{6};/)
  })
})
