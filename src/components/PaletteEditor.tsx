import type { PaletteConfig } from '../types'
import { textColor } from '../lib/contrast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PaletteEditorProps {
  paletteConfig: PaletteConfig
}

const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const
const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

export function PaletteEditor({ paletteConfig }: PaletteEditorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-700">Palette Swatches</h2>
      {PALETTE_ORDER.map(name => {
        const palette = paletteConfig.palettes[name]
        if (!palette) return null
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="w-20 text-sm font-medium text-gray-600 capitalize shrink-0">
              {name}
            </span>
            <div className="flex gap-0.5 flex-1 min-w-0">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                return (
                  <Tooltip key={shade}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex-1 min-w-0 h-10 rounded flex flex-col items-center justify-center text-[9px] leading-tight font-mono cursor-default"
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
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
