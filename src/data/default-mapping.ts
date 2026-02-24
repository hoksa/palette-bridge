import type { PaletteConfig, ThemeMapping, RoleAssignments } from '../types'
import { buildRoleAssignments } from './contrast-shifts'

export function buildDefaultMapping(_paletteConfig: PaletteConfig): ThemeMapping {
  return {
    light: buildRoleAssignments('standard', 'light') as RoleAssignments,
    dark: buildRoleAssignments('standard', 'dark') as RoleAssignments,
    mediumContrast: {
      light: buildRoleAssignments('medium', 'light') as RoleAssignments,
      dark: buildRoleAssignments('medium', 'dark') as RoleAssignments,
    },
    highContrast: {
      light: buildRoleAssignments('high', 'light') as RoleAssignments,
      dark: buildRoleAssignments('high', 'dark') as RoleAssignments,
    },
  }
}
