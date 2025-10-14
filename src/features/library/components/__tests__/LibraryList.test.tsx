import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { LibraryList } from '../LibraryList'
import { type ResourceWithSections } from '../../hooks/useResources'

// Mock the ResourceCard component
vi.mock('../ResourceCard', () => ({
  ResourceCard: ({ resource, sectionCount, totalWords }: any) => (
    <div data-testid="resource-card" data-resource-id={resource.id}>
      {resource.title} - {sectionCount} sections - {totalWords} words
    </div>
  )
}))

describe('LibraryList', () => {
  const mockResources: ResourceWithSections[] = [
    {
      id: '1',
      title: 'Test Resource 1',
      author: 'Test Author',
      type: 'article',
      source_url: null,
      storage_path: 'test-path-1',
      sequence_order: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      sections: [],
      sectionCount: 5,
      totalWordCount: 1000
    },
    {
      id: '2',
      title: 'Test Resource 2',
      author: 'Another Author',
      type: 'article',
      source_url: null,
      storage_path: 'test-path-2',
      sequence_order: 2,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      sections: [],
      sectionCount: 3,
      totalWordCount: 500
    }
  ]

  it('renders empty state when no resources', () => {
    render(
      <BrowserRouter>
        <LibraryList resources={[]} />
      </BrowserRouter>
    )

    expect(screen.getByText('Your library is waiting')).toBeInTheDocument()
    expect(screen.getByText(/Start building your personal reading collection/)).toBeInTheDocument()
  })

  it('renders filtered empty state when filters are active', () => {
    render(
      <BrowserRouter>
        <LibraryList
          resources={[]}
          filteredOut={true}
          activeFiltersCount={2}
          onClearFilters={vi.fn()}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('No matches found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your 2 filters or search terms.')).toBeInTheDocument()
    expect(screen.getByText('Clear all filters')).toBeInTheDocument()
  })

  it('renders resource cards when resources are provided', () => {
    render(<LibraryList resources={mockResources} />)

    const cards = screen.getAllByTestId('resource-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute('data-resource-id', '1')
    expect(cards[1]).toHaveAttribute('data-resource-id', '2')
  })

  it('passes correct props to ResourceCard components', () => {
    render(<LibraryList resources={mockResources} />)

    const cards = screen.getAllByTestId('resource-card')

    expect(cards[0]).toHaveTextContent('Test Resource 1 - 5 sections - 1000 words')
    expect(cards[1]).toHaveTextContent('Test Resource 2 - 3 sections - 500 words')
  })

  it('renders responsive grid with correct classes', () => {
    const { container } = render(<LibraryList resources={mockResources} />)

    const grid = container.querySelector('div')
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('applies clamp-based gutters via inline style', () => {
    const { container } = render(<LibraryList resources={mockResources} />)

    const grid = container.querySelector('div')
    expect(grid).toHaveStyle({ gap: 'clamp(1rem, 2vw, 1.5rem)' })
  })

  it('renders single card when only one resource', () => {
    render(<LibraryList resources={[mockResources[0]]} />)

    const cards = screen.getAllByTestId('resource-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveAttribute('data-resource-id', '1')
  })
})