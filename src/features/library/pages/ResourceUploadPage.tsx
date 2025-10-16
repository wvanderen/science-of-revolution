import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseContentToSections, detectAndConvertHeaders, type ParsedSection } from '../utils/contentIngestion'
import { useIngestResource } from '../hooks/useIngestResource'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProfile } from '../../../hooks/useProfile'

interface UploadFormState {
  title: string
  author: string
  sourceUrl: string
  sequenceOrder: string
  format: 'auto' | 'markdown' | 'html'
  type: 'document' | 'audio' | 'video'
}

const INITIAL_STATE: UploadFormState = {
  title: '',
  author: '',
  sourceUrl: '',
  sequenceOrder: '',
  format: 'auto',
  type: 'document'
}

function slugify (value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}


function getFileMeta (
  format: 'auto' | 'markdown' | 'html',
  file?: File | null
): { extension: string, mimeType: string } {
  if (file != null) {
    const nameParts = file.name.split('.')
    const extension = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : 'txt'
    const mimeType = file.type || 'text/plain'
    return { extension, mimeType }
  }

  if (format === 'markdown') {
    return { extension: 'md', mimeType: 'text/markdown' }
  }

  if (format === 'html') {
    return { extension: 'html', mimeType: 'text/html' }
  }

  return { extension: 'txt', mimeType: 'text/plain' }
}

/**
 * Upload page for facilitators to ingest new reading resources
 */
export function ResourceUploadPage (): JSX.Element {
  const [form, setForm] = useState<UploadFormState>(INITIAL_STATE)
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState<ParsedSection[]>([])
  const [previewGenerated, setPreviewGenerated] = useState(false)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFetchingArticle, setIsFetchingArticle] = useState(false)

  const ingestResource = useIngestResource()
  const supabase = useSupabase()
  const { showToast } = useToast()
  const { data: _profile, isLoading: profileLoading, isFacilitator } = useProfile()
  const navigate = useNavigate()

  const totalWordCount = useMemo(() => {
    return preview.reduce((sum, section) => sum + (section.word_count ?? 0), 0)
  }, [preview])

  const sectionCount = preview.length

  const handleInputChange = (field: keyof UploadFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value)
    setPreviewGenerated(false)
  }

  const fetchReadableContent = async (): Promise<void> => {
    if (form.sourceUrl.trim().length === 0) {
      showToast('Enter a URL to fetch', { type: 'error' })
      return
    }

    try {
      setIsFetchingArticle(true)
      const normalizedUrl = form.sourceUrl.trim()
      const proxiedUrl = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')
        ? `https://r.jina.ai/${normalizedUrl}`
        : `https://r.jina.ai/https://${normalizedUrl}`

      const response = await fetch(proxiedUrl)
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`)
      }

      const articleText = await response.text()
      if (articleText.trim().length === 0) {
        showToast('Fetched content was empty. Paste the article manually instead.', { type: 'info' })
        return
      }

      // Apply header detection and conversion
      const textWithHeaders = detectAndConvertHeaders(articleText)

      const markdown = textWithHeaders
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')

      setContent(markdown)
      setPreviewGenerated(false)
      setForm(prev => ({ ...prev, format: 'markdown' }))
      showToast('Article content fetched with automatic header detection. Review before uploading.', { type: 'success' })
    } catch (error) {
      console.error('Failed to fetch article', error)
      showToast('Could not fetch article automatically. Paste content manually instead.', { type: 'error' })
    } finally {
      setIsFetchingArticle(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file == null) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', { type: 'error' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setContent(text)
      setSourceFile(file)
      setPreviewGenerated(false)
      // Auto-set format from extension if we can infer it
      if (file.name.endsWith('.md')) {
        setForm(prev => ({ ...prev, format: 'markdown' }))
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        setForm(prev => ({ ...prev, format: 'html' }))
      }
    }
    reader.readAsText(file)
  }

  const handleGeneratePreview = () => {
    if (content.trim().length === 0) {
      showToast('Add content before generating a preview', { type: 'error' })
      return
    }

    try {
      const parsed = parseContentToSections(content, form.format)
      setPreview(parsed)
      setPreviewGenerated(true)
      if (parsed.length === 0) {
        showToast('No sections detected. Ensure headings are present or switch format.', { type: 'info' })
      } else {
        showToast(`Preview ready with ${parsed.length} section${parsed.length === 1 ? '' : 's'}`, { type: 'success' })
      }
    } catch (error) {
      console.error('Preview generation failed', error)
      showToast('Failed to generate preview. Check content format.', { type: 'error' })
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isFacilitator) {
      showToast('Facilitator access required', { type: 'error' })
      return
    }

    if (form.title.trim().length === 0) {
      showToast('Title is required', { type: 'error' })
      return
    }

    if (content.trim().length === 0) {
      showToast('Content is required', { type: 'error' })
      return
    }

    if (!previewGenerated) {
      const confirmWithoutPreview = window.confirm('Preview has not been generated. Continue anyway?')
      if (!confirmWithoutPreview) return
    }

    try {
      setIsUploading(true)

      const { extension, mimeType } = getFileMeta(form.format, sourceFile)

      const slug = slugify(form.title) || `resource-${Date.now()}`
      const filePath = `resources/${slug}-${Date.now()}.${extension}`

      const blob = new Blob([content], { type: mimeType })
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, blob, { upsert: false })

      if (uploadError != null) {
        console.error('Storage upload failed', uploadError)
        if (typeof uploadError === 'object' && uploadError != null && 'message' in uploadError && (uploadError as { message?: string }).message?.includes('Bucket not found')) {
          showToast('Resources bucket missing. Run `supabase db reset` to apply storage migrations.', { type: 'error' })
        } else {
          showToast('Failed to upload source file', { type: 'error' })
        }
        return
      }

      const sequenceOrder = form.sequenceOrder.trim().length > 0 ? Number(form.sequenceOrder) : null

      const result = await ingestResource.mutateAsync({
        resource: {
          title: form.title.trim(),
          author: form.author.trim().length > 0 ? form.author.trim() : null,
          type: form.type,
          source_url: form.sourceUrl.trim().length > 0 ? form.sourceUrl.trim() : null,
          storage_path: filePath,
          sequence_order: sequenceOrder
        },
        content,
        format: form.format
      })

      showToast(`Resource uploaded with ${result.sectionsCreated} section${result.sectionsCreated === 1 ? '' : 's'}`, { type: 'success' })

      // Reset form
      setForm(INITIAL_STATE)
      setContent('')
      setPreview([])
      setPreviewGenerated(false)
      setSourceFile(null)

      navigate('/library')
    } catch (error) {
      console.error('Resource upload failed', error)
      showToast('Failed to ingest resource. Check console for details.', { type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <p className="text-foreground-muted">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!isFacilitator) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-4">Restricted Access</h1>
          <p className="text-foreground-muted">You need facilitator permissions to upload new resources.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <button
            onClick={() => { navigate(-1) }}
            className="btn btn-secondary text-sm py-1 px-3"
          >
            ← Back
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold font-serif mb-2">Upload New Resource</h1>
          <p className="text-foreground-muted">
            Upload source content, preview generated sections, and ingest into the library.
          </p>
        </header>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="card space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Metadata</h2>
              <p className="text-sm text-foreground-muted">Describe this resource for readers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input
                  id="title"
                  className="input"
                  value={form.title}
                  onChange={handleInputChange('title')}
                  required
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-foreground mb-1">Author</label>
                <input
                  id="author"
                  className="input"
                  value={form.author}
                  onChange={handleInputChange('author')}
                  placeholder="Karl Marx, Friedrich Engels"
                />
              </div>

              <div>
                <label htmlFor="sourceUrl" className="block text-sm font-medium text-foreground mb-1">Source URL</label>
                <div className="flex gap-2">
                  <input
                    id="sourceUrl"
                    className="input flex-1"
                    value={form.sourceUrl}
                    onChange={handleInputChange('sourceUrl')}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary text-sm py-1 px-3 whitespace-nowrap"
                    onClick={() => { void fetchReadableContent() }}
                    disabled={isFetchingArticle}
                  >
                    {isFetchingArticle ? 'Fetching…' : 'Fetch'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  Attempts to scrape article text into markdown using a readability proxy.
                </p>
              </div>

              <div>
                <label htmlFor="sequenceOrder" className="block text-sm font-medium text-foreground mb-1">Sequence Order</label>
                <input
                  id="sequenceOrder"
                  type="number"
                  className="input"
                  value={form.sequenceOrder}
                  onChange={handleInputChange('sequenceOrder')}
                  min={0}
                  placeholder="Optional ordering"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">Resource Type</label>
                <select
                  id="type"
                  className="input"
                  value={form.type}
                  onChange={handleInputChange('type')}
                >
                  <option value="document">Document</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label htmlFor="format" className="block text-sm font-medium text-foreground mb-1">Content Format</label>
                <select
                  id="format"
                  className="input"
                  value={form.format}
                  onChange={handleInputChange('format')}
                >
                  <option value="auto">Detect automatically</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </div>
            </div>
          </section>

          <section className="card space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Source Content</h2>
              <p className="text-sm text-foreground-muted">Upload a file or paste the full content below.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Upload File</label>
              <input
                type="file"
                accept=".md,.markdown,.txt,.html,.htm"
                onChange={handleFileChange}
                className="text-sm text-foreground"
              />
              <p className="text-xs text-foreground-muted">
                Supports markdown or HTML up to 5MB. Uploading will populate the editor below.
              </p>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">Content *</label>
              <textarea
                id="content"
                className="input font-mono text-sm min-h-[320px]"
                value={content}
                onChange={handleContentChange}
                placeholder="# Heading\nYour content goes here..."
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary text-sm py-1 px-3"
                onClick={handleGeneratePreview}
                disabled={content.trim().length === 0}
              >
                Generate Preview
              </button>
              {previewGenerated && (
                <span className="text-sm text-foreground-muted">
                  Preview generated {sectionCount > 0 ? `(${sectionCount} section${sectionCount === 1 ? '' : 's'}, ${totalWordCount} words)` : ''}
                </span>
              )}
            </div>
          </section>

          <section className="card space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-xl font-semibold">Preview</h2>
                <p className="text-sm text-foreground-muted">Parsed sections based on current content.</p>
              </div>
              <div className="text-sm text-foreground-muted">
                {sectionCount > 0
                  ? `${sectionCount} section${sectionCount === 1 ? '' : 's'} · ${totalWordCount} words`
                  : 'No sections generated yet'}
              </div>
            </div>

            {sectionCount === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-foreground-muted">
                Generate a preview to see how the content will be split into sections.
              </div>
            ) : (
              <div className="space-y-4">
                {preview.map((section) => (
                  <div key={section.order} className="rounded-md border border-border bg-background px-4 py-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {section.order + 1}. {section.title || 'Untitled section'}
                      </h3>
                      <span className="text-xs text-foreground-muted">
                        {section.word_count} words
                      </span>
                    </div>
                    <div className="prose prose-sm prose-slate dark:prose-invert mt-2 max-w-none max-h-48 overflow-hidden">
                      <div dangerouslySetInnerHTML={{ __html: section.content_html }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-secondary text-sm py-1 px-3"
              onClick={() => {
                setForm(INITIAL_STATE)
                setContent('')
                setPreview([])
                setPreviewGenerated(false)
                setSourceFile(null)
              }}
              disabled={isUploading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary text-sm py-1 px-4"
              disabled={isUploading || ingestResource.status === 'pending'}
            >
              {isUploading || ingestResource.status === 'pending' ? 'Uploading…' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
