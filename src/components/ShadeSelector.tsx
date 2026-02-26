import type { PaletteConfig } from '../types'
import { textColor } from '../lib/contrast'
import { Button } from '@/components/ui/button'

interface ShadeSelectorProps {
  paletteConfig: PaletteConfig
  currentPalette: string
  currentShade: string
  onSelect: (palette: string, shade: string) => void
}

const SHADE_ORDER = ['white', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', 'black']
const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const

export function ShadeSelector({ paletteConfig, currentPalette, currentShade, onSelect }: ShadeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Select shade</div>
      {PALETTE_ORDER.map(paletteName => {
        const palette = paletteConfig.palettes[paletteName]
        if (!palette) return null
        return (
          <div key={paletteName}>
            <div className="text-[10px] font-medium text-muted-foreground capitalize mb-0.5">{paletteName}</div>
            <div className="flex gap-0.5 flex-wrap">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                const isSelected = paletteName === currentPalette && shade === currentShade
                return (
                  <Button
                    key={shade}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(paletteName, shade)}
                    className={`w-7 h-7 p-0 text-[8px] font-mono ${
                      isSelected ? 'ring-2 ring-ring ring-offset-1 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: sv.hex, color: textColor(sv.hex) }}
                    aria-label={`${paletteName} ${shade}: ${sv.hex}`}
                    aria-pressed={isSelected}
                  >
                    {shade === 'white' ? 'W' : shade === 'black' ? 'B' : shade}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
