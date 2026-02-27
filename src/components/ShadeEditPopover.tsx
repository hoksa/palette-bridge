import { useState, useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface ShadeEditPopoverProps {
  hex: string
  onSave: (hex: string) => void
  children: React.ReactNode
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ShadeEditPopover({ hex, onSave, children }: ShadeEditPopoverProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(hex)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setValue(hex)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }

  function commit() {
    const normalized = value.startsWith('#') ? value : `#${value}`
    if (HEX_RE.test(normalized)) {
      onSave(normalized.toLowerCase())
      setOpen(false)
    } else {
      setValue(hex)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="center" side="bottom">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setOpen(false)
          }}
          onBlur={commit}
          className="h-8 text-xs font-mono"
          spellCheck={false}
        />
      </PopoverContent>
    </Popover>
  )
}
