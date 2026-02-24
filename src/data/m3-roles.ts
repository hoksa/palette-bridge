import type { M3RoleInfo, M3RoleName, M3RoleFamily } from '../types'

export const M3_ROLES: M3RoleInfo[] = [
  // Primary family
  { name: 'primary', family: 'primary', pairedWith: 'onPrimary', description: 'Primary action color', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'onPrimary', family: 'primary', pairedWith: 'primary', description: 'Text/icon on primary', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'primaryContainer', family: 'primary', pairedWith: 'onPrimaryContainer', description: 'Primary container background', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'onPrimaryContainer', family: 'primary', pairedWith: 'primaryContainer', description: 'Text/icon on primary container', defaultPalette: 'primary', inKotlinColorScheme: true },

  // Secondary family
  { name: 'secondary', family: 'secondary', pairedWith: 'onSecondary', description: 'Secondary action color', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'onSecondary', family: 'secondary', pairedWith: 'secondary', description: 'Text/icon on secondary', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'secondaryContainer', family: 'secondary', pairedWith: 'onSecondaryContainer', description: 'Secondary container background', defaultPalette: 'secondary', inKotlinColorScheme: true },
  { name: 'onSecondaryContainer', family: 'secondary', pairedWith: 'secondaryContainer', description: 'Text/icon on secondary container', defaultPalette: 'secondary', inKotlinColorScheme: true },

  // Tertiary family
  { name: 'tertiary', family: 'tertiary', pairedWith: 'onTertiary', description: 'Tertiary action color', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'onTertiary', family: 'tertiary', pairedWith: 'tertiary', description: 'Text/icon on tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'tertiaryContainer', family: 'tertiary', pairedWith: 'onTertiaryContainer', description: 'Tertiary container background', defaultPalette: 'tertiary', inKotlinColorScheme: true },
  { name: 'onTertiaryContainer', family: 'tertiary', pairedWith: 'tertiaryContainer', description: 'Text/icon on tertiary container', defaultPalette: 'tertiary', inKotlinColorScheme: true },

  // Error family
  { name: 'error', family: 'error', pairedWith: 'onError', description: 'Error color', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'onError', family: 'error', pairedWith: 'error', description: 'Text/icon on error', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'errorContainer', family: 'error', pairedWith: 'onErrorContainer', description: 'Error container background', defaultPalette: 'error', inKotlinColorScheme: true },
  { name: 'onErrorContainer', family: 'error', pairedWith: 'errorContainer', description: 'Text/icon on error container', defaultPalette: 'error', inKotlinColorScheme: true },

  // Surface family
  { name: 'surface', family: 'surface', pairedWith: 'onSurface', description: 'Default surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onSurface', family: 'surface', pairedWith: 'surface', description: 'Text/icon on surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceVariant', family: 'surface', pairedWith: 'onSurfaceVariant', description: 'Surface variant', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onSurfaceVariant', family: 'surface', pairedWith: 'surfaceVariant', description: 'Text/icon on surface variant', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceDim', family: 'surface', pairedWith: 'onSurface', description: 'Dimmed surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceBright', family: 'surface', pairedWith: 'onSurface', description: 'Bright surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerLowest', family: 'surface', pairedWith: 'onSurface', description: 'Lowest elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerLow', family: 'surface', pairedWith: 'onSurface', description: 'Low elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainer', family: 'surface', pairedWith: 'onSurface', description: 'Default container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerHigh', family: 'surface', pairedWith: 'onSurface', description: 'High elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'surfaceContainerHighest', family: 'surface', pairedWith: 'onSurface', description: 'Highest elevation container', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'inverseSurface', family: 'surface', pairedWith: 'inverseOnSurface', description: 'Inverse surface (snackbars)', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'inverseOnSurface', family: 'surface', pairedWith: 'inverseSurface', description: 'Text on inverse surface', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'background', family: 'surface', pairedWith: 'onBackground', description: 'Background', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'onBackground', family: 'surface', pairedWith: 'background', description: 'Text/icon on background', defaultPalette: 'neutral', inKotlinColorScheme: true },

  // Other
  { name: 'inversePrimary', family: 'other', pairedWith: 'inverseSurface', description: 'Primary on inverse surface', defaultPalette: 'primary', inKotlinColorScheme: true },
  { name: 'outline', family: 'other', pairedWith: null, description: 'Border/divider', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'outlineVariant', family: 'other', pairedWith: null, description: 'Subtle border', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'scrim', family: 'other', pairedWith: null, description: 'Scrim overlay', defaultPalette: 'neutral', inKotlinColorScheme: true },
  { name: 'shadow', family: 'other', pairedWith: null, description: 'Shadow color', defaultPalette: 'neutral', inKotlinColorScheme: false },
  { name: 'surfaceTint', family: 'other', pairedWith: null, description: 'Surface tint (elevation overlay)', defaultPalette: 'primary', inKotlinColorScheme: false },

  // Fixed colors (JSON export only)
  { name: 'primaryFixed', family: 'primary', pairedWith: 'onPrimaryFixed', description: 'Fixed primary (cross-theme)', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'onPrimaryFixed', family: 'primary', pairedWith: 'primaryFixed', description: 'On fixed primary', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'primaryFixedDim', family: 'primary', pairedWith: 'onPrimaryFixed', description: 'Dimmed fixed primary', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'onPrimaryFixedVariant', family: 'primary', pairedWith: 'primaryFixedDim', description: 'On fixed primary variant', defaultPalette: 'primary', inKotlinColorScheme: false },
  { name: 'secondaryFixed', family: 'secondary', pairedWith: 'onSecondaryFixed', description: 'Fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'onSecondaryFixed', family: 'secondary', pairedWith: 'secondaryFixed', description: 'On fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'secondaryFixedDim', family: 'secondary', pairedWith: 'onSecondaryFixed', description: 'Dimmed fixed secondary', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'onSecondaryFixedVariant', family: 'secondary', pairedWith: 'secondaryFixedDim', description: 'On fixed secondary variant', defaultPalette: 'secondary', inKotlinColorScheme: false },
  { name: 'tertiaryFixed', family: 'tertiary', pairedWith: 'onTertiaryFixed', description: 'Fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'onTertiaryFixed', family: 'tertiary', pairedWith: 'tertiaryFixed', description: 'On fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'tertiaryFixedDim', family: 'tertiary', pairedWith: 'onTertiaryFixed', description: 'Dimmed fixed tertiary', defaultPalette: 'tertiary', inKotlinColorScheme: false },
  { name: 'onTertiaryFixedVariant', family: 'tertiary', pairedWith: 'tertiaryFixedDim', description: 'On fixed tertiary variant', defaultPalette: 'tertiary', inKotlinColorScheme: false },
]

export const KOTLIN_COLOR_SCHEME_ROLES: M3RoleName[] = M3_ROLES
  .filter(r => r.inKotlinColorScheme)
  .map(r => r.name)

export const ALL_M3_ROLES: M3RoleName[] = M3_ROLES.map(r => r.name)

export const M3_ROLE_FAMILIES = ['primary', 'secondary', 'tertiary', 'error', 'surface', 'other'] as const

export function getRolesByFamily(family: M3RoleFamily): M3RoleInfo[] {
  return M3_ROLES.filter(r => r.family === family)
}
