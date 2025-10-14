import { type ReactNode } from 'react'

interface ReaderLayoutProps {
  children: ReactNode
}

/**
 * Full-screen reader layout container with proper scrolling behavior
 */
export function ReaderLayout ({ children }: ReaderLayoutProps): JSX.Element {
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col">
      {children}
    </div>
  )
}
