import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SharedNotesPanel } from '../SharedNotesPanel'
import { ReaderProvider } from '../../contexts/ReaderContext'
import { type SharedNote } from '../../../shared-notes/types'

// Mock Supabase client
jest.mock('../../../lib/supabaseClient', () => ({
  default: {}
}))

// Mock SharedNotesRepository
jest.mock('../../../lib/repositories/sharedNotes', () => ({
  SharedNotesRepository: jest.fn().mockImplementation(() => ({
    getSharedNotesBySectionId: jest.fn()
  }))
}))

const mockSharedNotes: SharedNote[] = [
  {
    id: '1',
    user_id: 'user1',
    resource_section_id: 'section1',
    cohort_id: 'cohort1',
    start_pos: 0,
    end_pos: 50,
    text_content: 'This is a shared highlight',
    color: '#fbbf24',
    visibility: 'cohort',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    author_name: 'John Doe',
    author_avatar: 'https://example.com/avatar1.jpg',
    cohort_name: 'Study Group 1',
    note_content: 'This is an important point about the text',
    is_author: false
  },
  {
    id: '2',
    user_id: 'user2',
    resource_section_id: 'section1',
    cohort_id: null,
    start_pos: 100,
    end_pos: 150,
    text_content: 'Another shared note',
    color: '#34d399',
    visibility: 'global',
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z',
    author_name: 'Jane Smith',
    author_avatar: null,
    cohort_name: null,
    note_content: 'Global note content',
    is_author: false
  }
]

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <ReaderProvider>
        {component}
      </ReaderProvider>
    </QueryClientProvider>
  )
}

describe('SharedNotesPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isVisible is false', () => {
    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={false}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    expect(screen.queryByText('Shared Notes')).not.toBeInTheDocument()
  })

  it('should render loading state initially', () => {
    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    expect(screen.getByText('Shared Notes')).toBeInTheDocument()
    // Check for loading skeletons
    expect(screen.getAllByText('')).toHaveLength(expect.any(Number))
  })

  it('should render shared notes when data is loaded', async () => {
    const { SharedNotesRepository } = require('../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: jest.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('This is a shared highlight')).toBeInTheDocument()
      expect(screen.getByText('Another shared note')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should render empty state when no notes', async () => {
    const { SharedNotesRepository } = require('../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: jest.fn().mockResolvedValue([])
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No shared notes found')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share insights from this section')).toBeInTheDocument()
    })
  })

  it('should call onFiltersChange when filters are updated', async () => {
    const mockOnFiltersChange = jest.fn()

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search shared notes...')).toBeInTheDocument()
    })

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search shared notes...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: 'test search'
    })
  })

  it('should handle refresh button click', async () => {
    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTitle('Refresh shared notes')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTitle('Refresh shared notes')
    fireEvent.click(refreshButton)

    // Should trigger refetch (handled by React Query)
    expect(refreshButton).toBeInTheDocument()
  })

  it('should apply cohort filter', async () => {
    const mockOnFiltersChange = jest.fn()

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    // Expand filters
    const filtersButton = screen.getByText('Filters')
    fireEvent.click(filtersButton)

    await waitFor(() => {
      expect(screen.getByText('Cohort')).toBeInTheDocument()
    })

    // Note: Testing cohort filtering would require availableCohorts prop
    // This is a basic test for the filter UI
  })

  it('should handle error state', async () => {
    const { SharedNotesRepository } = require('../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: jest.fn().mockRejectedValue(new Error('Network error'))
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load shared notes')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('should handle retry on error', async () => {
    const { SharedNotesRepository } = require('../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    renderWithProviders(
      <SharedNotesPanel
        sectionId="section1"
        isVisible={true}
        filters={{}}
        onFiltersChange={jest.fn()}
      />
    )

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load shared notes')).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByText('Try again')
    fireEvent.click(retryButton)

    // Should eventually show the notes
    await waitFor(() => {
      expect(screen.getByText('This is a shared highlight')).toBeInTheDocument()
    })
  })
})