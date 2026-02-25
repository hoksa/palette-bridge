import type { PaletteConfig, ThemeMapping, RoleAssignments } from '../types'
import { ALL_M3_ROLES } from '../data/m3-roles'
import { resolveShadeRef } from './palette'

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function buildCssBlock(
  selector: string,
  config: PaletteConfig,
  assignments: RoleAssignments,
): string {
  const lines: string[] = [`${selector} {`]

  for (const roleName of ALL_M3_ROLES) {
    const ref = assignments[roleName]
    if (!ref) continue
    const hex = resolveShadeRef(config, ref)
    if (!hex) continue
    const kebabName = camelToKebab(roleName)
    lines.push(`  --md-sys-color-${kebabName}: ${hex};`)
  }

  lines.push('}')
  return lines.join('\n')
}

export function generateCss(
  config: PaletteConfig,
  mapping: ThemeMapping,
): string {
  const lightBlock = buildCssBlock(':root', config, mapping.light)
  const darkBlock = buildCssBlock('[data-theme="dark"]', config, mapping.dark)

  return `${lightBlock}\n\n${darkBlock}\n`
}
