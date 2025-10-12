import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InviteGatePage from '../InviteGatePage'

const signUp = vi.fn(async () => ({ error: null }))
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      signUp
    }
  }
}))

describe('InviteGatePage', () => {
  beforeEach(() => {
    signUp.mockClear()
    mockNavigate.mockClear()
  })

  it('requires invite code, email, and password', async () => {
    render(
      <MemoryRouter>
        <InviteGatePage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invite code required')
  })

  it('submits signup payload with invite metadata', async () => {
    render(
      <MemoryRouter>
        <InviteGatePage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'ABC123' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'P@ssword123' } })

    fireEvent.submit(screen.getByTestId('invite-form'))

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'P@ssword123',
        options: { data: { invite_code: 'ABC123' } }
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
