import type { PaletteConfig, ThemeMapping, M3RoleName } from '../types'
import { resolveShadeRef } from './palette'
import { KOTLIN_COLOR_SCHEME_ROLES } from '../data/m3-roles'

interface VariantSpec {
  suffix: string
  getAssignments: (mapping: ThemeMapping) => Record<string, { palette: string; shade: string }>
}

const VARIANT_SPECS: VariantSpec[] = [
  { suffix: 'Light', getAssignments: (m) => m.light },
  { suffix: 'Dark', getAssignments: (m) => m.dark },
  { suffix: 'LightMediumContrast', getAssignments: (m) => m.mediumContrast.light },
  { suffix: 'DarkMediumContrast', getAssignments: (m) => m.mediumContrast.dark },
  { suffix: 'LightHighContrast', getAssignments: (m) => m.highContrast.light },
  { suffix: 'DarkHighContrast', getAssignments: (m) => m.highContrast.dark },
]

function hexToArgb(hex: string): string {
  // Strip leading # if present, uppercase, and prepend FF alpha
  const clean = hex.replace(/^#/, '').toUpperCase()
  return `FF${clean}`
}

export function generateColorKt(
  config: PaletteConfig,
  mapping: ThemeMapping,
  packageName: string,
): string {
  const lines: string[] = []

  lines.push(`package ${packageName}`)
  lines.push('')
  lines.push('import androidx.compose.ui.graphics.Color')
  lines.push('')

  for (const variant of VARIANT_SPECS) {
    const assignments = variant.getAssignments(mapping)
    for (const role of KOTLIN_COLOR_SCHEME_ROLES) {
      const ref = assignments[role]
      if (!ref) continue
      const hex = resolveShadeRef(config, ref)
      if (!hex) continue
      const argb = hexToArgb(hex)
      lines.push(`val ${role}${variant.suffix} = Color(0x${argb})`)
    }
  }

  return lines.join('\n') + '\n'
}

interface SchemeSpec {
  name: string
  constructor: 'lightColorScheme' | 'darkColorScheme'
  suffix: string
}

const SCHEME_SPECS: SchemeSpec[] = [
  { name: 'lightScheme', constructor: 'lightColorScheme', suffix: 'Light' },
  { name: 'darkScheme', constructor: 'darkColorScheme', suffix: 'Dark' },
  { name: 'mediumContrastLightColorScheme', constructor: 'lightColorScheme', suffix: 'LightMediumContrast' },
  { name: 'mediumContrastDarkColorScheme', constructor: 'darkColorScheme', suffix: 'DarkMediumContrast' },
  { name: 'highContrastLightColorScheme', constructor: 'lightColorScheme', suffix: 'LightHighContrast' },
  { name: 'highContrastDarkColorScheme', constructor: 'darkColorScheme', suffix: 'DarkHighContrast' },
]

export function generateThemeKt(packageName: string): string {
  const lines: string[] = []

  lines.push(`package ${packageName}`)
  lines.push('')
  lines.push('import androidx.compose.material3.darkColorScheme')
  lines.push('import androidx.compose.material3.lightColorScheme')
  lines.push('')

  for (const scheme of SCHEME_SPECS) {
    lines.push(`private val ${scheme.name} = ${scheme.constructor}(`)
    for (const role of KOTLIN_COLOR_SCHEME_ROLES) {
      lines.push(`    ${role} = ${role}${scheme.suffix},`)
    }
    lines.push(')')
    lines.push('')
  }

  return lines.join('\n') + '\n'
}
