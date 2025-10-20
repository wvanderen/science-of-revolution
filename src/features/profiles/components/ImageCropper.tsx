import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Detect if device is mobile
 */
function isMobileDevice(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * Get touch position relative to element
 */
function getTouchPosition(touch: Touch, element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  }
}

interface ImageCropperProps {
  imageFile: File
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
  aspectRatio?: number
  cropSize?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export function ImageCropper ({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropSize = 256
}: ImageCropperProps): JSX.Element {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: cropSize,
    height: cropSize,
    scale: 1
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const isMobile = isMobileDevice()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load image when component mounts
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Initialize crop area to center of image
      const scale = Math.min(cropSize / img.width, cropSize / img.height)
      setCropArea(prev => ({
        ...prev,
        x: (img.width * scale - cropSize) / 2,
        y: (img.height * scale - cropSize) / 2,
        scale
      }))
    }
    img.src = URL.createObjectURL(imageFile)

    return () => {
      URL.revokeObjectURL(img.src)
    }
  }, [imageFile, cropSize])

  // Draw cropped preview
  const drawCroppedImage = useCallback(() => {
    if (!image || !canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = cropSize
    canvas.height = cropSize

    // Calculate source coordinates
    const sourceX = cropArea.x / cropArea.scale
    const sourceY = cropArea.y / cropArea.scale
    const sourceSize = cropSize / cropArea.scale

    // Draw cropped image
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, cropSize, cropSize
    )
  }, [image, cropArea, cropSize])

  useEffect(() => {
    drawCroppedImage()
  }, [drawCroppedImage])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - cropArea.x, y: touch.clientY - cropArea.y })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageRef.current) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Get bounds
    const imgRect = imageRef.current.getBoundingClientRect()
    const maxX = imgRect.width - cropArea.width
    const maxY = imgRect.height - cropArea.height

    // Constrain to bounds
    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))

    setCropArea(prev => ({ ...prev, x: constrainedX, y: constrainedY }))
  }, [isDragging, dragStart, cropArea.width, cropArea.height])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !imageRef.current) return

    e.preventDefault()
    const touch = e.touches[0]

    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Get bounds
    const imgRect = imageRef.current.getBoundingClientRect()
    const maxX = imgRect.width - cropArea.width
    const maxY = imgRect.height - cropArea.height

    // Constrain to bounds
    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))

    setCropArea(prev => ({ ...prev, x: constrainedX, y: constrainedY }))
  }, [isDragging, dragStart, cropArea.width, cropArea.height])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  const handleZoom = (delta: number) => {
    setCropArea(prev => {
      const newScale = Math.max(0.5, Math.min(3, prev.scale + delta))
      return { ...prev, scale: newScale }
    })
  }

  const handleCrop = async () => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob((blob) => {
      if (!blob) return

      const croppedFile = new File([blob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      onCropComplete(croppedFile)
    }, 'image/jpeg', 0.9)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta)
  }

  if (!image) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-foreground-muted">Loading image...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Crop Your Avatar</h3>
        <p className="text-sm text-foreground-muted">
          Adjust the crop area and zoom to get the perfect avatar
        </p>
      </div>

      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border-2 border-border bg-muted"
          style={{ width: cropSize, height: cropSize }}
        >
          {/* Scaled image */}
          <div
            ref={imageRef}
            className="absolute"
            style={{
              width: image.width * cropArea.scale,
              height: image.height * cropArea.scale,
              transform: `translate(${-cropArea.x}px, ${-cropArea.y}px)`,
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none' // Prevent default touch behaviors
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
          >
            <img
              src={image.src}
              alt="Crop preview"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Crop overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-primary shadow-lg" />
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="space-y-2">
          <p className="text-sm text-foreground-muted text-center">Preview</p>
          <canvas
            ref={canvasRef}
            className="rounded-full border-2 border-border"
            width={cropSize}
            height={cropSize}
          />
        </div>
      </div>

      {/* Controls */}
      <div className={`flex justify-center gap-2 ${isMobile ? 'gap-3' : 'gap-2'}`}>
        <button
          type="button"
          className={`rounded-md border border-border font-medium text-foreground hover:bg-surface transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
          }`}
          onClick={() => handleZoom(-0.1)}
          disabled={cropArea.scale <= 0.5}
        >
          {isMobile ? '➖' : 'Zoom Out'}
        </button>
        <span className={`flex items-center text-foreground-muted ${
          isMobile ? 'px-4 text-base font-medium' : 'px-3 text-sm'
        }`}>
          {Math.round(cropArea.scale * 100)}%
        </span>
        <button
          type="button"
          className={`rounded-md border border-border font-medium text-foreground hover:bg-surface transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
          }`}
          onClick={() => handleZoom(0.1)}
          disabled={cropArea.scale >= 3}
        >
          {isMobile ? '➕' : 'Zoom In'}
        </button>
      </div>

      {/* Actions */}
      <div className={`flex justify-center ${isMobile ? 'flex-col gap-3' : 'gap-3'}`}>
        <button
          type="button"
          className={`rounded-md border border-border font-medium text-foreground hover:bg-surface transition ${
            isMobile ? 'px-6 py-4 text-base' : 'px-4 py-2 text-sm'
          }`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`rounded-md bg-primary font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${
            isMobile ? 'px-6 py-4 text-base' : 'px-4 py-2 text-sm'
          }`}
          onClick={handleCrop}
        >
          Apply Crop
        </button>
      </div>

      <div className="text-center">
        <p className={`text-foreground-muted ${isMobile ? 'text-sm' : 'text-xs'}`}>
          {isMobile
            ? 'Touch and drag to move the image. Use the + and − buttons to zoom.'
            : 'Drag to move the image, scroll to zoom, or use the zoom controls'
          }
        </p>
      </div>
    </div>
  )
}