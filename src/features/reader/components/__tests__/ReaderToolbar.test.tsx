import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ReaderToolbar } from '../ReaderToolbar'
import { type Database } from '../../../../lib/database.types'

// Mock useProfile hook
vi.mock('../../../../hooks/useProfile', () => ({
  useProfile: () => ({
    data: { id: 'user-1', display_name: 'Test User', roles: ['participant'] },
    isFacilitator: false
  })
}))

// Mock database types
type ResourceSection = Database['public']['Tables']['resource_sections']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

const now = new Date().toISOString()
const mockSections: ResourceSection[] = [
  { id: '1', title: 'Introduction', order: 0, content_html: '<p>Test content</p>', content: null, word_count: 100, resource_id: 'test', created_at: now, updated_at: now },
  { id: '2', title: 'Chapter 1', order: 1, content_html: '<p>Test content</p>', content: null, word_count: 200, resource_id: 'test', created_at: now, updated_at: now },
  { id: '3', title: 'Conclusion', order: 2, content_html: '<p>Test content</p>', content: null, word_count: 150, resource_id: 'test', created_at: now, updated_at: now }
]

const mockProgress: Progress = {
  id: 'progress-1',
  user_id: 'user-1',
  resource_section_id: '1',
  status: 'in_progress' as const,
  scroll_percent: 45,
  completed_at: null,
  created_at: now,
  updated_at: now
}

describe('ReaderToolbar', () => {
  const defaultProps = {
    sections: mockSections,
    currentSectionId: '1',
    onSectionSelect: vi.fn(),
    onClose: vi.fn(),
    progress: mockProgress,
    scrollPercent: mockProgress.scroll_percent,
    onOpenPreferences: vi.fn(),
    onToggleCompleted: vi.fn(),
    onEditDocument: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the compact toolbar with essential elements', () => {
    render(<ReaderToolbar {...defaultProps} />)

    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByLabelText('Close reader')).toBeInTheDocument()
    expect(screen.getByLabelText('Open reader preferences')).toBeInTheDocument()
    expect(screen.getByLabelText('Open section menu')).toBeInTheDocument()
  })

  it('shows current section info in button title', () => {
    render(<ReaderToolbar {...defaultProps} />)

    const sectionButton = screen.getByLabelText('Open section menu')
    expect(sectionButton).toHaveAttribute('title', 'Section 1 of 3: Introduction (Ctrl+K)')
  })

  it('calls onClose when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const backButton = screen.getByLabelText('Close reader')
    await user.click(backButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onOpenPreferences when preferences button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const preferencesButton = screen.getByLabelText('Open reader preferences')
    await user.click(preferencesButton)

    expect(defaultProps.onOpenPreferences).toHaveBeenCalled()
  })

  it('displays progress percentage correctly', () => {
    const customProgress = { ...mockProgress, scroll_percent: 75 }
    render(<ReaderToolbar
      {...defaultProps}
      progress={customProgress}
      scrollPercent={customProgress.scroll_percent}
    />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows progress bar with correct width', () => {
    const customProgress = { ...mockProgress, scroll_percent: 60 }
    render(<ReaderToolbar
      {...defaultProps}
      progress={customProgress}
      scrollPercent={customProgress.scroll_percent}
    />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
    expect(progressBar).toHaveAttribute('aria-label', 'Reading progress: 60% complete')
  })

  it('opens section menu when section button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    expect(screen.getByText('Sections')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays all sections in the menu', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    // Check sections within the menu dialog
    const menu = screen.getByRole('dialog')
    expect(menu).toBeInTheDocument()

    expect(menu).toHaveTextContent('Introduction')
    expect(menu).toHaveTextContent('Chapter 1')
    expect(menu).toHaveTextContent('Conclusion')
  })

  it('highlights current section in menu', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} currentSectionId={'2'} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    const menu = screen.getByRole('dialog')
    expect(menu).toHaveTextContent('Chapter 1')
    expect(menu).toHaveTextContent('2')
  })

  it('calls onSectionSelect and closes menu when section is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    const menu = screen.getByRole('dialog')
    // Click on the second section (Chapter 1) - need to find the button containing the text
    const chapterButton = within(menu).getByText('Chapter 1')
    await user.click(chapterButton)

    expect(defaultProps.onSectionSelect).toHaveBeenCalledWith('2')
    // Menu should be closed
    expect(screen.queryByText('Sections')).not.toBeInTheDocument()
  })

  it('handles keyboard shortcuts for section navigation', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} currentSectionId={'2'} />)

    // Test right arrow (next section)
    await user.keyboard('{ArrowRight}')
    expect(defaultProps.onSectionSelect).toHaveBeenCalledWith('3')

    vi.clearAllMocks()

    // Test left arrow (previous section)
    await user.keyboard('{ArrowLeft}')
    expect(defaultProps.onSectionSelect).toHaveBeenCalledWith('1')
  })

  it('opens section menu with Ctrl+K shortcut', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    await user.keyboard('{Control>}{k}{/Control}')

    expect(screen.getByText('Sections')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not handle keyboard shortcuts when typing in input', async () => {
    const user = userEvent.setup()

    // Add an input to the document to simulate typing
    document.body.innerHTML = '<input type="text" />'
    const input = document.querySelector('input')!
    input.focus()

    render(<ReaderToolbar {...defaultProps} />)

    await user.keyboard('{ArrowRight}')
    expect(defaultProps.onSectionSelect).not.toHaveBeenCalled()
  })

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    // Click backdrop
    const backdrop = screen.getByText('Sections').closest('[role="dialog"]')?.previousSibling as HTMLElement
    await user.click(backdrop)

    expect(screen.queryByText('Sections')).not.toBeInTheDocument()
  })

  it('closes menu when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    const closeButton = screen.getByLabelText('Close section menu')
    await user.click(closeButton)

    expect(screen.queryByText('Sections')).not.toBeInTheDocument()
  })

  it('shows keyboard shortcuts hint in menu', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const sectionMenuButton = screen.getByLabelText('Open section menu')
    await user.click(sectionMenuButton)

    expect(screen.getByText('Use ← → keys to navigate • Ctrl+K to open menu')).toBeInTheDocument()
  })

  it('shows completion checkbox with correct state', () => {
    const inProgressProgress = { ...mockProgress, status: 'in_progress' as const }
    render(<ReaderToolbar {...defaultProps} progress={inProgressProgress} />)

    const checkbox = screen.getByLabelText('Mark section as completed')
    expect(checkbox).not.toBeChecked()
  })

  it('shows completed checkbox when section is completed', () => {
    const completedProgress = { ...mockProgress, status: 'completed' as const }
    render(<ReaderToolbar {...defaultProps} progress={completedProgress} />)

    const checkbox = screen.getByLabelText('Mark section as completed')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggleCompleted when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(<ReaderToolbar {...defaultProps} />)

    const checkbox = screen.getByLabelText('Mark section as completed')
    await user.click(checkbox)

    expect(defaultProps.onToggleCompleted).toHaveBeenCalled()
  })

  // Note: Edit document functionality for facilitators is tested in integration tests
// The basic functionality works - edit button only appears when isFacilitator is true
})
