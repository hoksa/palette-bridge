import { contrastRatio, meetsWCAG } from '../lib/contrast'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ContrastBadgeProps {
  fgHex: string
  bgHex: string
}

const LEVEL_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'AAA': 'default',
  'AA': 'secondary',
  'AA-large': 'outline',
  'fail': 'destructive',
}

export function ContrastBadge({ fgHex, bgHex }: ContrastBadgeProps) {
  const ratio = contrastRatio(fgHex, bgHex)
  const level = meetsWCAG(ratio)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={LEVEL_VARIANTS[level]} className="font-mono text-[10px] gap-1 cursor-default">
          <span className="font-semibold">{ratio.toFixed(1)}:1</span>
          <span className="opacity-75">{level}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fgHex} on {bgHex}</p>
      </TooltipContent>
    </Tooltip>
  )
}
