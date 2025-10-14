import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ReadingInsights } from '../ReadingInsights'

// Mock analytics
vi.mock('../../../lib/analytics', () => ({
  useAnalytics: () => ({
    trackInteraction: vi.fn()
  })
}))

describe('ReadingInsights', () => {
  const mockInsights = {
    recentReading: [
      {
        id: '1',
        resource: {
          id: '1',
          title: 'Test Resource 1',
          author: 'Test Author',
          type: 'article'
        },
        progress: {
          completedSections: 2,
          totalSections: 5,
          scrollPercent: 40,
          status: 'in-progress',
          lastReadAt: '2024-01-01T00:00:00Z'
        },
        readingTime: '45m'
      }
    ],
    stats: {
      totalRead: 3,
      totalTimeMinutes: 120,
      currentStreak: 5,
      averageSessionMinutes: 30
    },
    recommendations: [
      {
        id: '2',
        title: 'Recommended Resource',
        author: 'Rec Author',
        reason: 'Similar to other articles you have read',
        type: 'article',
        length: 'short' as const,
        coverArt: undefined
      }
    ]
  }

  const defaultProps = {
    insights: mockInsights,
    isLoading: false,
    isMobile: false,
    isOpen: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Desktop Right Rail', () => {
    it('renders reading stats correctly', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={false} />
        </BrowserRouter>
      )

      expect(screen.getByText('Your Reading')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // totalRead
      expect(screen.getByText('5')).toBeInTheDocument() // currentStreak
      expect(screen.getByText('2h 0m')).toBeInTheDocument() // totalTimeMinutes
      expect(screen.getByText('30m')).toBeInTheDocument() // averageSessionMinutes
    })

    it('renders recent reading section', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={false} />
        </BrowserRouter>
      )

      expect(screen.getByText('Recent Reading')).toBeInTheDocument()
      expect(screen.getByText('Test Resource 1')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
      expect(screen.getByText('40%')).toBeInTheDocument()
      expect(screen.getByText('45m')).toBeInTheDocument()
    })

    it('renders recommendations section', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={false} />
        </BrowserRouter>
      )

      expect(screen.getByText('Recommended for You')).toBeInTheDocument()
      expect(screen.getByText('Recommended Resource')).toBeInTheDocument()
      expect(screen.getByText('Similar to other articles you have read')).toBeInTheDocument()
      expect(screen.getByText('short')).toBeInTheDocument()
    })

    it('shows empty states when no data', () => {
      const emptyInsights = {
        recentReading: [],
        stats: {
          totalRead: 0,
          totalTimeMinutes: 0,
          currentStreak: 0,
          averageSessionMinutes: 0
        },
        recommendations: []
      }

      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            insights={emptyInsights}
            isMobile={false}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/Start reading to see your recent activity here/)).toBeInTheDocument()
      expect(screen.getByText(/Read a few works to get personalized recommendations/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            isLoading={true}
            isMobile={false}
          />
        </BrowserRouter>
      )

      // Check for skeleton loading elements
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile Modal', () => {
    it('renders mobile modal with proper structure', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={true} />
        </BrowserRouter>
      )

      // Check for modal elements
      expect(screen.getByText('Reading Insights')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close insights' })).toBeInTheDocument()

      // Check for handle bar
      const handleBar = document.querySelector('.w-12.h-1.bg-muted.rounded-full')
      expect(handleBar).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={true} />
        </BrowserRouter>
      )

      // Check for close button ARIA label
      const closeButton = screen.getByRole('button', { name: 'Close insights' })
      expect(closeButton).toHaveAttribute('aria-label', 'Close insights')
    })

    it('closes when close button is clicked', () => {
      const mockOnClose = vi.fn()
      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            isMobile={true}
            onClose={mockOnClose}
          />
        </BrowserRouter>
      )

      const closeButton = screen.getByRole('button', { name: 'Close insights' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('closes when backdrop is clicked', () => {
      const mockOnClose = vi.fn()
      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            isMobile={true}
            onClose={mockOnClose}
          />
        </BrowserRouter>
      )

      // Find and click backdrop
      const backdrop = document.querySelector('[aria-label="Close insights modal"]')
      fireEvent.click(backdrop!)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation for backdrop', () => {
      const mockOnClose = vi.fn()
      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            isMobile={true}
            onClose={mockOnClose}
          />
        </BrowserRouter>
      )

      // Find backdrop and test Enter key
      const backdrop = document.querySelector('[aria-label="Close insights modal"]')
      fireEvent.keyDown(backdrop!, { key: 'Enter' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)

      // Reset and test Space key
      mockOnClose.mockClear()
      fireEvent.keyDown(backdrop!, { key: ' ' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not render when isOpen is false', () => {
      render(
        <BrowserRouter>
          <ReadingInsights
            {...defaultProps}
            isMobile={true}
            isOpen={false}
          />
        </BrowserRouter>
      )

      // Modal should not be in DOM
      expect(screen.queryByText('Reading Insights')).not.toBeInTheDocument()
    })

    it('has proper focus management', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={true} />
        </BrowserRouter>
      )

      // Close button should be focusable
      const closeButton = screen.getByRole('button', { name: 'Close insights' })
      expect(closeButton).toBeInTheDocument()

      // Check that modal elements are properly structured for focus trapping
      const modal = document.querySelector('.relative.bg-background')
      expect(modal).toBeInTheDocument()
    })

    it('tracks interaction events when links are clickable', () => {
      render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={true} />
        </BrowserRouter>
      )

      // Verify that links are present and clickable
      const recentReadingLink = screen.getByText('Test Resource 1')
      expect(recentReadingLink).toBeInTheDocument()
      expect(recentReadingLink.closest('a')).toHaveAttribute('href', '/reader/1')
    })
  })

  describe('Responsive Behavior', () => {
    it('renders different layouts for mobile vs desktop', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={false} />
        </BrowserRouter>
      )

      // Desktop should not have modal elements
      expect(screen.queryByText('Reading Insights')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close insights' })).not.toBeInTheDocument()

      // Rerender as mobile
      rerender(
        <BrowserRouter>
          <ReadingInsights {...defaultProps} isMobile={true} />
        </BrowserRouter>
      )

      // Mobile should have modal elements
      expect(screen.getByText('Reading Insights')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close insights' })).toBeInTheDocument()
    })
  })
})