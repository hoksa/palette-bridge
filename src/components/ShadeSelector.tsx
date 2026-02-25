import { useRef, useEffect } from 'react'
import type { PaletteConfig } from '../types'
import { contrastRatio } from '../lib/contrast'

interface ShadeSelectorProps {
  paletteConfig: PaletteConfig
  currentPalette: string
  currentShade: string
  onSelect: (palette: string, shade: string) => void
  onClose: () => void
}

const SHADE_ORDER = ['white', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', 'black']
const PALETTE_ORDER = ['primary', 'secondary', 'tertiary', 'error', 'neutral'] as const

function textColor(hex: string): string {
  const ratio = contrastRatio(hex, '#ffffff')
  return ratio >= 4.5 ? '#ffffff' : '#000000'
}

export function ShadeSelector({ paletteConfig, currentPalette, currentShade, onSelect, onClose }: ShadeSelectorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[280px]"
    >
      <div className="text-xs font-semibold text-gray-500 mb-2">Select shade</div>
      {PALETTE_ORDER.map(paletteName => {
        const palette = paletteConfig.palettes[paletteName]
        if (!palette) return null
        return (
          <div key={paletteName} className="mb-2">
            <div className="text-[10px] font-medium text-gray-400 capitalize mb-0.5">{paletteName}</div>
            <div className="flex gap-0.5 flex-wrap">
              {SHADE_ORDER.map(shade => {
                const sv = palette.shades[shade]
                if (!sv) return null
                const isSelected = paletteName === currentPalette && shade === currentShade
                return (
                  <button
                    key={shade}
                    onClick={() => { onSelect(paletteName, shade); onClose() }}
                    className={`w-7 h-7 rounded text-[8px] font-mono flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: sv.hex, color: textColor(sv.hex) }}
                    title={`${paletteName}-${shade}: ${sv.hex}`}
                  >
                    {shade === 'white' ? 'W' : shade === 'black' ? 'B' : shade}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
