import { useState, useRef } from 'react'
import type { AppState, AppAction } from '../types'
import { generateColorKt, generateThemeKt } from '../lib/export-kotlin'
import { generateMaterialJson } from '../lib/export-material-json'
import { generateStyleframeJson } from '../lib/export-styleframe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  function exportStyleframe() {
    const json = generateStyleframeJson(paletteConfig, themeMapping)
    download('styleframe-tokens.json', json, 'application/json')
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
    <div className="border border-border rounded-lg bg-background p-4 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Export</h2>

      <div className="flex items-center gap-2">
        <Label htmlFor="kotlin-package" className="text-sm text-muted-foreground shrink-0">
          Kotlin package:
        </Label>
        <Input
          id="kotlin-package"
          type="text"
          value={packageName}
          onChange={e => setPackageName(e.target.value)}
          className="flex-1 font-mono"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ExportButton label="Kotlin" description="Color.kt + Theme.kt" onClick={exportKotlin} />
        <ExportButton label="Material JSON" description="material-theme.json" onClick={exportMaterialJson} />
        <ExportButton label="Styleframe" description="DTCG tokens for Figma" onClick={exportStyleframe} />
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
    <Button
      variant={variant === 'primary' ? 'outline' : 'secondary'}
      onClick={onClick}
      className="h-auto px-3 py-2 text-left flex flex-col items-start"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] opacity-60">{description}</span>
    </Button>
  )
}
