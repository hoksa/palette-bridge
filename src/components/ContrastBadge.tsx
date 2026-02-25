import { contrastRatio, meetsWCAG } from '../lib/contrast'

interface ContrastBadgeProps {
  fgHex: string
  bgHex: string
}

const LEVEL_STYLES: Record<string, string> = {
  'AAA': 'bg-green-100 text-green-800 border-green-300',
  'AA': 'bg-green-50 text-green-700 border-green-200',
  'AA-large': 'bg-yellow-50 text-yellow-700 border-yellow-300',
  'fail': 'bg-red-50 text-red-700 border-red-300',
}

export function ContrastBadge({ fgHex, bgHex }: ContrastBadgeProps) {
  const ratio = contrastRatio(fgHex, bgHex)
  const level = meetsWCAG(ratio)

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${LEVEL_STYLES[level]}`}
      title={`${fgHex} on ${bgHex}`}
    >
      <span className="font-semibold">{ratio.toFixed(1)}:1</span>
      <span className="opacity-75">{level}</span>
    </span>
  )
}
