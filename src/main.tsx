import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './routes/AppRoutes'
import SupabaseProvider from './components/providers/SupabaseProvider'
import { ToastProvider } from './components/providers/ToastProvider'
import { PreferencesProvider } from './features/preferences/components/PreferencesProvider'
import './styles/index.css'

// Cleanup any leftover service workers from removed PWA plugin
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister()
    })
  }).catch(() => {
    // Ignore errors during cleanup
  })
}

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SupabaseProvider>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <BrowserRouter>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </BrowserRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </SupabaseProvider>
  </React.StrictMode>
)
