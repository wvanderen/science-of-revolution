import supabase from '../../../lib/supabaseClient'

export interface ProcessedImage {
  size: 'small' | 'medium' | 'large'
  width: number
  height: number
  file: File
  url: string
}

export interface AvatarUploadOptions {
  userId: string
  file: File
  onProgress?: (progress: number) => void
}

export interface AvatarUploadResult {
  urls: {
    small: string
    medium: string
    large: string
    original: string
  }
  sizes: {
    small: { width: number; height: number; fileSize: number }
    medium: { width: number; height: number; fileSize: number }
    large: { width: number; height: number; fileSize: number }
  }
}

export class AvatarService {
  private static readonly AVATAR_BUCKET = 'avatars'
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly AVATAR_SIZES = [
    { name: 'small' as const, width: 64, height: 64 },
    { name: 'medium' as const, width: 128, height: 128 },
    { name: 'large' as const, width: 256, height: 256 }
  ]

  /**
   * Validate file type and size
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Supported formats: JPEG, PNG, WebP, GIF`
      }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    }

    return { isValid: true }
  }

  /**
   * Generate unique filename to prevent conflicts
   */
  static generateFileName(userId: string, originalName: string, size?: string): string {
    const hasExtension = originalName.includes('.')
    const fileExt = hasExtension ? originalName.split('.').pop()! : 'jpg'
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sizePrefix = size || 'original'

    return `${userId}/${sizePrefix}_${timestamp}_${randomSuffix}.${fileExt}`
  }

  /**
   * Compress image to target dimensions using enhanced compression utility
   */
  static async compressImage(
    file: File,
    targetWidth: number,
    _targetHeight: number
  ): Promise<File> {
    // Import the enhanced compression utility
    const { createSquareCrop } = await import('../utils/imageCompression')
    return createSquareCrop(file, targetWidth, 0.85)
  }

  /**
   * Process image into multiple sizes with device optimization
   */
  static async processImage(file: File): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = []

    for (const size of this.AVATAR_SIZES) {
      try {
        // Use enhanced compression with device context detection
        const _quality = size.name === 'small' ? 0.7 :
                         size.name === 'medium' ? 0.85 : 0.9

        const compressedFile = await this.compressImage(file, size.width, size.height)
        const url = URL.createObjectURL(compressedFile)

        processedImages.push({
          size: size.name,
          width: size.width,
          height: size.height,
          file: compressedFile,
          url
        })
      } catch (error) {
        console.error(`Failed to process ${size.name} size:`, error)
        throw new Error(`Failed to process image for ${size.name} size`)
      }
    }

    return processedImages
  }

  /**
   * Upload single file to Supabase Storage
   */
  private static async uploadFile(
    fileName: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Simulate progress for better UX
      if (onProgress) {
        const progressInterval = setInterval(() => {
          onProgress(Math.random() * 80) // Random progress up to 80%
        }, 100)

        // Upload the file
        const { data: _data, error } = await supabase.storage
          .from(this.AVATAR_BUCKET)
          .upload(fileName, file, {
            cacheControl: '31536000', // 1 year
            upsert: false
          })

        clearInterval(progressInterval)

        if (error) {
          throw new Error(`Upload failed: ${error.message}`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(this.AVATAR_BUCKET)
          .getPublicUrl(fileName)

        onProgress(100) // Complete
        return publicUrlData.publicUrl
      } else {
        // Upload without progress tracking
        const { data: _data, error } = await supabase.storage
          .from(this.AVATAR_BUCKET)
          .upload(fileName, file, {
            cacheControl: '31536000', // 1 year
            upsert: false
          })

        if (error) {
          throw new Error(`Upload failed: ${error.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.AVATAR_BUCKET)
          .getPublicUrl(fileName)

        return publicUrlData.publicUrl
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload processed images to Supabase Storage
   */
  static async uploadAvatar(
    options: AvatarUploadOptions
  ): Promise<AvatarUploadResult> {
    const { userId, file, onProgress } = options

    // Validate file
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    try {
      // Process image into multiple sizes
      const processedImages = await this.processImage(file)

      // Upload all sizes
      const uploadPromises = processedImages.map(async (processed) => {
        const fileName = this.generateFileName(userId, file.name, processed.size)
        const publicUrl = await this.uploadFile(fileName, processed.file, onProgress)

        return {
          size: processed.size,
          url: publicUrl,
          dimensions: { width: processed.width, height: processed.height },
          fileSize: processed.file.size
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)

      // Also upload original image
      const originalFileName = this.generateFileName(userId, file.name, 'original')
      const originalUrl = await this.uploadFile(originalFileName, file)

      // Result mapping
      const urls = {
        small: '',
        medium: '',
        large: '',
        original: originalUrl
      }

      const sizes = {
        small: { width: 0, height: 0, fileSize: 0 },
        medium: { width: 0, height: 0, fileSize: 0 },
        large: { width: 0, height: 0, fileSize: 0 }
      }

      // Map results
      uploadedImages.forEach((uploaded) => {
        urls[uploaded.size] = uploaded.url
        sizes[uploaded.size] = {
          width: uploaded.dimensions.width,
          height: uploaded.dimensions.height,
          fileSize: uploaded.fileSize
        }
      })

      // Cleanup object URLs
      processedImages.forEach(img => URL.revokeObjectURL(img.url))

      return { urls, sizes }
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete avatar files from storage
   */
  static async deleteAvatar(userId: string, fileName: string): Promise<void> {
    try {
      // Delete all size variants of the avatar
      const sizes = ['small', 'medium', 'large', 'original']
      const deletePromises = sizes.map(size => {
        const sizedFileName = fileName.replace(/(\w+)_/, `${size}_`)
        return supabase.storage
          .from(this.AVATAR_BUCKET)
          .remove([`${userId}/${sizedFileName}`])
      })

      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      throw new Error('Failed to delete avatar files')
    }
  }
}