import { describe, it, expect } from 'vitest'

describe('ResourceCard basic functionality', () => {
  it('should import without errors', async () => {
    const { ResourceCard } = await import('../ResourceCard')
    expect(ResourceCard).toBeDefined()
  })

  it('should have correct component structure', async () => {
    // This test verifies the component exists and has expected exports
    const module = await import('../ResourceCard')
    expect(module.ResourceCard).toBeTypeOf('function')
  })
})