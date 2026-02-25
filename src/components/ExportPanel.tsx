import { useState, useRef } from 'react'
import type { AppState, AppAction } from '../types'
import { generateColorKt, generateThemeKt } from '../lib/export-kotlin'
import { generateMaterialJson } from '../lib/export-material-json'
import { generateTokensStudio } from '../lib/export-tokens-studio'
import { generateCss } from '../lib/export-css'

interface ExportPanelProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

function download(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportPanel({ state, dispatch }: ExportPanelProps) {
  const [packageName, setPackageName] = useState('com.example.ui.theme')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { paletteConfig, themeMapping } = state

  function exportKotlin() {
    const colorKt = generateColorKt(paletteConfig, themeMapping, packageName)
    const themeKt = generateThemeKt(packageName)
    download('Color.kt', colorKt)
    setTimeout(() => download('Theme.kt', themeKt), 100)
  }

  function exportMaterialJson() {
    const json = generateMaterialJson(paletteConfig, themeMapping)
    download('material-theme.json', json, 'application/json')
  }

  function exportTokensStudio() {
    const tokens = generateTokensStudio(paletteConfig, themeMapping)
    download('core.json', tokens.core, 'application/json')
    setTimeout(() => download('light.json', tokens.light, 'application/json'), 100)
    setTimeout(() => download('dark.json', tokens.dark, 'application/json'), 200)
  }

  function exportCss() {
    const css = generateCss(paletteConfig, themeMapping)
    download('theme.css', css, 'text/css')
  }

  function exportMapping() {
    const json = JSON.stringify(state, null, 2)
    download('palette-bridge-mapping.json', json, 'application/json')
  }

  function importMapping() {
    fileInputRef.current?.click()
  }

  function isValidAppState(value: unknown): value is AppState {
    if (typeof value !== 'object' || value === null) return false
    const obj = value as Record<string, unknown>
    if (typeof obj.paletteConfig !== 'object' || obj.paletteConfig === null) return false
    if (typeof obj.themeMapping !== 'object' || obj.themeMapping === null) return false
    if (!['standard', 'medium', 'high'].includes(obj.activeContrastLevel as string)) return false
    if (!['light', 'dark'].includes(obj.activeThemeMode as string)) return false
    if (typeof obj.interpolationEnabled !== 'boolean') return false
    const mapping = obj.themeMapping as Record<string, unknown>
    if (typeof mapping.light !== 'object' || typeof mapping.dark !== 'object') return false
    if (typeof mapping.mediumContrast !== 'object' || typeof mapping.highContrast !== 'object') return false
    return true
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        if (!isValidAppState(parsed)) {
          alert('Invalid mapping file: missing or malformed fields')
          return
        }
        dispatch({ type: 'LOAD_STATE', payload: parsed })
      } catch {
        alert('Invalid mapping file: not valid JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Export</h2>

      {/* Kotlin package name */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 shrink-0">Kotlin package:</label>
        <input
          type="text"
          value={packageName}
          onChange={e => setPackageName(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <ExportButton label="Kotlin" description="Color.kt + Theme.kt" onClick={exportKotlin} />
        <ExportButton label="Material JSON" description="material-theme.json" onClick={exportMaterialJson} />
        <ExportButton label="Tokens Studio" description="core + light + dark JSON" onClick={exportTokensStudio} />
        <ExportButton label="CSS" description="Custom properties" onClick={exportCss} />
        <ExportButton label="Mapping" description="Save current state" onClick={exportMapping} />
        <ExportButton label="Import" description="Load mapping file" onClick={importMapping} variant="secondary" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  )
}

function ExportButton({ label, description, onClick, variant = 'primary' }: {
  label: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-left transition-colors ${
        variant === 'primary'
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[10px] opacity-60">{description}</div>
    </button>
  )
}
