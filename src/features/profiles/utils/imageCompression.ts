export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  deviceContext?: 'mobile' | 'desktop' | 'auto'
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  dimensions: { width: number; height: number }
}

/**
 * Detect device context for optimization
 */
function detectDeviceContext(): 'mobile' | 'desktop' {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

/**
 * Get optimal compression settings for device context
 */
function getOptimalSettings(context: 'mobile' | 'desktop', baseQuality: number): { quality: number; format: 'jpeg' | 'webp' } {
  if (context === 'mobile') {
    // Lower quality for mobile to save bandwidth
    return {
      quality: Math.min(baseQuality, 0.75),
      format: 'webp' // Prefer WebP for mobile
    }
  } else {
    // Higher quality for desktop
    return {
      quality: baseQuality,
      format: 'jpeg' // Fallback to JPEG for compatibility
    }
  }
}

/**
 * Check WebP support
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Compress an image file with specified options
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format,
    deviceContext = 'auto'
  } = options

  // Detect device context if auto
  const context = deviceContext === 'auto' ? detectDeviceContext() : deviceContext

  // Get optimal settings
  const optimalSettings = getOptimalSettings(context, quality)

  // Determine final format
  const finalFormat = format ||
    (supportsWebP() && optimalSettings.format === 'webp' ? 'webp' : 'jpeg')

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    const img = new Image()
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height

          if (width > height) {
            width = Math.min(width, maxWidth)
            height = width / aspectRatio
          } else {
            height = Math.min(height, maxHeight)
            width = height * aspectRatio
          }
        }

        // Ensure dimensions are integers
        width = Math.round(width)
        height = Math.round(height)

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression
        const mimeType = finalFormat === 'png' ? 'image/png' :
                       finalFormat === 'webp' ? 'image/webp' : 'image/jpeg'

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            })

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: file.size / compressedFile.size,
              dimensions: { width, height }
            })
          },
          mimeType,
          optimalSettings.quality
        )
      } catch (error) {
        reject(new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create a square crop of an image
 */
export async function createSquareCrop(
  file: File,
  targetSize: number,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    const img = new Image()
    img.onload = () => {
      try {
        // Set canvas to square dimensions
        canvas.width = targetSize
        canvas.height = targetSize

        // Calculate crop area (center crop)
        const sourceSize = Math.min(img.width, img.height)
        const sourceX = (img.width - sourceSize) / 2
        const sourceY = (img.height - sourceSize) / 2

        // Draw cropped image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,
          0, 0, targetSize, targetSize
        )

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create square crop'))
              return
            }

            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            resolve(croppedFile)
          },
          'image/jpeg',
          quality
        )
      } catch (error) {
        reject(new Error(`Square crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    img.onerror = () => reject(new Error('Failed to load image for cropping'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Process image for avatar use (multiple sizes) with device optimization
 */
export async function processAvatarImage(
  file: File,
  deviceContext: 'mobile' | 'desktop' | 'auto' = 'auto'
): Promise<{ small: File; medium: File; large: File }> {
  const context = deviceContext === 'auto' ? detectDeviceContext() : deviceContext
  const optimalSettings = getOptimalSettings(context, 0.85)

  // Different quality levels for different sizes
  const smallQuality = Math.min(optimalSettings.quality, 0.7) // Lower quality for small
  const mediumQuality = optimalSettings.quality // Standard quality
  const largeQuality = Math.min(optimalSettings.quality, 0.9) // Higher quality for large

  const [small, medium, large] = await Promise.all([
    createSquareCrop(file, 64, smallQuality),
    createSquareCrop(file, 128, mediumQuality),
    createSquareCrop(file, 256, largeQuality)
  ])

  return { small, medium, large }
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}