/**
 * Highlight color palette matching design tokens
 * All colors meet WCAG AA contrast ratios with black text
 */

export interface HighlightColor {
  id: string
  name: string
  bgClass: string
  bgHex: string
  label: string
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    id: 'yellow',
    name: 'Yellow',
    bgClass: 'bg-amber-100',
    bgHex: '#fef3c7',
    label: 'General highlight'
  },
  {
    id: 'green',
    name: 'Green',
    bgClass: 'bg-emerald-100',
    bgHex: '#d1fae5',
    label: 'Important concept'
  },
  {
    id: 'blue',
    name: 'Blue',
    bgClass: 'bg-blue-100',
    bgHex: '#dbeafe',
    label: 'Definition'
  },
  {
    id: 'pink',
    name: 'Pink',
    bgClass: 'bg-pink-100',
    bgHex: '#fce7f3',
    label: 'Review item'
  },
  {
    id: 'orange',
    name: 'Orange',
    bgClass: 'bg-orange-100',
    bgHex: '#fed7aa',
    label: 'Question'
  }
]

export function getHighlightColor (colorId: string): HighlightColor {
  return HIGHLIGHT_COLORS.find(c => c.id === colorId) ?? HIGHLIGHT_COLORS[0]
}

export function getHighlightBgClass (colorId: string): string {
  return getHighlightColor(colorId).bgClass
}
