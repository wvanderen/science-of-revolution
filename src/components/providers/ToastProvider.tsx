import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  type?: ToastType
  duration?: number
}

interface Toast extends Required<ToastOptions> {
  id: number
  message: string
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

function getTypeClasses (type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-l-4 border-l-emerald-400'
    case 'error':
      return 'border-l-4 border-l-rose-500'
    case 'info':
    default:
      return 'border-l-4 border-l-sky-400'
  }
}

const DEFAULT_DURATION = 3000

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider ({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, options: ToastOptions = {}): void => {
    const { type = 'info', duration = DEFAULT_DURATION } = options
    const id = Date.now() + Math.random()

    setToasts(prev => [...prev, { id, message, type, duration }])

    window.setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[1200] flex max-w-sm flex-col gap-3">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`pointer-events-auto rounded-lg border border-border bg-surface px-4 py-3 shadow-xl ${getTypeClasses(type)}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-foreground">{message}</span>
              <button
                className="text-sm text-foreground-muted hover:text-foreground"
                onClick={() => { removeToast(id) }}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast (): ToastContextValue {
  const context = useContext(ToastContext)
  if (context == null) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

