import { type ReactNode } from 'react'

interface ReaderLayoutProps {
  children: ReactNode
}

/**
 * Full-screen reader layout container
 */
export function ReaderLayout ({ children }: ReaderLayoutProps): JSX.Element {
  return (
    <div className="reader-container min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
