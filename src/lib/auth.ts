import supabase from './supabaseClient'
import { type Database } from './database.types'

type InviteCode = Database['public']['Tables']['invite_codes']['Row']

export interface ValidateInviteCodeResult {
  valid: boolean
  error?: string
  inviteCode?: InviteCode
}

export async function validateInviteCode(code: string): Promise<ValidateInviteCodeResult> {
  if (!code || code.trim() === '') {
    return { valid: false, error: 'Invite code is required' }
  }

  const { data: inviteCode, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code.trim())
    .single()

  if (error || !inviteCode) {
    return { valid: false, error: 'Invalid invite code' }
  }

  // Check if expired
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return { valid: false, error: 'Invite code has expired' }
  }

  // Check if max uses reached
  if (inviteCode.max_uses !== null && inviteCode.uses >= inviteCode.max_uses) {
    return { valid: false, error: 'Invite code has reached maximum uses' }
  }

  return { valid: true, inviteCode }
}

export interface CreateProfileParams {
  userId: string
  displayName: string
  cohortId?: string | null
  role?: string
}

export async function createProfile(params: CreateProfileParams): Promise<{ success: boolean; error?: string }> {
  const { userId, displayName, cohortId, role = 'member' } = params

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: displayName,
      roles: [role],
      primary_cohort_id: cohortId ?? null
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { success: false, error: 'Failed to create user profile' }
  }

  // If cohort assigned, add to user_cohorts
  if (cohortId) {
    const { error: cohortError } = await supabase
      .from('user_cohorts')
      .insert({
        user_id: userId,
        cohort_id: cohortId
      })

    if (cohortError) {
      console.error('User cohort assignment error:', cohortError)
      // Note: Profile was created, but cohort assignment failed
      return { success: false, error: 'Profile created but cohort assignment failed' }
    }
  }

  return { success: true }
}

export async function incrementInviteCodeUses(code: string): Promise<void> {
  const { error } = await supabase.rpc('increment_invite_code_uses', { code_to_increment: code })

  if (error) {
    console.error('Failed to increment invite code uses:', error)
  }
}
