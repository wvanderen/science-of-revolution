import { useEffect, useMemo, useRef, useState } from 'react'

interface AvatarUploadProps {
  value: string | null
  onChange: (value: string | null) => void
}

interface PendingFilePreview {
  url: string
  file: File
}

/**
 * Lightweight avatar uploader placeholder.
 * Accepts direct image URLs today while exposing a file picker for future upload integration.
 */
export function AvatarUpload ({ value, onChange }: AvatarUploadProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingFile, setPendingFile] = useState<PendingFilePreview | null>(null)

  useEffect(() => {
    return () => {
      if (pendingFile?.url != null) {
        URL.revokeObjectURL(pendingFile.url)
      }
    }
  }, [pendingFile])

  const previewSrc = useMemo(() => {
    if (pendingFile?.url != null) return pendingFile.url
    return value ?? undefined
  }, [pendingFile, value])

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.trim()
    onChange(nextValue.length === 0 ? null : nextValue)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file == null) return

    if (pendingFile?.url != null) {
      URL.revokeObjectURL(pendingFile.url)
    }

    const url = URL.createObjectURL(file)
    setPendingFile({ url, file })
  }

  const handleRemove = () => {
    if (pendingFile?.url != null) {
      URL.revokeObjectURL(pendingFile.url)
    }
    setPendingFile(null)
    onChange(null)
    if (fileInputRef.current != null) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-background">
          {previewSrc != null
            ? (
              <img
                src={previewSrc}
                alt="Profile avatar preview"
                className="h-full w-full object-cover"
              />
              )
            : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-foreground-muted">
                No Avatar
              </div>
              )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition"
            onClick={() => { fileInputRef.current?.click() }}
          >
            Choose Image
          </button>
          <button
            type="button"
            className="text-sm text-foreground-muted underline underline-offset-2 hover:text-foreground"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-2">
        <label htmlFor="avatar-url" className="text-sm font-medium text-foreground">
          Avatar URL
        </label>
        <input
          id="avatar-url"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={value ?? ''}
          onChange={handleUrlChange}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-foreground-muted">
          Upload support arrives with Story 2.3. For now, paste an accessible image URL or keep the default placeholder.
        </p>
        {pendingFile != null && (
          <p className="text-xs text-amber-500">
            Local preview only. The selected file is not uploaded yet.
          </p>
        )}
      </div>
    </div>
  )
}
