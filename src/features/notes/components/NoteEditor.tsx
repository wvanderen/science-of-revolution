import { useState, useEffect } from 'react'
import { useNote, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes'
import { useToast } from '../../../components/providers/ToastProvider'

interface NoteEditorProps {
  highlightId: string
  onClose?: () => void
}

/**
 * Note editor for adding/editing notes on highlights
 */
export function NoteEditor ({ highlightId, onClose }: NoteEditorProps): JSX.Element {
  const { data: existingNote, isLoading } = useNote(highlightId)
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { showToast } = useToast()

  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load existing note content
  useEffect(() => {
    if (existingNote?.content != null) {
      setContent(existingNote.content)
    }
  }, [existingNote])

  const handleSave = async (): Promise<void> => {
    if (content.trim().length === 0) return

    setIsSaving(true)
    try {
      if (existingNote != null) {
        await updateNote.mutateAsync({ id: existingNote.id, content })
        showToast('Note updated', { type: 'success' })
      } else {
        await createNote.mutateAsync({ highlight_id: highlightId, content })
        showToast('Note added', { type: 'success' })
      }
      onClose?.()
    } catch (error) {
      console.error('Failed to save note:', error)
      showToast('Failed to save note', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    const isConfirmShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Enter'
    if (!isConfirmShortcut) return

    event.preventDefault()
    if (isSaving || content.trim().length === 0) return

    void handleSave()
  }

  const handleDelete = async (): Promise<void> => {
    if (existingNote == null) return

    if (!window.confirm('Delete this note?')) return

    setIsSaving(true)
    try {
      await deleteNote.mutateAsync(existingNote.id)
      setContent('')
      showToast('Note deleted', { type: 'success' })
      onClose?.()
    } catch (error) {
      console.error('Failed to delete note:', error)
      showToast('Failed to delete note', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-foreground-muted">Loading note...</div>
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="note-content" className="block text-sm font-medium text-foreground mb-1">
          Note {existingNote != null && '(Markdown supported)'}
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => { setContent(e.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="Add your thoughts about this highlight..."
          className="input w-full min-h-32 font-mono text-sm"
          disabled={isSaving}
        />
      </div>

      <div className="flex gap-2 justify-between">
        <div>
          {existingNote != null && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="btn btn-secondary text-sm py-1 px-3 text-error"
            >
              Delete Note
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {onClose != null && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-secondary text-sm py-1 px-3"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || content.trim().length === 0}
            className="btn btn-primary text-sm py-1 px-3"
          >
            {isSaving ? 'Saving...' : existingNote != null ? 'Update' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
