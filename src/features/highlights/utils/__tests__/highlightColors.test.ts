import { describe, it, expect } from 'vitest'
import {
  HIGHLIGHT_COLORS,
  getHighlightColor,
  getHighlightColorForTheme,
  getHighlightColorsForTheme
} from '../highlightColors'

describe('highlightColors', () => {
  describe('HIGHLIGHT_COLORS', () => {
    it('contains at least 4 colors', () => {
      expect(HIGHLIGHT_COLORS.length).toBeGreaterThanOrEqual(4)
    })

    it('has unique color IDs', () => {
      const ids = HIGHLIGHT_COLORS.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all colors have required properties', () => {
      HIGHLIGHT_COLORS.forEach(color => {
        expect(color).toHaveProperty('id')
        expect(color).toHaveProperty('name')
        expect(color).toHaveProperty('label')
        expect(color).toHaveProperty('themes')
        expect(color.themes).toHaveProperty('light')
        expect(color.themes).toHaveProperty('dark')
        expect(color.themes).toHaveProperty('sepia')
        expect(color.themes).toHaveProperty('highContrast')
      })
    })

    it('includes yellow as default color', () => {
      const yellow = HIGHLIGHT_COLORS.find(c => c.id === 'yellow')
      expect(yellow).toBeDefined()
    })
  })

  describe('getHighlightColor', () => {
    it('returns correct color by ID', () => {
      const color = getHighlightColor('yellow')
      expect(color.id).toBe('yellow')
      expect(color.name).toBe('Yellow')
    })

    it('returns default color for invalid ID', () => {
      const color = getHighlightColor('invalid-color')
      expect(color.id).toBe('yellow')
    })

    it('returns color for all valid IDs', () => {
      HIGHLIGHT_COLORS.forEach(expectedColor => {
        const color = getHighlightColor(expectedColor.id)
        expect(color.id).toBe(expectedColor.id)
      })
    })
  })

  describe('getHighlightColorForTheme', () => {
    it('returns light theme color by default', () => {
      const color = getHighlightColorForTheme('yellow', 'invalid-theme')
      expect(color).toBe('#fef3c7')
    })

    it('returns correct colors for each theme', () => {
      expect(getHighlightColorForTheme('yellow', 'light')).toBe('#fef3c7')
      expect(getHighlightColorForTheme('yellow', 'dark')).toBe('#78350f')
      expect(getHighlightColorForTheme('yellow', 'sepia')).toBe('#f59e0b')
      expect(getHighlightColorForTheme('yellow', 'high-contrast')).toBe('#000000')
    })

    it('returns dark colors that are different from light', () => {
      const lightColor = getHighlightColorForTheme('yellow', 'light')
      const darkColor = getHighlightColorForTheme('yellow', 'dark')
      expect(lightColor).not.toBe(darkColor)
    })
  })

  describe('getHighlightColorsForTheme', () => {
    it('returns colors with bgHex property for theme', () => {
      const themeColors = getHighlightColorsForTheme('dark')
      expect(themeColors.length).toBe(HIGHLIGHT_COLORS.length)

      themeColors.forEach(color => {
        expect(color).toHaveProperty('bgHex')
        expect(typeof color.bgHex).toBe('string')
      })
    })

    it('returns different colors for different themes', () => {
      const lightColors = getHighlightColorsForTheme('light')
      const darkColors = getHighlightColorsForTheme('dark')

      expect(lightColors[0].bgHex).not.toBe(darkColors[0].bgHex)
    })
  })
})
