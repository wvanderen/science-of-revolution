import { useState, useEffect } from 'react'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useToast } from '../../../components/providers/ToastProvider'
import { type Database } from '../../../lib/database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface EditDocumentModalProps {
  resourceId: string
  sections: ResourceSection[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface SectionEdit {
  id: string
  title: string
  content: string
  order: number
}

/**
 * Modal for editing document sections in markdown
 */
export function EditDocumentModal ({
  resourceId,
  sections,
  isOpen,
  onClose,
  onSave
}: EditDocumentModalProps): JSX.Element {
  const [editedSections, setEditedSections] = useState<SectionEdit[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0)
  const supabase = useSupabase()
  const { showToast } = useToast()

  // Initialize edited sections when modal opens
  useEffect(() => {
    if (isOpen && sections.length > 0) {
      const sortedSections = [...sections].sort((a, b) => a.order - b.order)
      setEditedSections(sortedSections.map(section => {
        // Use content field if available, otherwise convert from content_html to markdown
        let content = section.content
        if (content == null) {
          // Basic HTML to markdown conversion for existing content
          content = section.content_html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
            .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
            .trim()
        }

        return {
          id: section.id,
          title: section.title,
          content,
          order: section.order
        }
      }))
      setSelectedSectionIndex(0)
    }
  }, [isOpen, sections])

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    setEditedSections(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addNewSection = () => {
    const newOrder = Math.max(...editedSections.map(s => s.order), -1) + 1
    const newSection: SectionEdit = {
      id: `new-${Date.now()}`,
      title: 'New Section',
      content: '## Section Content\n\nStart writing your content here...',
      order: newOrder
    }
    setEditedSections(prev => [...prev, newSection])
    setSelectedSectionIndex(editedSections.length)
  }

  const removeSection = (index: number) => {
    if (editedSections.length <= 1) {
      showToast('Cannot remove the last section', { type: 'error' })
      return
    }
    setEditedSections(prev => prev.filter((_, i) => i !== index))
    if (selectedSectionIndex >= editedSections.length - 1) {
      setSelectedSectionIndex(Math.max(0, selectedSectionIndex - 1))
    }
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= editedSections.length) return

    setEditedSections(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(index, 1)
      updated.splice(newIndex, 0, moved)

      // Update orders
      return updated.map((section, i) => ({ ...section, order: i }))
    })

    if (selectedSectionIndex === index) {
      setSelectedSectionIndex(newIndex)
    } else if (selectedSectionIndex === newIndex) {
      setSelectedSectionIndex(index)
    }
  }

  const handleSave = async () => {
    if (editedSections.some(section => !section.title.trim())) {
      showToast('All sections must have a title', { type: 'error' })
      return
    }

    setIsSaving(true)
    try {
      // Update existing sections and create new ones
      for (const section of editedSections) {
        // Basic markdown to HTML conversion for content_html
        const contentHtml = section.content
          .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*)\*/gim, '<em>$1</em>')
          .replace(/\n\n/gim, '</p><p class="mb-4">')
          .replace(/\n/gim, '<br/>')
          .replace(/^(.*)/gim, '<p class="mb-4">$1</p>')
          .replace(/<p class="mb-4"><\/p>/gim, '') // Remove empty paragraphs

        const updateData = {
          title: section.title.trim(),
          content: section.content,
          content_html: contentHtml,
          order: section.order,
          word_count: section.content.split(/\s+/).length
        }

        if (section.id.startsWith('new-')) {
          // Create new section
          const { error } = await supabase
            .from('resource_sections')
            .insert({
              resource_id: resourceId,
              ...updateData
            })

          if (error) throw error
        } else {
          // Update existing section
          const { error } = await supabase
            .from('resource_sections')
            .update(updateData)
            .eq('id', section.id)

          if (error) throw error
        }
      }

      // Check for sections that were removed
      const existingSectionIds = sections.map(s => s.id)
      const currentSectionIds = editedSections.map(s => s.id).filter(id => !id.startsWith('new-'))
      const removedSectionIds = existingSectionIds.filter(id => !currentSectionIds.includes(id))

      if (removedSectionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('resource_sections')
          .delete()
          .in('id', removedSectionIds)

        if (deleteError) throw deleteError
      }

      showToast('Document saved successfully', { type: 'success' })
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save document:', error)
      showToast('Failed to save document', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const currentSection = editedSections[selectedSectionIndex]
  const wordCount = currentSection?.content.split(/\s+/).filter(word => word.length > 0).length ?? 0

  if (!isOpen || editedSections.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-serif">Edit Document</h2>
            <p className="text-sm text-foreground-muted mt-1">
              {editedSections.length} section{editedSections.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-surface rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-foreground-muted hover:text-foreground transition-colors"
              disabled={isSaving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Section sidebar */}
          <div className="w-64 border-r border-border bg-surface overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Sections</h3>
                <button
                  onClick={addNewSection}
                  className="text-xs btn btn-secondary py-1 px-2"
                  title="Add new section"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {editedSections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`group rounded-md cursor-pointer transition-colors ${
                      selectedSectionIndex === index
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-surface/80 text-foreground'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedSectionIndex(index)}
                      className="flex items-center gap-2 p-2"
                    >
                      <span className="text-xs font-medium">{index + 1}</span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSectionChange(index, 'title', e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 bg-transparent border-none outline-none text-sm ${
                          selectedSectionIndex === index
                            ? 'placeholder-primary-foreground/70'
                            : 'placeholder-foreground-muted'
                        }`}
                        placeholder="Section title"
                      />
                    </div>

                    {editedSections.length > 1 && (
                      <div className="flex items-center gap-1 px-2 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            moveSection(index, 'up')
                          }}
                          disabled={index === 0}
                          className="p-1 hover:bg-surface rounded transition-colors disabled:opacity-50"
                          title="Move up"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            moveSection(index, 'down')
                          }}
                          disabled={index === editedSections.length - 1}
                          className="p-1 hover:bg-surface rounded transition-colors disabled:opacity-50"
                          title="Move down"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSection(index)
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                          title="Remove section"
                        >
                          <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor/Preview area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentSection && (
              <>
                {/* Editor/Preview toolbar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-foreground-muted">
                      {wordCount} words
                    </span>
                    {activeTab === 'edit' && (
                      <span className="text-xs text-foreground-muted">
                        Markdown format
                      </span>
                    )}
                  </div>
                </div>

                {/* Editor/Preview content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'edit' ? (
                    <textarea
                      value={currentSection.content}
                      onChange={(e) => handleSectionChange(selectedSectionIndex, 'content', e.target.value)}
                      className="w-full h-full p-6 bg-background border-none outline-none resize-none font-mono text-sm leading-relaxed"
                      placeholder="Write your markdown content here..."
                    />
                  ) : (
                    <div className="w-full h-full p-6 overflow-y-auto bg-background">
                      <div className="max-w-4xl mx-auto">
                        {/* Basic markdown preview - could be enhanced with a proper markdown parser */}
                        <div
                          className="prose prose-lg max-w-none dark:prose-invert font-serif"
                          dangerouslySetInnerHTML={{
                            __html: currentSection.content
                              .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                              .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
                              .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')
                              .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                              .replace(/\*(.*)\*/gim, '<em>$1</em>')
                              .replace(/\n\n/gim, '</p><p class="mb-4">')
                              .replace(/\n/gim, '<br/>')
                              .replace(/^(.*)/gim, '<p class="mb-4">$1</p>')
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-surface">
          <div className="text-sm text-foreground-muted">
            {isSaving ? 'Saving...' : 'Changes are not saved until you click Save'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}