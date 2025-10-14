import { getHighlightColorsForTheme, type HighlightColor } from '../utils/highlightColors'
import { useReaderPreferences } from '../../preferences/hooks/useReaderPreferences'

interface ColorPaletteProps {
  selectedColor: string
  onColorSelect: (colorId: string) => void
}

/**
 * Color palette selector for highlights
 */
export function ColorPalette ({ selectedColor, onColorSelect }: ColorPaletteProps): JSX.Element {
  const { preferences } = useReaderPreferences()
  const themeColors = getHighlightColorsForTheme(preferences.theme || 'light')

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">Color:</span>
      <div className="flex gap-1">
        {themeColors.map((color: HighlightColor & { bgHex: string }) => (
          <button
            key={color.id}
            onClick={() => { onColorSelect(color.id) }}
            className={`w-8 h-8 rounded border-2 transition-all ${
              selectedColor === color.id
                ? 'border-primary scale-110'
                : 'border-border hover:scale-105'
            }`}
            style={{ backgroundColor: color.bgHex }}
            title={`${color.name} - ${color.label}`}
            aria-label={`Select ${color.name} highlight color`}
          />
        ))}
      </div>
    </div>
  )
}
