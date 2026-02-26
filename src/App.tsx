import { useMemo } from 'react'
import { useThemeMapping } from './hooks/useThemeMapping'
import { resolveAllRoles } from './lib/palette'
import { PaletteEditor } from './components/PaletteEditor'
import { MappingTable } from './components/MappingTable'
import { ThemePreview } from './components/ThemePreview'
import { ExportPanel } from './components/ExportPanel'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

function App() {
  const { state, dispatch } = useThemeMapping()

  const lightResolved = useMemo(
    () => resolveAllRoles(
      state.paletteConfig,
      state.activeContrastLevel === 'standard'
        ? state.themeMapping.light
        : state.activeContrastLevel === 'medium'
          ? state.themeMapping.mediumContrast.light
          : state.themeMapping.highContrast.light,
    ),
    [state],
  )

  const darkResolved = useMemo(
    () => resolveAllRoles(
      state.paletteConfig,
      state.activeContrastLevel === 'standard'
        ? state.themeMapping.dark
        : state.activeContrastLevel === 'medium'
          ? state.themeMapping.mediumContrast.dark
          : state.themeMapping.highContrast.dark,
    ),
    [state],
  )

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-background border-b border-border px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Palette Bridge</h1>
            <p className="text-sm text-muted-foreground">Map Tailwind palettes to Material Design 3 color roles</p>
          </div>
          <ToggleGroup
            type="single"
            value={state.activeThemeMode}
            onValueChange={(value) => {
              if (value) dispatch({ type: 'SET_THEME_MODE', payload: value as 'light' | 'dark' })
            }}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <PaletteEditor paletteConfig={state.paletteConfig} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <MappingTable state={state} dispatch={dispatch} />
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <ThemePreview resolvedColors={lightResolved} themeMode="light" />
            <ThemePreview resolvedColors={darkResolved} themeMode="dark" />
          </div>
        </div>

        <ExportPanel state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}

export default App
