import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from '../useSession'
import type { Session } from '@supabase/supabase-js'

const mockSession = {
  access_token: 'token',
  token_type: 'bearer',
  user: {
    id: '123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com'
  }
} as Session

const unsubscribe = vi.fn()

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: mockSession } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } }))
    }
  }
}))

describe('useSession', () => {
  it('returns session data after load', async () => {
    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.session?.user?.email).toBe('test@example.com')
  })

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useSession())
    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
