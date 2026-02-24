export interface ShadeValue {
  hex: string
  oklch?: string
}

export interface Palette {
  shades: Record<string, ShadeValue>
}

export interface InterpolatedShade {
  hex: string
  oklch: string
  source: { between: [string, string]; position: number }
}

export interface PaletteConfig {
  palettes: Record<string, Palette>
  interpolated: Record<string, Record<string, InterpolatedShade>>
}

export interface ShadeRef {
  palette: string
  shade: string
}

export type M3RoleName =
  | 'primary' | 'onPrimary' | 'primaryContainer' | 'onPrimaryContainer'
  | 'secondary' | 'onSecondary' | 'secondaryContainer' | 'onSecondaryContainer'
  | 'tertiary' | 'onTertiary' | 'tertiaryContainer' | 'onTertiaryContainer'
  | 'error' | 'onError' | 'errorContainer' | 'onErrorContainer'
  | 'surface' | 'onSurface' | 'surfaceVariant' | 'onSurfaceVariant'
  | 'surfaceDim' | 'surfaceBright'
  | 'surfaceContainerLowest' | 'surfaceContainerLow' | 'surfaceContainer'
  | 'surfaceContainerHigh' | 'surfaceContainerHighest'
  | 'inverseSurface' | 'inverseOnSurface' | 'inversePrimary'
  | 'outline' | 'outlineVariant'
  | 'scrim' | 'shadow'
  | 'background' | 'onBackground'
  | 'surfaceTint'
  // Fixed colors (JSON export only, not in Kotlin ColorScheme)
  | 'primaryFixed' | 'onPrimaryFixed' | 'primaryFixedDim' | 'onPrimaryFixedVariant'
  | 'secondaryFixed' | 'onSecondaryFixed' | 'secondaryFixedDim' | 'onSecondaryFixedVariant'
  | 'tertiaryFixed' | 'onTertiaryFixed' | 'tertiaryFixedDim' | 'onTertiaryFixedVariant'

export type RoleAssignments = Record<M3RoleName, ShadeRef>

export type ContrastLevel = 'standard' | 'medium' | 'high'

export interface ThemeMapping {
  light: RoleAssignments
  dark: RoleAssignments
  mediumContrast: { light: RoleAssignments; dark: RoleAssignments }
  highContrast: { light: RoleAssignments; dark: RoleAssignments }
}

export type M3RoleFamily = 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface' | 'other'

export interface M3RoleInfo {
  name: M3RoleName
  family: M3RoleFamily
  pairedWith: M3RoleName | null
  description: string
  defaultPalette: string
  inKotlinColorScheme: boolean
}

export interface AppState {
  paletteConfig: PaletteConfig
  themeMapping: ThemeMapping
  activeContrastLevel: ContrastLevel
  activeThemeMode: 'light' | 'dark'
  interpolationEnabled: boolean
}

export type AppAction =
  | { type: 'SET_PALETTE_CONFIG'; payload: PaletteConfig }
  | { type: 'SET_ROLE_ASSIGNMENT'; contrastLevel: ContrastLevel; themeMode: 'light' | 'dark'; role: M3RoleName; shade: ShadeRef }
  | { type: 'SET_CONTRAST_LEVEL'; payload: ContrastLevel }
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }
  | { type: 'RESET_CONTRAST_TO_DEFAULTS'; contrastLevel: ContrastLevel }
  | { type: 'TOGGLE_INTERPOLATION' }
  | { type: 'LOAD_STATE'; payload: AppState }
