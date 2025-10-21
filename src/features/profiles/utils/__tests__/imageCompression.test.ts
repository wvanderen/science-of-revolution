import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage, createSquareCrop, processAvatarImage, getImageDimensions } from '../imageCompression'

// Mock canvas and image APIs
const mockContext = {
  drawImage: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
  toBlob: vi.fn((callback, mimeType, _quality) => {
    // Simulate compression
    const mockBlob = new Blob(['compressed image data'], { type: mimeType || 'image/jpeg' })
    callback(mockBlob)
  })
}

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
  toBlob: vi.fn((callback, mimeType, _quality) => {
    // Simulate compression
    const mockBlob = new Blob(['compressed image data'], { type: mimeType || 'image/jpeg' })
    setTimeout(() => callback(mockBlob), 0)
  })
} as any

describe('imageCompression', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup global mocks for browser APIs
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()

    // Mock document.createElement for canvas
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas
      }
      return document.createElement(tagName)
    })
  })

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const mockImage = {
        width: 1000,
        height: 800,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        // Simulate async image loading
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['large image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await compressImage(file)

      expect(result.file).toBeInstanceOf(File)
      expect(result.originalSize).toBe(file.size)
      expect(result.compressedSize).toBeGreaterThan(0)
      expect(result.compressionRatio).toBeGreaterThan(0)
      expect(result.dimensions.width).toBeGreaterThan(0)
      expect(result.dimensions.height).toBeGreaterThan(0)
    })

    it('should handle custom dimensions', async () => {
      const mockImage = {
        width: 2000,
        height: 1500,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['large image data'], 'test.jpg', { type: 'image/jpeg' })
      const options = { maxWidth: 500, maxHeight: 500 }
      const result = await compressImage(file, options)

      expect(mockCanvas.width).toBeLessThanOrEqual(500)
      expect(mockCanvas.height).toBeLessThanOrEqual(500)
      expect(mockContext.drawImage).toHaveBeenCalled()
    }, 10000)

    it('should handle different formats', async () => {
      const mockImage = {
        width: 1000,
        height: 800,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.png', { type: 'image/png' })
      const options = { format: 'png' as const }
      const result = await compressImage(file, options)

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        expect.any(Number)
      )
    }, 10000)

    it('should handle device context optimization', async () => {
      // Mock WebP support for mobile
      const originalCreateElement = document.createElement
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          const canvas = originalCreateElement.call(document, 'canvas')
          // Mock toDataURL to return WebP for webp format
          vi.spyOn(canvas, 'toDataURL').mockImplementation((format: string) => {
            if (format === 'image/webp') {
              return 'data:image/webp;base64,mockwebp'
            }
            return 'data:image/jpeg;base64,mockdata'
          })
          return canvas
        }
        return originalCreateElement.call(document, tagName)
      })

      // Mock mobile detection
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      })

      const mockImage = {
        width: 1000,
        height: 800,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await compressImage(file, { deviceContext: 'mobile' })

      expect(result.file.type).toBe('image/webp')
    }, 10000)

    it('should handle image load errors', async () => {
      const mockImage = {
        width: 0,
        height: 0,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror(new Event('error'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      await expect(compressImage(file)).rejects.toThrow('Failed to load image')
    })
  })

  describe('createSquareCrop', () => {
    it('should create square crop from rectangular image', async () => {
      const mockImage = {
        width: 800,
        height: 600, // Should crop to 600x600
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await createSquareCrop(file, 256, 0.8)

      expect(mockCanvas.width).toBe(256)
      expect(mockCanvas.height).toBe(256)
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        100, 0, 600, 600, // Crop from center (800-600)/2 = 100, (600-600)/2 = 0
        0, 0, 256, 256
      )
    }, 10000)

    it('should handle portrait orientation', async () => {
      const mockImage = {
        width: 600,
        height: 800, // Should crop to 600x600
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await createSquareCrop(file, 256, 0.8)

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        0, 100, 600, 600, // Crop from center (800-600)/2 = 100
        0, 0, 256, 256
      )
    }, 10000)
  })

  describe('processAvatarImage', () => {
    it('should process all three avatar sizes', async () => {
      const mockImage = {
        width: 500,
        height: 400,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processAvatarImage(file)

      expect(result.small).toBeInstanceOf(File)
      expect(result.medium).toBeInstanceOf(File)
      expect(result.large).toBeInstanceOf(File)
    }, 10000)

    it('should optimize for mobile context', async () => {
      const mockImage = {
        width: 500,
        height: 400,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processAvatarImage(file, 'mobile')

      expect(result.small).toBeInstanceOf(File)
      expect(result.medium).toBeInstanceOf(File)
      expect(result.large).toBeInstanceOf(File)
    }, 10000)
  })

  describe('getImageDimensions', () => {
    it('should get image dimensions', async () => {
      const mockImage = {
        width: 800,
        height: 600,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        // Simulate async image loading
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await getImageDimensions(file)

      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('should handle image load errors', async () => {
      const mockImage = {
        width: 0,
        height: 0,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => {
        // Simulate async image loading error
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror(new Event('error'))
        }, 0)
        return mockImage
      }) as any

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      await expect(getImageDimensions(file)).rejects.toThrow('Failed to load image')
    })
  })

  // supportsWebP tests removed - function is not exported from the module
})