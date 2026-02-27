import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ThemePreviewProps {
  resolvedColors: Record<string, string>
  themeMode: 'light' | 'dark'
}

export function ThemePreview({ resolvedColors, themeMode }: ThemePreviewProps) {
  const c = resolvedColors
  const label = themeMode === 'light' ? 'Light' : 'Dark'

  return (
    <Card
      className="overflow-hidden"
      style={{
        backgroundColor: c.background || c.surface || '#ffffff',
        color: c.onBackground || c.onSurface || '#000000',
        borderColor: c.outlineVariant,
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold opacity-60">{label} Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: c.primary, color: c.onPrimary }}
          >
            Filled
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium border"
            style={{ borderColor: c.outline, color: c.primary }}
          >
            Outlined
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}
          >
            Tonal
          </button>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ color: c.primary }}
          >
            Text
          </button>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-4 space-y-2"
          style={{
            backgroundColor: c.surfaceContainerLow || c.surface,
            borderColor: c.outlineVariant,
          }}
        >
          <div className="text-base font-semibold" style={{ color: c.onSurface }}>
            Card Title
          </div>
          <div className="text-sm" style={{ color: c.onSurfaceVariant }}>
            Subtitle text using onSurfaceVariant
          </div>
          <div className="text-sm" style={{ color: c.onSurface }}>
            Body text sits on the surface container.
          </div>
          <div className="flex gap-2 pt-1">
            <button
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: c.primary, color: c.onPrimary }}
            >
              Action
            </button>
            <button
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ color: c.primary }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* FAB */}
        <div className="flex gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
            style={{ backgroundColor: c.primaryContainer, color: c.onPrimaryContainer }}
          >
            +
          </div>
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
            style={{ backgroundColor: c.tertiaryContainer, color: c.onTertiaryContainer }}
          >
            ★
          </div>
        </div>

        {/* Surface hierarchy */}
        <div className="space-y-1">
          <div className="text-xs font-semibold opacity-50 mb-1">Surfaces</div>
          {[
            { name: 'Lowest', bg: c.surfaceContainerLowest },
            { name: 'Low', bg: c.surfaceContainerLow },
            { name: 'Container', bg: c.surfaceContainer },
            { name: 'High', bg: c.surfaceContainerHigh },
            { name: 'Highest', bg: c.surfaceContainerHighest },
          ].map(s => (
            <div
              key={s.name}
              className="px-3 py-1.5 rounded-lg text-xs flex justify-between items-center"
              style={{ backgroundColor: s.bg, color: c.onSurface }}
            >
              <span>{s.name}</span>
              <span className="font-mono opacity-50">{s.bg}</span>
            </div>
          ))}
        </div>

        {/* Error state */}
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: c.errorContainer, color: c.onErrorContainer }}
        >
          Error: Something went wrong. This uses errorContainer.
        </div>

        {/* Chips */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="px-3 py-1 rounded-full text-xs border"
            style={{ borderColor: c.outline, color: c.onSurfaceVariant }}
          >
            Outlined Chip
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}
          >
            Filled Chip
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
