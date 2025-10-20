import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage, createSquareCrop, processAvatarImage, getImageDimensions, supportsWebP } from '../imageCompression'

// Mock canvas and image APIs
const mockContext = {
  drawImage: vi.fn(),
  toBlob: vi.fn((callback, mimeType, quality) => {
    // Simulate compression
    const mockBlob = new Blob(['compressed image data'], { type: mimeType || 'image/jpeg' })
    callback(mockBlob)
  })
}

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext)
} as any

describe('imageCompression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)
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

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['large image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await compressImage(file)

      expect(result).toBeInstanceOf(File)
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

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['large image data'], 'test.jpg', { type: 'image/jpeg' })
      const options = { maxWidth: 500, maxHeight: 500 }
      const result = await compressImage(file, options)

      expect(mockCanvas.width).toBeLessThanOrEqual(500)
      expect(mockCanvas.height).toBeLessThanOrEqual(500)
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('should handle different formats', async () => {
      const mockImage = {
        width: 1000,
        height: 800,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['image data'], 'test.png', { type: 'image/png' })
      const options = { format: 'png' as const }
      const result = await compressImage(file, options)

      expect(mockContext.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        expect.any(Number)
      )
    })

    it('should handle device context optimization', async () => {
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

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await compressImage(file, { deviceContext: 'mobile' })

      expect(result.file.type).toBe('image/webp')
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

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await createSquareCrop(file, 256, 0.8)

      expect(mockCanvas.width).toBe(256)
      expect(mockCanvas.height).toBe(256)
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        100, 100, 600, 600, // Crop from center (800-600)/2 = 100
        0, 0, 256, 256
      )
    })

    it('should handle portrait orientation', async () => {
      const mockImage = {
        width: 600,
        height: 800, // Should crop to 600x600
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await createSquareCrop(file, 256, 0.8)

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        0, 100, 600, 600, // Crop from center (800-600)/2 = 100
        0, 0, 256, 256
      )
    })
  })

  describe('processAvatarImage', () => {
    it('should process all three avatar sizes', async () => {
      const mockSquareCrop = vi.fn()
      vi.mocked(createSquareCrop).mockImplementation((file, size, quality) => {
        return Promise.resolve(new File([`cropped-${size}`], `avatar-${size}.jpg`, { type: 'image/jpeg' }))
      })

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processAvatarImage(file)

      expect(createSquareCrop).toHaveBeenCalledWith(file, 64, 0.7)
      expect(createSquareCrop).toHaveBeenCalledWith(file, 128, 0.85)
      expect(createSquareCrop).toHaveBeenCalledWith(file, 256, 0.9)

      expect(result.small).toBeInstanceOf(File)
      expect(result.medium).toBeInstanceOf(File)
      expect(result.large).toBeInstanceOf(File)
    })

    it('should optimize for mobile context', async () => {
      vi.mocked(createSquareCrop).mockImplementation((file, size, quality) => {
        return Promise.resolve(new File([`cropped-${size}`], `avatar-${size}.jpg`, { type: 'image/jpeg' }))
      })

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processAvatarImage(file, 'mobile')

      // Mobile should use lower quality
      expect(createSquareCrop).toHaveBeenCalledWith(file, 64, expect.any(Number))
      expect(createSquareCrop).toHaveBeenCalledWith(file, 128, expect.any(Number))
      expect(createSquareCrop).toHaveBeenCalledWith(file, 256, expect.any(Number))
    })
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
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload(new Event('load'))
        }, 0)
        return mockImage
      }) as any

      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

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
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror(new Event('error'))
        }, 0)
        return mockImage
      }) as any

      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      await expect(getImageDimensions(file)).rejects.toThrow('Failed to load image')
    })
  })

  describe('supportsWebP', () => {
    it('should detect WebP support', () => {
      const mockCanvas = {
        width: 1,
        height: 1,
        toDataURL: vi.fn(() => 'data:image/webp;base64,test')
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)

      const result = supportsWebP()
      expect(result).toBe(true)
    })

    it('should detect no WebP support', () => {
      const mockCanvas = {
        width: 1,
        height: 1,
        toDataURL: vi.fn(() => 'data:image/png;base64,test')
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)

      const result = supportsWebP()
      expect(result).toBe(false)
    })
  })
})