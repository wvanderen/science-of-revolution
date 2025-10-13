import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InviteGatePage from '../InviteGatePage'

const { mockSignUp, mockNavigate, mockValidateInviteCode } = vi.hoisted(() => ({
  mockSignUp: vi.fn(async () => ({ error: null })),
  mockNavigate: vi.fn(),
  mockValidateInviteCode: vi.fn(async () => ({
    valid: true,
    inviteCode: {
      code: 'ABC123',
      cohort_id: 'cohort-1',
      type: 'standard',
      max_uses: null,
      uses: 0,
      expires_at: null,
      metadata: {},
      created_at: new Date().toISOString(),
      created_by: null
    }
  }))
}))

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
      signUp: mockSignUp
    }
  }
}))

vi.mock('../../lib/auth', () => ({
  validateInviteCode: mockValidateInviteCode
}))

describe('InviteGatePage', () => {
  beforeEach(() => {
    mockSignUp.mockClear()
    mockNavigate.mockClear()
    mockValidateInviteCode.mockClear()
    mockSignUp.mockResolvedValue({ error: null })
    mockValidateInviteCode.mockResolvedValue({
      valid: true,
      inviteCode: {
        code: 'ABC123',
        cohort_id: 'cohort-1',
        type: 'standard',
        max_uses: null,
        uses: 0,
        expires_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        created_by: null
      }
    })
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
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'P@ssword123' } })

    fireEvent.submit(screen.getByTestId('invite-form'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'P@ssword123',
        options: {
          data: {
            invite_code: 'ABC123',
            display_name: 'Test User'
          }
        }
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
