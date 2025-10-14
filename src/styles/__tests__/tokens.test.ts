import { describe, it, expect } from 'vitest'
import {
  spacing,
  colors,
  borderRadius,
  zIndex,
  getSpacing,
  getColor,
  getBorderRadius,
  getZIndex,
  type SpacingKey,
  type BorderRadiusKey,
  type ZIndexKey
} from '../tokens'

describe('Design Tokens', () => {
  describe('spacing', () => {
    it('should export spacing scale', () => {
      expect(spacing).toBeDefined()
      expect(spacing[0]).toBe('0')
      expect(spacing[4]).toBe('1rem')
      expect(spacing[8]).toBe('2rem')
    })

    it('should include custom spacing values', () => {
      expect(spacing[18]).toBe('4.5rem')
      expect(spacing[88]).toBe('22rem')
      expect(spacing[128]).toBe('32rem')
    })
  })

  describe('colors', () => {
    it('should export color palette', () => {
      expect(colors).toBeDefined()
      expect(colors.primary.DEFAULT).toBe('#b91c1c')
      expect(colors.primary.foreground).toBe('#ffffff')
    })

    it('should include semantic colors', () => {
      expect(colors.success.DEFAULT).toBe('#16a34a')
      expect(colors.error.DEFAULT).toBe('#dc2626')
      expect(colors.warning.DEFAULT).toBe('#f59e0b')
    })

    it('should include theme-specific colors', () => {
      expect(colors.background.DEFAULT).toBe('#ffffff')
      expect(colors.background.dark).toBe('#0f172a')
      expect(colors.background.sepia).toBe('#f5f3ed')
    })
  })

  describe('borderRadius', () => {
    it('should export border radius scale', () => {
      expect(borderRadius).toBeDefined()
      expect(borderRadius.none).toBe('0')
      expect(borderRadius.sm).toBe('0.25rem')
      expect(borderRadius.DEFAULT).toBe('0.375rem')
      expect(borderRadius.full).toBe('9999px')
    })
  })

  describe('zIndex', () => {
    it('should export z-index scale', () => {
      expect(zIndex).toBeDefined()
      expect(zIndex.auto).toBe('auto')
      expect(zIndex[0]).toBe('0')
    })

    it('should include semantic z-index values', () => {
      expect(zIndex.modal).toBe('50')
      expect(zIndex.popover).toBe('40')
      expect(zIndex.overlay).toBe('30')
      expect(zIndex.dropdown).toBe('20')
      expect(zIndex.sticky).toBe('10')
    })
  })

  describe('getSpacing', () => {
    it('should return spacing value by key', () => {
      expect(getSpacing(0)).toBe('0')
      expect(getSpacing(4)).toBe('1rem')
      expect(getSpacing(8)).toBe('2rem')
    })

    it('should return custom spacing values', () => {
      expect(getSpacing(18)).toBe('4.5rem')
      expect(getSpacing(88)).toBe('22rem')
    })

    it('should be type-safe', () => {
      // This test verifies TypeScript compilation
      const key: SpacingKey = 4
      const value = getSpacing(key)
      expect(value).toBe('1rem')
    })
  })

  describe('getColor', () => {
    it('should return color by path', () => {
      expect(getColor('primary.DEFAULT')).toBe('#b91c1c')
      expect(getColor('primary.foreground')).toBe('#ffffff')
      expect(getColor('background.dark')).toBe('#0f172a')
    })

    it('should throw error for invalid path', () => {
      expect(() => getColor('invalid.path')).toThrow('Color path "invalid.path" not found')
    })
  })

  describe('getBorderRadius', () => {
    it('should return border radius by key', () => {
      expect(getBorderRadius('none')).toBe('0')
      expect(getBorderRadius('sm')).toBe('0.25rem')
      expect(getBorderRadius('DEFAULT')).toBe('0.375rem')
    })

    it('should be type-safe', () => {
      const key: BorderRadiusKey = 'md'
      const value = getBorderRadius(key)
      expect(value).toBe('0.5rem')
    })
  })

  describe('getZIndex', () => {
    it('should return z-index by key', () => {
      expect(getZIndex('auto')).toBe('auto')
      expect(getZIndex(0)).toBe('0')
      expect(getZIndex('modal')).toBe('50')
    })

    it('should be type-safe', () => {
      const key: ZIndexKey = 'popover'
      const value = getZIndex(key)
      expect(value).toBe('40')
    })
  })
})
