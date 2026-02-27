import { useMemo, useState } from 'react'
import type { AppState, AppAction, ContrastLevel, M3RoleName, RoleAssignments } from '../types'
import { M3_ROLE_FAMILIES, getRolesByFamily } from '../data/m3-roles'
import { resolveShadeRef } from '../lib/palette'
import { ContrastBadge } from './ContrastBadge'
import { ShadeSelector } from './ShadeSelector'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MappingTableProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

function getAssignments(state: AppState, contrastLevel: ContrastLevel, themeMode: 'light' | 'dark'): RoleAssignments {
  if (contrastLevel === 'standard') return state.themeMapping[themeMode]
  if (contrastLevel === 'medium') return state.themeMapping.mediumContrast[themeMode]
  return state.themeMapping.highContrast[themeMode]
}

export function MappingTable({ state, dispatch }: MappingTableProps) {
  const { activeContrastLevel, paletteConfig } = state

  const lightAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'light'),
    [state, activeContrastLevel],
  )
  const darkAssignments = useMemo(
    () => getAssignments(state, activeContrastLevel, 'dark'),
    [state, activeContrastLevel],
  )

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
      <Tabs
        value={activeContrastLevel}
        onValueChange={(value) => dispatch({ type: 'SET_CONTRAST_LEVEL', payload: value as ContrastLevel })}
      >
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
          </TabsList>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'RESET_CONTRAST_TO_DEFAULTS', contrastLevel: activeContrastLevel })}
          >
            Reset to defaults
          </Button>
        </div>
      </Tabs>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Role</TableHead>
              <TableHead className="w-28 text-center">Light</TableHead>
              <TableHead className="w-28 text-center">Dark</TableHead>
              <TableHead className="w-24 text-center">Light CR</TableHead>
              <TableHead className="w-24 text-center">Dark CR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {M3_ROLE_FAMILIES.map(family => {
              const roles = getRolesByFamily(family)
              return (
                <FamilySection
                  key={family}
                  family={family}
                  roles={roles}
                  lightAssignments={lightAssignments}
                  darkAssignments={darkAssignments}
                  paletteConfig={paletteConfig}
                  onShadeSelect={handleShadeSelect}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface FamilySectionProps {
  family: string
  roles: ReturnType<typeof getRolesByFamily>
  lightAssignments: RoleAssignments
  darkAssignments: RoleAssignments
  paletteConfig: AppState['paletteConfig']
  onShadeSelect: (role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) => void
}

function FamilySection({
  family, roles,
  lightAssignments, darkAssignments, paletteConfig,
  onShadeSelect,
}: FamilySectionProps) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/80">
        <TableCell colSpan={5} className="py-1.5 font-semibold text-muted-foreground capitalize text-xs tracking-wide">
          {family} ({roles.length})
        </TableCell>
      </TableRow>
      {roles.map(role => (
        <RoleRow
          key={role.name}
          role={role}
          lightAssignments={lightAssignments}
          darkAssignments={darkAssignments}
          paletteConfig={paletteConfig}
          onShadeSelect={onShadeSelect}
        />
      ))}
    </>
  )
}

interface RoleRowProps {
  role: ReturnType<typeof getRolesByFamily>[number]
  lightAssignments: RoleAssignments
  darkAssignments: RoleAssignments
  paletteConfig: AppState['paletteConfig']
  onShadeSelect: (role: M3RoleName, themeMode: 'light' | 'dark', palette: string, shade: string) => void
}

function RoleRow({ role, lightAssignments, darkAssignments, paletteConfig, onShadeSelect }: RoleRowProps) {
  const lightRef = lightAssignments[role.name]
  const darkRef = darkAssignments[role.name]
  const lightHex = lightRef ? resolveShadeRef(paletteConfig, lightRef) : null
  const darkHex = darkRef ? resolveShadeRef(paletteConfig, darkRef) : null

  let lightContrastPair: string | null = null
  let darkContrastPair: string | null = null
  if (role.pairedWith) {
    const pairedLightRef = lightAssignments[role.pairedWith]
    const pairedDarkRef = darkAssignments[role.pairedWith]
    if (pairedLightRef) lightContrastPair = resolveShadeRef(paletteConfig, pairedLightRef)
    if (pairedDarkRef) darkContrastPair = resolveShadeRef(paletteConfig, pairedDarkRef)
  }

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="py-1.5">
        <div className="font-mono text-xs">{role.name}</div>
        <div className="text-[10px] text-muted-foreground">{role.description}</div>
      </TableCell>
      <TableCell className="py-1.5">
        <SwatchCell
          hex={lightHex}
          ref_={lightRef}
          paletteConfig={paletteConfig}
          onSelect={(p, s) => onShadeSelect(role.name, 'light', p, s)}
        />
      </TableCell>
      <TableCell className="py-1.5">
        <SwatchCell
          hex={darkHex}
          ref_={darkRef}
          paletteConfig={paletteConfig}
          onSelect={(p, s) => onShadeSelect(role.name, 'dark', p, s)}
        />
      </TableCell>
      <TableCell className="py-1.5 text-center">
        {lightHex && lightContrastPair && (
          <ContrastBadge fgHex={lightHex} bgHex={lightContrastPair} />
        )}
      </TableCell>
      <TableCell className="py-1.5 text-center">
        {darkHex && darkContrastPair && (
          <ContrastBadge fgHex={darkHex} bgHex={darkContrastPair} />
        )}
      </TableCell>
    </TableRow>
  )
}

interface SwatchCellProps {
  hex: string | null
  ref_: { palette: string; shade: string } | undefined
  paletteConfig: AppState['paletteConfig']
  onSelect: (palette: string, shade: string) => void
}

function SwatchCell({ hex, ref_, paletteConfig, onSelect }: SwatchCellProps) {
  const [open, setOpen] = useState(false)

  if (!hex || !ref_) return <span className="text-muted-foreground text-xs">-</span>

  return (
    <div className="flex justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-auto px-1.5 py-0.5 gap-1.5"
          >
            <div
              className="w-5 h-5 rounded-sm border border-border"
              style={{ backgroundColor: hex }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {ref_.shade}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <ShadeSelector
            paletteConfig={paletteConfig}
            currentPalette={ref_.palette}
            currentShade={ref_.shade}
            onSelect={(p, s) => {
              onSelect(p, s)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
