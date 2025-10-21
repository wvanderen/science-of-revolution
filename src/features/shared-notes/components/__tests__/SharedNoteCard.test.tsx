import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SharedNoteCard } from '../SharedNoteCard'
import { type SharedNote } from '../../types'

const mockNote: SharedNote = {
  id: '1',
  user_id: 'user1',
  resource_section_id: 'section1',
  cohort_id: 'cohort1',
  start_pos: 0,
  end_pos: 50,
  text_content: 'This is a shared highlight with some content that is reasonably long',
  color: '#fbbf24',
  visibility: 'cohort',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  author_name: 'John Doe',
  author_avatar: 'https://example.com/avatar.jpg',
  cohort_name: 'Study Group 1',
  note_content: 'This is a note about the highlighted text',
  is_author: false
}

describe('SharedNoteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render note information correctly', () => {
    render(<SharedNoteCard note={mockNote} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('This is a shared highlight with some content that is reasonably long')).toBeInTheDocument()
    expect(screen.getByText('This is a note about the highlighted text')).toBeInTheDocument()
    expect(screen.getByText('Study Group 1')).toBeInTheDocument()
  })

  it('should display relative time correctly', () => {
    // Create a note with recent timestamp
    const recentNote = {
      ...mockNote,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    }

    render(<SharedNoteCard note={recentNote} />)

    expect(screen.getByText('30m ago')).toBeInTheDocument()
  })

  it('should show "You" badge for author\'s own notes', () => {
    const authorNote = { ...mockNote, is_author: true }

    render(<SharedNoteCard note={authorNote} />)

    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('should display "Public" badge for global notes', () => {
    const globalNote = { ...mockNote, visibility: 'global' as const, cohort_name: null }

    render(<SharedNoteCard note={globalNote} />)

    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('should display cohort name for cohort notes', () => {
    render(<SharedNoteCard note={mockNote} />)

    expect(screen.getByText('Study Group 1')).toBeInTheDocument()
  })

  it('should handle missing avatar', () => {
    const noteWithoutAvatar = { ...mockNote, author_avatar: null }

    render(<SharedNoteCard note={noteWithoutAvatar} />)

    // Should show initial instead of avatar
    const avatarPlaceholder = screen.getByText('J') // First letter of "John"
    expect(avatarPlaceholder).toBeInTheDocument()
    expect(avatarPlaceholder.closest('div')).toHaveClass('rounded-full', 'bg-gray-300')
  })

  it('should handle missing author name', () => {
    const noteWithoutAuthor = { ...mockNote, author_name: null }

    render(<SharedNoteCard note={noteWithoutAuthor} />)

    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const mockOnClick = vi.fn()

    render(<SharedNoteCard note={mockNote} onClick={mockOnClick} />)

    const card = screen.getByRole('button') // The entire card should be clickable
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith(mockNote)
  })

  it('should call onHighlightClick when highlight area is clicked', () => {
    const mockOnHighlightClick = vi.fn()

    render(<SharedNoteCard note={mockNote} onHighlightClick={mockOnHighlightClick} />)

    const highlightButton = screen.getByTitle('Click to highlight in text')
    fireEvent.click(highlightButton)

    expect(mockOnHighlightClick).toHaveBeenCalledWith(mockNote)
  })

  it('should truncate long highlight text', () => {
    const longNote = {
      ...mockNote,
      text_content: 'This is a very long highlight that should be truncated when displayed in the card because it exceeds the maximum length allowed for proper display and user experience.'
    }

    render(<SharedNoteCard note={longNote} />)

    // Check if text is truncated (line-clamp-3 class should be applied)
    const highlightText = screen.getByText(/This is a very long highlight/)
    expect(highlightText).toHaveClass('line-clamp-3')
  })

  it('should display correct visibility styling for global notes', () => {
    const globalNote = { ...mockNote, visibility: 'global' as const }

    render(<SharedNoteCard note={globalNote} />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass('border-green-200', 'bg-green-50')
  })

  it('should display correct visibility styling for cohort notes', () => {
    render(<SharedNoteCard note={mockNote} />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass('border-blue-200', 'bg-blue-50')
  })

  it('should apply custom highlight color', () => {
    const noteWithColor = { ...mockNote, color: '#ff6b6b' }

    render(<SharedNoteCard note={noteWithColor} />)

    const highlightArea = screen.getByTitle('Click to highlight in text').closest('div')
    expect(highlightArea).toHaveStyle({
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      borderLeftColor: '#ff6b6b'
    })
  })

  it('should handle missing note content', () => {
    const noteWithoutContent = { ...mockNote, note_content: null }

    render(<SharedNoteCard note={noteWithoutContent} />)

    // Should not render note content section
    expect(screen.queryByText('This is a note about the highlighted text')).not.toBeInTheDocument()
  })

  it('should display interaction counts', () => {
    render(<SharedNoteCard note={mockNote} />)

    // Should show view and like counts (even though they're random in this implementation)
    expect(screen.getByText(/\d+ views/)).toBeInTheDocument()
    expect(screen.getByText(/\d+/)).toBeInTheDocument() // Like count
  })

  it('should be accessible with proper ARIA attributes', () => {
    render(<SharedNoteCard note={mockNote} />)

    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-label')
    expect(card).toHaveAttribute('title')
  })

  it('should handle click events properly without propagation issues', () => {
    const mockOnClick = vi.fn()
    const mockOnHighlightClick = vi.fn()

    render(
      <SharedNoteCard
        note={mockNote}
        onClick={mockOnClick}
        onHighlightClick={mockOnHighlightClick}
      />
    )

    // Click on the highlight area should trigger highlight click, not card click
    const highlightButton = screen.getByTitle('Click to highlight in text')
    fireEvent.click(highlightButton)

    expect(mockOnHighlightClick).toHaveBeenCalled()
    expect(mockOnClick).not.toHaveBeenCalled()

    // Click on the card area should trigger card click
    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalled()
  })
})