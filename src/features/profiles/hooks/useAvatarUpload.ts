import { useState, useCallback } from 'react'
import { AvatarService, type AvatarUploadOptions, type AvatarUploadResult } from '../services/avatarService'

export interface UseAvatarUploadState {
  isUploading: boolean
  progress: number
  error: string | null
  result: AvatarUploadResult | null
}

export interface UseAvatarUploadReturn {
  uploadAvatar: (options: AvatarUploadOptions) => Promise<AvatarUploadResult>
  isUploading: boolean
  progress: number
  error: string | null
  result: AvatarUploadResult | null
  clearError: () => void
  reset: () => void
  retryCount: number
  maxRetries: number
}

export function useAvatarUpload(maxRetries: number = 3): UseAvatarUploadReturn {
  const [state, setState] = useState<UseAvatarUploadState & { retryCount: number }>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
    retryCount: 0
  })

  const uploadAvatar = useCallback(async (options: AvatarUploadOptions): Promise<AvatarUploadResult> => {
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      result: null,
      retryCount: 0
    }))

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await AvatarService.uploadAvatar({
          ...options,
          onProgress: (progress) => {
            setState(prev => ({ ...prev, progress }))
          }
        })

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          result,
          error: null,
          retryCount: attempt
        }))

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed')

        setState(prev => ({
          ...prev,
          retryCount: attempt + 1
        }))

        // Don't retry on certain error types
        if (error instanceof Error) {
          if (error.message.includes('Invalid file type') ||
              error.message.includes('File too large') ||
              error.message.includes('Permission denied')) {
            break // Don't retry these errors
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Max 5 seconds
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Upload failed after multiple attempts'

    setState(prev => ({
      ...prev,
      isUploading: false,
      progress: 0,
      error: errorMessage,
      result: null
    }))

    throw lastError || new Error(errorMessage)
  }, [maxRetries])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
      retryCount: 0
    })
  }, [])

  return {
    uploadAvatar,
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
    result: state.result,
    clearError,
    reset,
    retryCount: state.retryCount,
    maxRetries
  }
}