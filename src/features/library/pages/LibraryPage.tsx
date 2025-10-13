import { Link } from 'react-router-dom'
import { useResources } from '../hooks/useResources'
import { LibraryList } from '../components/LibraryList'
import { useProfile } from '../../../hooks/useProfile'

/**
 * Main library page displaying available reading resources
 */
export function LibraryPage (): JSX.Element {
  const { data: resources, isLoading, error } = useResources()
  const { isFacilitator } = useProfile()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground font-serif">
            Science of Revolution Library
          </h1>
          <p className="text-foreground-muted mt-2">
            Explore reading materials for Marxist study
          </p>
        </header>

        {isFacilitator && (
          <div className="mb-8">
            <Link to="/library/upload" className="btn btn-primary text-sm py-2 px-4">
              Upload new resource
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-foreground-muted">Loading resources...</p>
          </div>
        )}

        {error != null && (
          <div className="text-center py-12">
            <p className="text-error">Failed to load resources</p>
            <p className="text-foreground-muted text-sm mt-2">
              Please try refreshing the page
            </p>
          </div>
        )}

        {resources != null && <LibraryList resources={resources} />}
      </div>
    </div>
  )
}
