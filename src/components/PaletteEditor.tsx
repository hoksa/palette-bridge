import type { AppAction, PaletteConfig } from '../types'
import { textColor } from '../lib/contrast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ShadeEditPopover } from './ShadeEditPopover'
import { PalettePastePopover } from './PalettePastePopover'
import { Button } from '@/components/ui/button'

interface PaletteEditorProps {
  paletteConfig: PaletteConfig
  dispatch: React.Dispatch<AppAction>
}

const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const
const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

export function PaletteEditor({ paletteConfig, dispatch }: PaletteEditorProps) {
  function updateShade(paletteName: string, shade: string, hex: string) {
    const newConfig = structuredClone(paletteConfig)
    newConfig.palettes[paletteName].shades[shade] = { hex }
    dispatch({ type: 'SET_PALETTE_CONFIG', payload: newConfig })
  }

  function applyPaste(paletteName: string, shades: Record<string, string>) {
    const newConfig = structuredClone(paletteConfig)
    for (const [shade, hex] of Object.entries(shades)) {
      newConfig.palettes[paletteName].shades[shade] = { hex }
    }
    dispatch({ type: 'SET_PALETTE_CONFIG', payload: newConfig })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Palette Swatches</h2>
      {PALETTE_ORDER.map(name => {
        const palette = paletteConfig.palettes[name]
        if (!palette) return null
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="w-20 text-sm font-medium text-muted-foreground capitalize shrink-0">
              {name}
            </span>
            <div className="flex gap-0.5 flex-1 min-w-0">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                return (
                  <ShadeEditPopover
                    key={shade}
                    hex={sv.hex}
                    onSave={(newHex) => updateShade(name, shade, newHex)}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex-1 min-w-0 h-10 rounded-sm flex flex-col items-center justify-center text-[9px] leading-tight font-mono cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1"
                          style={{ backgroundColor: sv.hex, color: textColor(sv.hex) }}
                        >
                          <span className="font-semibold">{shade}</span>
                          <span className="opacity-75 hidden sm:inline">{sv.hex}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{name}-{shade}: {sv.hex}</p>
                      </TooltipContent>
                    </Tooltip>
                  </ShadeEditPopover>
                )
              })}
            </div>
            <PalettePastePopover onApply={(shades) => applyPaste(name, shades)}>
              <Button variant="ghost" size="sm" className="h-10 px-2 shrink-0 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
              </Button>
            </PalettePastePopover>
          </div>
        )
      })}
    </div>
  )
}
