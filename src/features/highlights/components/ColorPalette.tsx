import { HIGHLIGHT_COLORS, type HighlightColor } from '../utils/highlightColors'

interface ColorPaletteProps {
  selectedColor: string
  onColorSelect: (colorId: string) => void
}

/**
 * Color palette selector for highlights
 */
export function ColorPalette ({ selectedColor, onColorSelect }: ColorPaletteProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">Color:</span>
      <div className="flex gap-1">
        {HIGHLIGHT_COLORS.map((color: HighlightColor) => (
          <button
            key={color.id}
            onClick={() => { onColorSelect(color.id) }}
            className={`w-8 h-8 rounded border-2 transition-all ${color.bgClass} ${
              selectedColor === color.id
                ? 'border-primary scale-110'
                : 'border-border hover:scale-105'
            }`}
            title={`${color.name} - ${color.label}`}
            aria-label={`Select ${color.name} highlight color`}
          />
        ))}
      </div>
    </div>
  )
}
