import type { PaletteConfig, ShadeRef, RoleAssignments } from '../types'

export function resolveShadeRef(config: PaletteConfig, ref: ShadeRef): string | null {
  const palette = config.palettes[ref.palette]
  if (!palette) return null

  const shade = palette.shades[ref.shade]
  if (shade) return shade.hex

  // Check interpolated shades
  const interpolated = config.interpolated?.[ref.palette]?.[ref.shade]
  if (interpolated) return interpolated.hex

  return null
}

export function resolveAllRoles(
  config: PaletteConfig,
  assignments: RoleAssignments,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [role, ref] of Object.entries(assignments)) {
    const hex = resolveShadeRef(config, ref)
    if (hex) result[role] = hex
  }
  return result
}
