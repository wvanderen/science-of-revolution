import { useReaderTheme, type ReaderTheme, type ReaderFontSize } from '../hooks/useReaderTheme'

/**
 * Theme selector dropdown for reader
 */
export function ThemeSelector (): JSX.Element {
  const { theme, fontSize, setTheme, setFontSize } = useReaderTheme()

  const themes: Array<{ value: ReaderTheme, label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'sepia', label: 'Sepia' }
  ]

  const fontSizes: Array<{ value: ReaderFontSize, label: string }> = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' }
  ]

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="theme-select" className="text-sm font-medium text-foreground">
          Theme:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => { setTheme(e.target.value as ReaderTheme) }}
          className="input py-1 px-2 text-sm"
        >
          {themes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="fontsize-select" className="text-sm font-medium text-foreground">
          Font Size:
        </label>
        <select
          id="fontsize-select"
          value={fontSize}
          onChange={(e) => { setFontSize(e.target.value as ReaderFontSize) }}
          className="input py-1 px-2 text-sm"
        >
          {fontSizes.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
