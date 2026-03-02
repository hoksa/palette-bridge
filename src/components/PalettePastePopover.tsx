import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { parsePaletteInput } from '../lib/parse-palette-input'

interface PalettePastePopoverProps {
  onApply: (shades: Record<string, string>) => void
  children: React.ReactNode
}

export function PalettePastePopover({ onApply, children }: PalettePastePopoverProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function handleApply() {
    const parsed = parsePaletteInput(text)
    if (Object.keys(parsed).length > 0) {
      onApply(parsed)
      setText('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" side="bottom">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Paste hex values, CSS variables, or OKLCH colors
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"50: #eff6ff\n100: #dbeafe\n..."}
            className="w-full h-32 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            spellCheck={false}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleApply}
            disabled={text.trim().length === 0}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
