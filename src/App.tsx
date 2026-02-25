import { useMemo, useEffect } from 'react'
import { useThemeMapping } from './hooks/useThemeMapping'
import { resolveAllRoles } from './lib/palette'
import { PaletteEditor } from './components/PaletteEditor'
import { MappingTable } from './components/MappingTable'
import { ThemePreview } from './components/ThemePreview'
import { ExportPanel } from './components/ExportPanel'

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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case '1': dispatch({ type: 'SET_CONTRAST_LEVEL', payload: 'standard' }); break
        case '2': dispatch({ type: 'SET_CONTRAST_LEVEL', payload: 'medium' }); break
        case '3': dispatch({ type: 'SET_CONTRAST_LEVEL', payload: 'high' }); break
        case 'l': case 'L': dispatch({ type: 'SET_THEME_MODE', payload: 'light' }); break
        case 'd': case 'D': dispatch({ type: 'SET_THEME_MODE', payload: 'dark' }); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Palette Bridge</h1>
            <p className="text-sm text-gray-500">Map Tailwind palettes to Material Design 3 color roles</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_THEME_MODE', payload: 'light' })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                state.activeThemeMode === 'light' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_THEME_MODE', payload: 'dark' })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                state.activeThemeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Palette strips */}
        <PaletteEditor paletteConfig={state.paletteConfig} />

        {/* Main content: mapping table + preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <MappingTable state={state} dispatch={dispatch} />
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <ThemePreview resolvedColors={lightResolved} themeMode="light" />
            <ThemePreview resolvedColors={darkResolved} themeMode="dark" />
          </div>
        </div>

        {/* Export panel */}
        <ExportPanel state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}

export default App
