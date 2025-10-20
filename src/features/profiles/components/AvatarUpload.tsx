import { useEffect, useMemo, useRef, useState } from 'react'
import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { AvatarService } from '../services/avatarService'
import { ImageCropper } from './ImageCropper'

/**
 * Detect if device is mobile
 */
function isMobileDevice(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * Check if camera API is supported
 */
function supportsCameraCapture(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

interface AvatarUploadProps {
  userId: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

interface PendingFilePreview {
  url: string
  file: File
}

interface CroppingFile {
  file: File
  preview: string
}

/**
 * Enhanced avatar uploader with full upload functionality.
 * Supports file upload, image compression, progress tracking, and error handling.
 */
export function AvatarUpload ({
  userId,
  value,
  onChange,
  disabled = false
}: AvatarUploadProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingFile, setPendingFile] = useState<PendingFilePreview | null>(null)
  const [croppingFile, setCroppingFile] = useState<CroppingFile | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [showCameraOption, setShowCameraOption] = useState(false)

  const isMobile = isMobileDevice()
  const supportsCamera = supportsCameraCapture()

  const {
    uploadAvatar,
    isUploading,
    progress,
    error,
    clearError,
    reset,
    retryCount,
    maxRetries
  } = useAvatarUpload()

  useEffect(() => {
    return () => {
      // Cleanup all object URLs to prevent memory leaks
      if (pendingFile?.url != null) {
        URL.revokeObjectURL(pendingFile.url)
      }
      if (croppingFile?.preview != null) {
        URL.revokeObjectURL(croppingFile.preview)
      }
    }
  }, [pendingFile, croppingFile])

  const previewSrc = useMemo(() => {
    if (pendingFile?.url != null) return pendingFile.url
    return value ?? undefined
  }, [pendingFile, value])

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.trim()
    onChange(nextValue.length === 0 ? null : nextValue)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file == null) return

    // Clear previous errors
    clearError()
    reset()

    // Validate file
    const validation = AvatarService.validateFile(file)
    if (!validation.isValid) {
      // Set error state through hook would require modification
      // For now, we'll handle validation in uploadAvatar
      console.error('File validation failed:', validation.error)
      return
    }

    // Start cropping flow
    const preview = URL.createObjectURL(file)
    setCroppingFile({ file, preview })

    // Reset file input
    if (fileInputRef.current != null) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    // Clean up cropping preview
    if (croppingFile?.preview) {
      URL.revokeObjectURL(croppingFile.preview)
    }
    setCroppingFile(null)

    // Create pending file for upload
    const url = URL.createObjectURL(croppedFile)
    setPendingFile({ url, file: croppedFile })

    // Start upload
    try {
      const result = await uploadAvatar({ userId, file: croppedFile })
      onChange(result.urls.medium) // Use medium size as primary
      setPendingFile(null) // Clear pending file after successful upload
    } catch (error) {
      // Error is handled by the hook
      console.error('Upload failed:', error)
    }
  }

  const handleCropCancel = () => {
    if (croppingFile?.preview) {
      URL.revokeObjectURL(croppingFile.preview)
    }
    setCroppingFile(null)
  }

  const handleCameraCapture = async () => {
    try {
      // Request camera permission and capture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Prefer front camera for selfies
        audio: false
      })

      // Create video element to capture frame
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })

      // Play video
      await video.play()

      // Create canvas to capture image
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to capture image'))
            }
          },
          'image/jpeg',
          0.85
        )
      })

      // Stop camera stream
      stream.getTracks().forEach(track => track.stop())

      // Create file and start cropping flow
      const capturedFile = new File([blob], 'camera-capture.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const preview = URL.createObjectURL(capturedFile)
      setCroppingFile({ file: capturedFile, preview })

    } catch (error) {
      console.error('Camera capture failed:', error)

      // Fall back to file selection if camera fails
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access to take a photo.')
        } else if (error.name === 'NotFoundError') {
          alert('No camera found. Please select an image from your files.')
        } else {
          alert('Camera capture failed. Please try selecting an image from your files.')
        }
      }
    }
  }

  const handleFileInputClick = () => {
    setShowCameraOption(false)
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    setShowCameraOption(false)
    handleCameraCapture()
  }

  const handleRemove = () => {
    if (pendingFile?.url != null) {
      URL.revokeObjectURL(pendingFile.url)
    }
    setPendingFile(null)
    onChange(null)
    reset()
    if (fileInputRef.current != null) {
      fileInputRef.current.value = ''
    }
  }

  const handleChooseImage = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isUploading) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleChooseImage()
    }
  }

  const handleRetry = () => {
    if (pendingFile?.file) {
      // Directly upload the file again without going through file input
      handleCropComplete(pendingFile.file)
    }
  }

  // If cropping, show cropping interface
  if (croppingFile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-w-2xl w-full bg-background rounded-lg shadow-xl border border-border">
          <div className="p-6">
            <ImageCropper
              imageFile={croppingFile.file}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspectRatio={1}
              cropSize={256}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" role="region" aria-label="Avatar upload section">
      <div id="avatar-upload-help" className="sr-only">
        Upload a profile avatar. Supported formats include JPEG, PNG, WebP, and GIF. Maximum file size is 5MB.
        You can upload from your device or take a photo with your camera on mobile devices.
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-background">
          {previewSrc != null
            ? (
              <img
                src={previewSrc}
                alt="Profile avatar preview"
                className="h-full w-full object-cover"
                role="img"
                aria-label="Current avatar preview"
              />
              )
            : (
              <div
                className="flex h-full w-full items-center justify-center bg-muted text-sm text-foreground-muted"
                role="img"
                aria-label="No avatar set"
              >
                No Avatar
              </div>
              )}

          {isUploading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/50"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Avatar upload progress: ${progress}%`}
            >
              <div className="text-xs text-white">{progress}%</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Desktop view */}
            {!isMobile && (
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChooseImage}
                onKeyDown={handleKeyDown}
                disabled={disabled || isUploading}
                aria-label={isUploading ? 'Upload in progress' : 'Choose avatar image'}
                aria-describedby="avatar-upload-help"
              >
                {isUploading ? 'Uploading...' : 'Choose Image'}
              </button>
            )}

            {/* Mobile view with camera option */}
            {isMobile && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowCameraOption(!showCameraOption)}
                  disabled={disabled || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Add Photo'}
                </button>
              </div>
            )}

            {!isUploading && (
              <button
                type="button"
                className="text-sm text-foreground-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRemove}
                disabled={disabled}
              >
                Remove
              </button>
            )}
          </div>

          {/* Mobile camera options */}
          {isMobile && showCameraOption && (
            <div className="flex gap-2 p-3 bg-muted rounded-lg border border-border">
              <button
                type="button"
                className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition"
                onClick={handleFileInputClick}
                disabled={disabled}
              >
                📁 From Library
              </button>
              {supportsCamera && (
                <button
                  type="button"
                  className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition"
                  onClick={handleCameraClick}
                  disabled={disabled}
                >
                  📷 Take Photo
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="text-xs text-foreground-muted underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={disabled}
          >
            {showUrlInput ? 'Hide' : 'Show'} URL Input
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        aria-label="Upload avatar image"
        aria-describedby="avatar-upload-help"
      />

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-foreground-muted">
            <span>
              {retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Uploading avatar...'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                retryCount > 0 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-amber-600">
              Network issue detected. Retrying upload...
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="space-y-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div>
            <p className="text-sm font-medium text-destructive">Upload Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>

          {/* Error-specific suggestions */}
          <div className="text-xs text-foreground-muted">
            {error.includes('Invalid file type') && (
              <p>Please use JPEG, PNG, WebP, or GIF images.</p>
            )}
            {error.includes('File too large') && (
              <p>Please choose an image smaller than 5MB.</p>
            )}
            {error.includes('Permission denied') && (
              <p>Please check your camera permissions and try again.</p>
            )}
            {error.includes('network') || error.includes('Network') || retryCount >= maxRetries ? (
              <p>Please check your internet connection and try again.</p>
            ) : null}
            {!error.includes('Permission denied') && !error.includes('Invalid file type') && !error.includes('File too large') && (
              <p>The upload failed. Please try again or choose a different image.</p>
            )}
          </div>

          {/* Recovery actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {pendingFile && (
                <button
                  type="button"
                  className="text-xs bg-destructive/20 text-destructive px-3 py-1.5 rounded hover:bg-destructive/30 transition"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              )}
              <button
                type="button"
                className="text-xs bg-muted text-foreground px-3 py-1.5 rounded hover:bg-surface transition"
                onClick={() => {
                  handleRemove()
                  clearError()
                }}
              >
                Choose Different Image
              </button>
            </div>

            {/* Fallback option for persistent errors */}
            {retryCount >= maxRetries && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="use-fallback"
                  className="rounded border-border"
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Use fallback avatar
                      import('../utils/avatarFallback').then(({ generateDefaultAvatarUrl }) => {
                        const fallbackUrl = generateDefaultAvatarUrl(userId, 'User')
                        onChange(fallbackUrl)
                        handleRemove()
                        clearError()
                      })
                    }
                  }}
                />
                <label htmlFor="use-fallback" className="text-xs text-foreground-muted">
                  Use a default avatar instead
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL Input Section */}
      {showUrlInput && (
        <div className="space-y-2">
          <label htmlFor="avatar-url" className="text-sm font-medium text-foreground">
            Avatar URL
          </label>
          <input
            id="avatar-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/avatar.jpg"
            value={value ?? ''}
            onChange={handleUrlChange}
            disabled={disabled}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-foreground-muted">
            Paste a direct image URL. Use this option for external avatars.
          </p>
        </div>
      )}

      {/* Upload Info */}
      {pendingFile != null && !isUploading && !error && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          Preview ready. Click &quot;Upload&quot; to complete the upload process.
        </p>
      )}
    </div>
  )
}
