import { describe, it, expect } from 'vitest'
import {
  HIGHLIGHT_COLORS,
  getHighlightColor,
  getHighlightBgClass
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
        expect(color).toHaveProperty('bgClass')
        expect(color).toHaveProperty('bgHex')
        expect(color).toHaveProperty('label')
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

  describe('getHighlightBgClass', () => {
    it('returns correct Tailwind class for yellow', () => {
      const bgClass = getHighlightBgClass('yellow')
      expect(bgClass).toBe('bg-amber-100')
    })

    it('returns correct Tailwind class for green', () => {
      const bgClass = getHighlightBgClass('green')
      expect(bgClass).toBe('bg-emerald-100')
    })

    it('returns default class for invalid color', () => {
      const bgClass = getHighlightBgClass('invalid')
      expect(bgClass).toBe('bg-amber-100')
    })
  })
})
