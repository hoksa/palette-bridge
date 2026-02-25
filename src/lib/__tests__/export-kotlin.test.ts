import { describe, it, expect } from 'vitest'
import { generateColorKt, generateThemeKt } from '../export-kotlin'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import { buildDefaultMapping } from '../../data/default-mapping'

describe('generateColorKt', () => {
  it('produces valid Kotlin color declarations', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateColorKt(SAMPLE_PALETTE_CONFIG, mapping, 'com.example.ui.theme')

    expect(output).toContain('package com.example.ui.theme')
    expect(output).toContain('import androidx.compose.ui.graphics.Color')
    expect(output).toContain('val primaryLight = Color(0xFF')
    expect(output).toContain('val onPrimaryLight = Color(0xFFFFFFFF)')
    expect(output).toContain('val primaryDark = Color(0xFF')
    expect(output).toContain('val primaryLightMediumContrast = Color(0xFF')
    expect(output).toContain('val primaryDarkHighContrast = Color(0xFF')
  })

  it('uses uppercase hex without # prefix', () => {
    const mapping = buildDefaultMapping(SAMPLE_PALETTE_CONFIG)
    const output = generateColorKt(SAMPLE_PALETTE_CONFIG, mapping, 'com.example.ui.theme')

    expect(output).not.toMatch(/Color\(0xFF[a-f]/)
    expect(output).not.toContain('Color(#')
  })
})

describe('generateThemeKt', () => {
  it('produces six ColorScheme constructors', () => {
    const output = generateThemeKt('com.example.ui.theme')

    expect(output).toContain('private val lightScheme = lightColorScheme(')
    expect(output).toContain('private val darkScheme = darkColorScheme(')
    expect(output).toContain('private val mediumContrastLightColorScheme = lightColorScheme(')
    expect(output).toContain('private val highContrastLightColorScheme = lightColorScheme(')
    expect(output).toContain('private val mediumContrastDarkColorScheme = darkColorScheme(')
    expect(output).toContain('private val highContrastDarkColorScheme = darkColorScheme(')
  })

  it('references color constants with correct suffixes', () => {
    const output = generateThemeKt('com.example.ui.theme')

    expect(output).toContain('primary = primaryLight,')
    expect(output).toContain('primary = primaryDark,')
    expect(output).toContain('primary = primaryLightMediumContrast,')
    expect(output).toContain('primary = primaryDarkHighContrast,')
  })
})
