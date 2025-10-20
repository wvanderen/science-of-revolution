import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReaderTheme, getReaderFontClass } from '../useReaderTheme'

describe('useReaderTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.className = ''
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useReaderTheme())

    expect(result.current.theme).toBe('light')
    expect(result.current.fontSize).toBe('base')
  })

  it('updates theme', () => {
    const { result } = renderHook(() => useReaderTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
  })

  it('applies dark theme class to document', () => {
    const { result } = renderHook(() => useReaderTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes theme classes for light theme', () => {
    const { result } = renderHook(() => useReaderTheme())

    // First set to dark
    act(() => {
      result.current.setTheme('dark')
    })

    // Then set to light
    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('updates font size', () => {
    const { result } = renderHook(() => useReaderTheme())

    act(() => {
      result.current.setFontSize('lg')
    })

    expect(result.current.fontSize).toBe('lg')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useReaderTheme())

    act(() => {
      result.current.setTheme('dark')
      result.current.setFontSize('xl')
    })

    // Check localStorage
    const stored = localStorage.getItem('reader-preferences')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.state.theme).toBe('dark')
    expect(parsed.state.fontSize).toBe('xl')
  })
})

describe('getReaderFontClass', () => {
  it('returns correct class for each font size', () => {
    expect(getReaderFontClass('sm')).toBe('text-reader-sm')
    expect(getReaderFontClass('base')).toBe('text-reader-base')
    expect(getReaderFontClass('lg')).toBe('text-reader-lg')
    expect(getReaderFontClass('xl')).toBe('text-reader-xl')
  })
})
