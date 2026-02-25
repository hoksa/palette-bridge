import { useState, useMemo } from 'react'
import type { AppState, AppAction, ContrastLevel, M3RoleName, RoleAssignments } from '../types'
import { M3_ROLE_FAMILIES, getRolesByFamily } from '../data/m3-roles'
import { resolveShadeRef } from '../lib/palette'
import { contrastRatio } from '../lib/contrast'
import { ContrastBadge } from './ContrastBadge'
import { ShadeSelector } from './ShadeSelector'

interface MappingTableProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

function getAssignments(state: AppState, contrastLevel: ContrastLevel, themeMode: 'light' | 'dark'): RoleAssignments {
  if (contrastLevel === 'standard') return state.themeMapping[themeMode]
  if (contrastLevel === 'medium') return state.themeMapping.mediumContrast[themeMode]
  return state.themeMapping.highContrast[themeMode]
}

function textColor(hex: string): string {
  const ratio = contrastRatio(hex, '#ffffff')
  return ratio >= 4.5 ? '#ffffff' : '#000000'
}

const CONTRAST_TABS: { label: string; value: ContrastLevel }[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

export function MappingTable({ state, dispatch }: MappingTableProps) {
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set())
  const [openSelector, setOpenSelector] = useState<{ role: M3RoleName; themeMode: 'light' | 'dark' } | null>(null)

  const { activeContrastLevel, activeThemeMode, paletteConfig } = state

  const lightAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'light'),
    [state, activeContrastLevel],
  )
  const darkAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'dark'),
    [state, activeContrastLevel],
  )

  function toggleFamily(family: string) {
    setCollapsedFamilies(prev => {
      const next = new Set(prev)
      if (next.has(family)) next.delete(family)
      else next.add(family)
      return next
    })
  }

  function handleShadeSelect(role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) {
    dispatch({
      type: 'SET_ROLE_ASSIGNMENT',
      contrastLevel: activeContrastLevel,
      themeMode,
      role,
      shade: { palette, shade },
    })
  }

  return (
    <div className="space-y-3">
      {/* Contrast level tabs */}
      <div className="flex gap-1">
        {CONTRAST_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => dispatch({ type: 'SET_CONTRAST_LEVEL', payload: tab.value })}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeContrastLevel === tab.value
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => dispatch({ type: 'RESET_CONTRAST_TO_DEFAULTS', contrastLevel: activeContrastLevel })}
          className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          Reset to defaults
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-medium text-gray-600 w-48">Role</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-28">Light</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-28">Dark</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-24">Light CR</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-24">Dark CR</th>
            </tr>
          </thead>
          <tbody>
            {M3_ROLE_FAMILIES.map(family => {
              const roles = getRolesByFamily(family)
              const isCollapsed = collapsedFamilies.has(family)
              return (
                <FamilySection
                  key={family}
                  family={family}
                  roles={roles}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleFamily(family)}
                  lightAssignments={lightAssignments}
                  darkAssignments={darkAssignments}
                  paletteConfig={paletteConfig}
                  openSelector={openSelector}
                  onOpenSelector={setOpenSelector}
                  onShadeSelect={handleShadeSelect}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface FamilySectionProps {
  family: string
  roles: ReturnType<typeof getRolesByFamily>
  isCollapsed: boolean
  onToggle: () => void
  lightAssignments: RoleAssignments
  darkAssignments: RoleAssignments
  paletteConfig: AppState['paletteConfig']
  openSelector: { role: M3RoleName; themeMode: 'light' | 'dark' } | null
  onOpenSelector: (v: { role: M3RoleName; themeMode: 'light' | 'dark' } | null) => void
  onShadeSelect: (role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) => void
}

function FamilySection({
  family, roles, isCollapsed, onToggle,
  lightAssignments, darkAssignments, paletteConfig,
  openSelector, onOpenSelector, onShadeSelect,
}: FamilySectionProps) {
  return (
    <>
      <tr
        className="bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 border-t border-gray-100"
        onClick={onToggle}
      >
        <td colSpan={5} className="px-3 py-1.5 font-semibold text-gray-500 capitalize text-xs tracking-wide">
          <span className="mr-1">{isCollapsed ? '▶' : '▼'}</span>
          {family} ({roles.length})
        </td>
      </tr>
      {!isCollapsed && roles.map(role => {
        const lightRef = lightAssignments[role.name]
        const darkRef = darkAssignments[role.name]
        const lightHex = lightRef ? resolveShadeRef(paletteConfig, lightRef) : null
        const darkHex = darkRef ? resolveShadeRef(paletteConfig, darkRef) : null

        // Find paired role for contrast calculation
        let lightContrastPair: string | null = null
        let darkContrastPair: string | null = null
        if (role.pairedWith) {
          const pairedLightRef = lightAssignments[role.pairedWith]
          const pairedDarkRef = darkAssignments[role.pairedWith]
          if (pairedLightRef) lightContrastPair = resolveShadeRef(paletteConfig, pairedLightRef)
          if (pairedDarkRef) darkContrastPair = resolveShadeRef(paletteConfig, pairedDarkRef)
        }

        return (
          <tr key={role.name} className="border-t border-gray-50 hover:bg-gray-50/30">
            <td className="px-3 py-1.5">
              <div className="font-mono text-xs">{role.name}</div>
              <div className="text-[10px] text-gray-400">{role.description}</div>
            </td>
            <td className="px-3 py-1.5">
              <SwatchCell
                hex={lightHex}
                ref_={lightRef}
                isOpen={openSelector?.role === role.name && openSelector?.themeMode === 'light'}
                onOpen={() => onOpenSelector({ role: role.name, themeMode: 'light' })}
                onClose={() => onOpenSelector(null)}
                paletteConfig={paletteConfig}
                onSelect={(p, s) => onShadeSelect(role.name, 'light', p, s)}
              />
            </td>
            <td className="px-3 py-1.5">
              <SwatchCell
                hex={darkHex}
                ref_={darkRef}
                isOpen={openSelector?.role === role.name && openSelector?.themeMode === 'dark'}
                onOpen={() => onOpenSelector({ role: role.name, themeMode: 'dark' })}
                onClose={() => onOpenSelector(null)}
                paletteConfig={paletteConfig}
                onSelect={(p, s) => onShadeSelect(role.name, 'dark', p, s)}
              />
            </td>
            <td className="px-3 py-1.5 text-center">
              {lightHex && lightContrastPair && (
                <ContrastBadge fgHex={lightHex} bgHex={lightContrastPair} />
              )}
            </td>
            <td className="px-3 py-1.5 text-center">
              {darkHex && darkContrastPair && (
                <ContrastBadge fgHex={darkHex} bgHex={darkContrastPair} />
              )}
            </td>
          </tr>
        )
      })}
    </>
  )
}

interface SwatchCellProps {
  hex: string | null
  ref_: { palette: string; shade: string } | undefined
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  paletteConfig: AppState['paletteConfig']
  onSelect: (palette: string, shade: string) => void
}

function SwatchCell({ hex, ref_, isOpen, onOpen, onClose, paletteConfig, onSelect }: SwatchCellProps) {
  if (!hex || !ref_) return <span className="text-gray-300 text-xs">-</span>

  return (
    <div className="relative flex justify-center">
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-gray-200 hover:border-gray-400 transition-colors"
      >
        <div
          className="w-5 h-5 rounded-sm border border-black/10"
          style={{ backgroundColor: hex }}
        />
        <span className="text-[10px] font-mono text-gray-600">
          {ref_.shade}
        </span>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1">
          <ShadeSelector
            paletteConfig={paletteConfig}
            currentPalette={ref_.palette}
            currentShade={ref_.shade}
            onSelect={onSelect}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  )
}
