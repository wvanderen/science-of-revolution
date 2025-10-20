import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AvatarService } from '../avatarService'

// Mock Supabase client
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockRemove = vi.fn()

vi.mock('../../../../lib/supabaseClient', () => ({
  default: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove
      }))
    }
  }
}))

describe('AvatarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should accept valid image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = AvatarService.validateFile(validFile)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = AvatarService.validateFile(invalidFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid file type. Supported formats: JPEG, PNG, WebP, GIF')
    })

    it('should reject files that are too large', () => {
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }) // 10MB

      const result = AvatarService.validateFile(largeFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File too large. Maximum size is 5MB')
    })

    it('should accept files at the size limit', () => {
      const maxSizeFile = new File(['test'], 'max.jpg', { type: 'image/jpeg' })
      Object.defineProperty(maxSizeFile, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      const result = AvatarService.validateFile(maxSizeFile)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('generateFileName', () => {
    it('should generate unique filenames', () => {
      const userId = 'user123'
      const originalName = 'photo.jpg'

      const filename1 = AvatarService.generateFileName(userId, originalName)
      const filename2 = AvatarService.generateFileName(userId, originalName)

      expect(filename1).toMatch(/^user123\/original_\d+_[a-z0-9]+\.jpg$/)
      expect(filename2).toMatch(/^user123\/original_\d+_[a-z0-9]+\.jpg$/)
      expect(filename1).not.toBe(filename2)
    })

    it('should include size prefix when provided', () => {
      const userId = 'user123'
      const originalName = 'photo.png'

      const filename = AvatarService.generateFileName(userId, originalName, 'medium')

      expect(filename).toMatch(/^user123\/medium_\d+_[a-z0-9]+\.png$/)
    })

    it('should handle files without extensions', () => {
      const userId = 'user123'
      const originalName = 'photo'

      const filename = AvatarService.generateFileName(userId, originalName)

      expect(filename).toMatch(/^user123\/original_\d+_[a-z0-9]+\.jpg$/)
    })
  })

  describe('compressImage', () => {
    it('should compress images to target dimensions', async () => {
      // Mock canvas context
      const mockContext = {
        drawImage: vi.fn(),
        toBlob: vi.fn((callback) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' })
          callback(blob)
        })
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext)
      } as any

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)

      // Mock image
      const mockImage = {
        width: 1000,
        height: 800,
        src: '',
        onload: null as any,
        onerror: null as any
      }

      global.Image = vi.fn(() => mockImage) as any

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await AvatarService.compressImage(file, 256, 256)

      expect(mockCanvas.width).toBe(256)
      expect(mockCanvas.height).toBe(256)
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(result).toBeInstanceOf(File)
    })
  })

  describe('uploadAvatar', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    it('should upload avatar successfully', async () => {
      // Mock successful upload
      mockUpload.mockResolvedValue({
        data: { path: 'user123/avatar.jpg' },
        error: null
      })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' }
      })

      // Mock image processing
      vi.spyOn(AvatarService, 'processImage').mockResolvedValue([
        {
          size: 'small',
          width: 64,
          height: 64,
          file: mockFile,
          url: 'blob:small'
        },
        {
          size: 'medium',
          width: 128,
          height: 128,
          file: mockFile,
          url: 'blob:medium'
        },
        {
          size: 'large',
          width: 256,
          height: 256,
          file: mockFile,
          url: 'blob:large'
        }
      ])

      const result = await AvatarService.uploadAvatar({
        userId: 'user123',
        file: mockFile
      })

      expect(mockUpload).toHaveBeenCalledTimes(4) // 3 sizes + original
      expect(result.urls.small).toBe('https://example.com/avatar.jpg')
      expect(result.urls.medium).toBe('https://example.com/avatar.jpg')
      expect(result.urls.large).toBe('https://example.com/avatar.jpg')
      expect(result.urls.original).toBe('https://example.com/avatar.jpg')
    })

    it('should handle upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })

      vi.spyOn(AvatarService, 'processImage').mockResolvedValue([
        {
          size: 'small',
          width: 64,
          height: 64,
          file: mockFile,
          url: 'blob:small'
        }
      ])

      await expect(
        AvatarService.uploadAvatar({
          userId: 'user123',
          file: mockFile
        })
      ).rejects.toThrow('Upload failed: Upload failed')
    })

    it('should validate file before upload', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      await expect(
        AvatarService.uploadAvatar({
          userId: 'user123',
          file: invalidFile
        })
      ).rejects.toThrow('Invalid file type. Supported formats: JPEG, PNG, WebP, GIF')

      expect(mockUpload).not.toHaveBeenCalled()
    })
  })

  describe('deleteAvatar', () => {
    it('should delete all avatar sizes', async () => {
      mockRemove.mockResolvedValue({ data: {}, error: null })

      await AvatarService.deleteAvatar('user123', 'avatar.jpg')

      expect(mockRemove).toHaveBeenCalledTimes(4) // small, medium, large, original
      expect(mockRemove).toHaveBeenCalledWith([
        'user123/small_avatar.jpg'
      ])
      expect(mockRemove).toHaveBeenCalledWith([
        'user123/medium_avatar.jpg'
      ])
      expect(mockRemove).toHaveBeenCalledWith([
        'user123/large_avatar.jpg'
      ])
      expect(mockRemove).toHaveBeenCalledWith([
        'user123/original_avatar.jpg'
      ])
    })

    it('should handle delete errors', async () => {
      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' }
      })

      await expect(
        AvatarService.deleteAvatar('user123', 'avatar.jpg')
      ).rejects.toThrow('Failed to delete avatar files')
    })
  })
})