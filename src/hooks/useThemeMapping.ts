import { useReducer, useEffect, useCallback } from 'react'
import type { AppState, AppAction, PaletteConfig, ContrastLevel, M3RoleName, ShadeRef } from '../types'
import { buildDefaultMapping } from '../data/default-mapping'
import { SAMPLE_PALETTE_CONFIG } from '../data/sample-palette'

const STORAGE_KEY = 'palette-bridge-state'

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function createInitialState(paletteConfig: PaletteConfig): AppState {
  return {
    paletteConfig,
    themeMapping: buildDefaultMapping(paletteConfig),
    activeContrastLevel: 'standard',
    activeThemeMode: 'light',
    interpolationEnabled: false,
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PALETTE_CONFIG':
      return { ...state, paletteConfig: action.payload }

    case 'SET_ROLE_ASSIGNMENT': {
      const { contrastLevel, themeMode, role, shade } = action
      const newState = structuredClone(state)
      if (contrastLevel === 'standard') {
        newState.themeMapping[themeMode][role] = shade
      } else if (contrastLevel === 'medium') {
        newState.themeMapping.mediumContrast[themeMode][role] = shade
      } else {
        newState.themeMapping.highContrast[themeMode][role] = shade
      }
      return newState
    }

    case 'SET_CONTRAST_LEVEL':
      return { ...state, activeContrastLevel: action.payload }

    case 'SET_THEME_MODE':
      return { ...state, activeThemeMode: action.payload }

    case 'RESET_CONTRAST_TO_DEFAULTS': {
      const newState = structuredClone(state)
      const defaults = buildDefaultMapping(state.paletteConfig)
      if (action.contrastLevel === 'standard') {
        newState.themeMapping.light = defaults.light
        newState.themeMapping.dark = defaults.dark
      } else if (action.contrastLevel === 'medium') {
        newState.themeMapping.mediumContrast = defaults.mediumContrast
      } else {
        newState.themeMapping.highContrast = defaults.highContrast
      }
      return newState
    }

    case 'TOGGLE_INTERPOLATION':
      return { ...state, interpolationEnabled: !state.interpolationEnabled }

    case 'LOAD_STATE':
      return action.payload

    default:
      return state
  }
}

export function useThemeMapping() {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => loadState() ?? createInitialState(SAMPLE_PALETTE_CONFIG),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setRoleAssignment = useCallback((
    contrastLevel: ContrastLevel,
    themeMode: 'light' | 'dark',
    role: M3RoleName,
    shade: ShadeRef,
  ) => {
    dispatch({ type: 'SET_ROLE_ASSIGNMENT', contrastLevel, themeMode, role, shade })
  }, [])

  const getActiveAssignments = useCallback(() => {
    const { activeContrastLevel, activeThemeMode, themeMapping } = state
    if (activeContrastLevel === 'standard') return themeMapping[activeThemeMode]
    if (activeContrastLevel === 'medium') return themeMapping.mediumContrast[activeThemeMode]
    return themeMapping.highContrast[activeThemeMode]
  }, [state])

  return {
    state,
    dispatch,
    setRoleAssignment,
    getActiveAssignments,
  }
}
