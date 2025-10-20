import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAvatarUpload } from '../useAvatarUpload'
import { AvatarService } from '../../services/avatarService'

// Mock the AvatarService
vi.mock('../../services/avatarService', () => ({
  AvatarService: {
    uploadAvatar: vi.fn()
  }
}))

const mockAvatarService = vi.mocked(AvatarService)

describe('useAvatarUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAvatarUpload())

    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBe(null)
    expect(result.current.result).toBe(null)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.maxRetries).toBe(3)
  })

  it('should handle successful upload', async () => {
    const mockResult = {
      urls: {
        small: 'https://example.com/small.jpg',
        medium: 'https://example.com/medium.jpg',
        large: 'https://example.com/large.jpg',
        original: 'https://example.com/original.jpg'
      },
      sizes: {
        small: { width: 64, height: 64, fileSize: 1024 },
        medium: { width: 128, height: 128, fileSize: 2048 },
        large: { width: 256, height: 256, fileSize: 4096 }
      }
    }

    mockAvatarService.uploadAvatar.mockResolvedValue(mockResult)

    const { result } = renderHook(() => useAvatarUpload())
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.uploadAvatar({ userId: 'test-user', file })
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(100)
    expect(result.current.error).toBe(null)
    expect(result.current.result).toEqual(mockResult)
    expect(result.current.retryCount).toBe(0)
  })

  it('should handle upload errors', async () => {
    const mockError = new Error('Upload failed')
    mockAvatarService.uploadAvatar.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAvatarUpload())
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      try {
        await result.current.uploadAvatar({ userId: 'test-user', file })
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBe('Upload failed')
    expect(result.current.result).toBe(null)
    expect(result.current.retryCount).toBe(4) // 1 initial + 3 retries
  })

  it('should retry on transient errors', async () => {
    // Fail first 2 attempts, succeed on 3rd
    mockAvatarService.uploadAvatar
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        urls: { small: 'test.jpg', medium: 'test.jpg', large: 'test.jpg', original: 'test.jpg' },
        sizes: { small: { width: 64, height: 64, fileSize: 1024 }, medium: { width: 128, height: 128, fileSize: 2048 }, large: { width: 256, height: 256, fileSize: 4096 } }
      })

    const { result } = renderHook(() => useAvatarUpload(2)) // Only 2 retries
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.uploadAvatar({ userId: 'test-user', file })
    })

    expect(mockAvatarService.uploadAvatar).toHaveBeenCalledTimes(3) // Initial + 2 retries
    expect(result.current.retryCount).toBe(2)
    expect(result.current.error).toBe(null)
    expect(result.current.result).toBeDefined()
  })

  it('should not retry on validation errors', async () => {
    const validationError = new Error('Invalid file type')
    mockAvatarService.uploadAvatar.mockRejectedValue(validationError)

    const { result } = renderHook(() => useAvatarUpload())
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      try {
        await result.current.uploadAvatar({ userId: 'test-user', file })
      } catch (error) {
        // Expected to throw
      }
    })

    expect(mockAvatarService.uploadAvatar).toHaveBeenCalledTimes(1) // No retries
    expect(result.current.retryCount).toBe(1)
    expect(result.current.error).toBe('Invalid file type')
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useAvatarUpload())

    // Manually set error state
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe(null)
  })

  it('should reset state', () => {
    const { result } = renderHook(() => useAvatarUpload())

    act(() => {
      result.current.reset()
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBe(null)
    expect(result.current.result).toBe(null)
    expect(result.current.retryCount).toBe(0)
  })

  it('should report progress during upload', async () => {
    let progressCallback: ((progress: number) => void) | undefined
    mockAvatarService.uploadAvatar.mockImplementation(async ({ onProgress }) => {
      progressCallback = onProgress
      return {
        urls: { small: 'test.jpg', medium: 'test.jpg', large: 'test.jpg', original: 'test.jpg' },
        sizes: { small: { width: 64, height: 64, fileSize: 1024 }, medium: { width: 128, height: 128, fileSize: 2048 }, large: { width: 256, height: 256, fileSize: 4096 } }
      }
    })

    const { result } = renderHook(() => useAvatarUpload())
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.uploadAvatar({ userId: 'test-user', file })
    })

    // Simulate progress updates
    if (progressCallback) {
      act(() => {
        progressCallback(50)
      })
      expect(result.current.progress).toBe(50)

      act(() => {
        progressCallback(100)
      })
      expect(result.current.progress).toBe(100)
    }
  })
})