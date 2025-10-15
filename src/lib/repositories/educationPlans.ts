import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type EducationPlan = Database['public']['Tables']['education_plans']['Row']
type EducationPlanInsert = Database['public']['Tables']['education_plans']['Insert']
type EducationPlanUpdate = Database['public']['Tables']['education_plans']['Update']

export interface CreatePlanData {
  title: string
  description?: string
  cohortId?: string
  isTemplate?: boolean
  estimatedWeeks?: number
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
}

export interface UpdatePlanData {
  title?: string
  description?: string | null
  isPublished?: boolean
  estimatedWeeks?: number
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[] | null
  cohortId?: string | null
}

export interface PlanFilters {
  cohortId?: string
  isPublished?: boolean
  isTemplate?: boolean
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  search?: string
}

export class EducationPlanRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a new education plan
   */
  async create(userId: string, planInput: CreatePlanData): Promise<EducationPlan> {
    const planData: EducationPlanInsert = {
      title: planInput.title,
      description: planInput.description || null,
      cohort_id: planInput.cohortId || null,
      created_by: userId,
      is_template: planInput.isTemplate || false,
      is_published: false, // Plans start as drafts
      estimated_weeks: planInput.estimatedWeeks || 4,
      difficulty_level: planInput.difficultyLevel || null,
      tags: planInput.tags || []
    }

    const { data, error } = await this.supabase
      .from('education_plans')
      .insert(planData)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to create education plan: ${error.message}`)
    }

    return data
  }

  /**
   * Get a single education plan by ID
   */
  async getById(id: string): Promise<EducationPlan | null> {
    const { data, error } = await this.supabase
      .from('education_plans')
      .select(`
        *,
        cohorts (
          id,
          name
        ),
        profiles:created_by (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error != null) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get education plan: ${error.message}`)
    }

    return data
  }

  /**
   * Get multiple education plans with optional filtering
   */
  async getMany(filters: PlanFilters = {}): Promise<EducationPlan[]> {
    let query = this.supabase
      .from('education_plans')
      .select(`
        *,
        cohorts (
          id,
          name
        ),
        profiles:created_by (
          id,
          display_name,
          avatar_url
        )
      `)

    // Apply filters
    if (filters.cohortId != null) {
      query = query.eq('cohort_id', filters.cohortId)
    }

    if (filters.isPublished != null) {
      query = query.eq('is_published', filters.isPublished)
    }

    if (filters.isTemplate != null) {
      query = query.eq('is_template', filters.isTemplate)
    }

    if (filters.difficultyLevel != null) {
      query = query.eq('difficulty_level', filters.difficultyLevel)
    }

    if (filters.tags != null && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    if (filters.search != null) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error != null) {
      throw new Error(`Failed to get education plans: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get plans available to a specific user (published plans in their cohorts + public templates)
   */
  async getAvailableForUser(_userId: string): Promise<EducationPlan[]> {
    const { data, error } = await this.supabase
      .from('education_plans')
      .select(`
        *,
        cohorts (
          id,
          name
        ),
        profiles:created_by (
          id,
          display_name,
          avatar_url
        )
      `)
      .or('is_published.eq.true,is_template.eq.true')
      .order('created_at', { ascending: false })

    if (error != null) {
      throw new Error(`Failed to get available education plans: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get plans created by a specific user
   */
  async getByCreator(userId: string): Promise<EducationPlan[]> {
    const { data, error } = await this.supabase
      .from('education_plans')
      .select(`
        *,
        cohorts (
          id,
          name
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error != null) {
      throw new Error(`Failed to get user's education plans: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update an education plan
   */
  async update(id: string, planInput: UpdatePlanData): Promise<EducationPlan> {
    const updateData: EducationPlanUpdate = {}

    if (planInput.title != null) updateData.title = planInput.title
    if (planInput.description !== undefined) updateData.description = planInput.description
    if (planInput.isPublished !== undefined) updateData.is_published = planInput.isPublished
    if (planInput.estimatedWeeks != null) updateData.estimated_weeks = planInput.estimatedWeeks
    if (planInput.difficultyLevel != null) updateData.difficulty_level = planInput.difficultyLevel
    if (planInput.tags !== undefined) updateData.tags = planInput.tags
    if (planInput.cohortId !== undefined) updateData.cohort_id = planInput.cohortId

    const { data: updatedPlan, error } = await this.supabase
      .from('education_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to update education plan: ${error.message}`)
    }

    return updatedPlan
  }

  /**
   * Publish an education plan
   */
  async publish(id: string): Promise<EducationPlan> {
    return this.update(id, { isPublished: true })
  }

  /**
   * Unpublish an education plan (make it a draft again)
   */
  async unpublish(id: string): Promise<EducationPlan> {
    return this.update(id, { isPublished: false })
  }

  /**
   * Delete an education plan
   */
  async delete(id: string): Promise<void> {
    // This will cascade delete topics, readings, and progress due to foreign key constraints
    const { error } = await this.supabase
      .from('education_plans')
      .delete()
      .eq('id', id)

    if (error != null) {
      throw new Error(`Failed to delete education plan: ${error.message}`)
    }
  }

  /**
   * Duplicate an education plan (create a new plan with same structure)
   */
  async duplicate(id: string, userId: string, overrides: Partial<CreatePlanData> = {}): Promise<EducationPlan> {
    // Get the original plan
    const originalPlan = await this.getById(id)
    if (originalPlan == null) {
      throw new Error('Original plan not found')
    }

    // Create new plan with overrides
    const newPlanData: CreatePlanData = {
      title: overrides.title || `Copy of ${originalPlan.title}`,
      description: overrides.description || originalPlan.description || undefined,
      cohortId: overrides.cohortId || originalPlan.cohort_id || undefined,
      isTemplate: overrides.isTemplate || false,
      estimatedWeeks: overrides.estimatedWeeks || originalPlan.estimated_weeks || undefined,
      difficultyLevel: overrides.difficultyLevel || originalPlan.difficulty_level || undefined,
      tags: overrides.tags || originalPlan.tags || undefined
    }

    const newPlan = await this.create(userId, newPlanData)

    // TODO: In a future iteration, we'll need to also duplicate topics and readings
    // For now, this just creates the plan structure

    return newPlan
  }

  /**
   * Check if a user can access/edit a plan
   */
  async canUserEdit(userId: string, planId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('education_plans')
      .select('id, created_by, cohort_id')
      .eq('id', planId)
      .single()

    if (error != null) return false

    // User can edit if they created the plan
    if (data.created_by === userId) return true

    // User can edit if they're a facilitator in the plan's cohort
    const { data: userProfile } = await this.supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single()

    if (userProfile?.roles?.includes('facilitator') && data.cohort_id != null) {
      const { data: userCohort } = await this.supabase
        .from('user_cohorts')
        .select('id')
        .eq('user_id', userId)
        .eq('cohort_id', data.cohort_id)
        .single()

      return userCohort != null
    }

    return false
  }

  /**
   * Get plan statistics
   */
  async getPlanStats(planId: string): Promise<{
    totalTopics: number
    totalReadings: number
    enrolledUsers: number
    completedUsers: number
    averageProgress: number
  }> {
    const { data: planTopics, error: topicsError } = await this.supabase
      .from('education_plan_topics')
      .select('id')
      .eq('education_plan_id', planId)

    if (topicsError != null) {
      throw new Error(`Failed to load plan topics: ${topicsError.message}`)
    }

    const topicIds = planTopics?.map(topic => topic.id) ?? []

    let totalReadings = 0
    if (topicIds.length > 0) {
      const { count, error: readingsError } = await this.supabase
        .from('topic_readings')
        .select('*', { count: 'exact', head: true })
        .in('topic_id', topicIds)

      if (readingsError != null) {
        throw new Error(`Failed to load topic readings: ${readingsError.message}`)
      }

      totalReadings = count ?? 0
    }

    const { data: progressData } = await this.supabase
      .from('user_plan_progress')
      .select('status, progress_percentage')
      .eq('education_plan_id', planId)

    const enrolledUsers = progressData?.length || 0
    const completedUsers = progressData?.filter(p => p.status === 'completed').length || 0
    const averageProgress = enrolledUsers > 0 && progressData != null
      ? progressData.reduce((sum, p) => sum + p.progress_percentage, 0) / enrolledUsers
      : 0

    return {
      totalTopics: topicIds.length,
      totalReadings,
      enrolledUsers,
      completedUsers,
      averageProgress: Math.round(averageProgress)
    }
  }
}
