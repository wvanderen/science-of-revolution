import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type UserPlanProgress = Database['public']['Tables']['user_plan_progress']['Row']
type UserPlanProgressInsert = Database['public']['Tables']['user_plan_progress']['Insert']
type UserPlanProgressUpdate = Database['public']['Tables']['user_plan_progress']['Update']

type UserTopicProgress = Database['public']['Tables']['user_topic_progress']['Row']
type UserTopicProgressUpdate = Database['public']['Tables']['user_topic_progress']['Update']

export type UserPlanProgressWithPlan = UserPlanProgress & {
  education_plans: {
    id: string
    title: string
    description: string | null
    difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
    estimated_weeks: number | null
    is_published: boolean
  }
}

export interface EnrollmentData {
  userId: string
  planId: string
}

export interface UserPlanProgressData {
  status?: 'not_started' | 'in_progress' | 'completed'
  currentTopicId?: string
  progressPercentage?: number
}

export interface UserTopicProgressData {
  status?: 'not_started' | 'in_progress' | 'completed'
  progressPercentage?: number
  readingProgress?: Record<string, number> // resource_id -> progress percentage
}

export class PlanEnrollmentRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Enroll a user in an education plan
   */
  async enroll(data: EnrollmentData): Promise<UserPlanProgress> {
    // Check if user is already enrolled
    const existing = await this.getEnrollment(data.userId, data.planId)
    if (existing != null) {
      throw new Error('User is already enrolled in this plan')
    }

    const progressData: UserPlanProgressInsert = {
      user_id: data.userId,
      education_plan_id: data.planId,
      status: 'not_started',
      progress_percentage: 0
    }

    const { data: progress, error } = await this.supabase
      .from('user_plan_progress')
      .insert(progressData)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to enroll user: ${error.message}`)
    }

    return progress
  }

  /**
   * Unenroll a user from an education plan
   */
  async unenroll(userId: string, planId: string): Promise<void> {
    // This will cascade delete topic progress due to foreign key constraints
    const { error } = await this.supabase
      .from('user_plan_progress')
      .delete()
      .eq('user_id', userId)
      .eq('education_plan_id', planId)

    if (error != null) {
      throw new Error(`Failed to unenroll user: ${error.message}`)
    }
  }

  /**
   * Get a user's enrollment status for a specific plan
   */
  async getEnrollment(userId: string, planId: string): Promise<UserPlanProgress | null> {
    const { data, error } = await this.supabase
      .from('user_plan_progress')
      .select(`
        *,
        education_plans (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('education_plan_id', planId)
      .single()

    if (error != null) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get enrollment: ${error.message}`)
    }

    return data
  }

  /**
   * Get all enrollments for a user
   */
  async getUserEnrollments(userId: string): Promise<UserPlanProgressWithPlan[]> {
    const { data, error } = await this.supabase
      .from('user_plan_progress')
      .select(`
        *,
        education_plans (
          id,
          title,
          description,
          difficulty_level,
          estimated_weeks,
          is_published
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error != null) {
      throw new Error(`Failed to get user enrollments: ${error.message}`)
    }

    return (data?.map(item => ({
      ...item,
      education_plans: Array.isArray(item.education_plans)
        ? item.education_plans[0]
        : item.education_plans
    })) as UserPlanProgressWithPlan[]) || []
  }

  /**
   * Get all enrollments for a specific plan
   */
  async getPlanEnrollments(planId: string): Promise<UserPlanProgress[]> {
    const { data, error } = await this.supabase
      .from('user_plan_progress')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('education_plan_id', planId)
      .order('created_at', { ascending: false })

    if (error != null) {
      throw new Error(`Failed to get plan enrollments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update user's plan progress
   */
  async updatePlanProgress(userId: string, planId: string, data: UserPlanProgressData): Promise<UserPlanProgress> {
    const updateData: UserPlanProgressUpdate = {}

    if (data.status !== undefined) {
      updateData.status = data.status
      // Set timestamps based on status
      if (data.status === 'in_progress' && updateData.started_at === undefined) {
        updateData.started_at = new Date().toISOString()
      }
      if (data.status === 'completed' && updateData.completed_at === undefined) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (data.currentTopicId !== undefined) {
      updateData.current_topic_id = data.currentTopicId
    }

    if (data.progressPercentage !== undefined) {
      updateData.progress_percentage = data.progressPercentage
    }

    const { data: progress, error } = await this.supabase
      .from('user_plan_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('education_plan_id', planId)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to update plan progress: ${error.message}`)
    }

    return progress
  }

  /**
   * Start a plan (mark as in progress)
   */
  async startPlan(userId: string, planId: string, firstTopicId?: string): Promise<UserPlanProgress> {
    return this.updatePlanProgress(userId, planId, {
      status: 'in_progress',
      currentTopicId: firstTopicId,
      progressPercentage: 0
    })
  }

  /**
   * Complete a plan
   */
  async completePlan(userId: string, planId: string): Promise<UserPlanProgress> {
    return this.updatePlanProgress(userId, planId, {
      status: 'completed',
      progressPercentage: 100
    })
  }

  /**
   * Get user's topic progress for a specific topic
   */
  async getTopicProgress(userId: string, topicId: string): Promise<UserTopicProgress | null> {
    const { data, error } = await this.supabase
      .from('user_topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single()

    if (error != null) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get topic progress: ${error.message}`)
    }

    return data
  }

  /**
   * Get all topic progress for a user in a specific plan
   */
  async getUserPlanTopicProgress(userId: string, planId: string): Promise<UserTopicProgress[]> {
    const { data: planTopics, error: topicsError } = await this.supabase
      .from('education_plan_topics')
      .select('id')
      .eq('education_plan_id', planId)

    if (topicsError != null) {
      throw new Error(`Failed to load plan topics: ${topicsError.message}`)
    }

    const topicIds = planTopics?.map(topic => topic.id) ?? []
    if (topicIds.length === 0) {
      return []
    }

    const { data, error } = await this.supabase
      .from('user_topic_progress')
      .select('*')
      .eq('user_id', userId)
      .in('topic_id', topicIds)
      .order('created_at', { ascending: false })

    if (error != null) {
      throw new Error(`Failed to get user topic progress: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update user's topic progress
   */
  async updateTopicProgress(userId: string, topicId: string, data: UserTopicProgressData): Promise<UserTopicProgress> {
    const updateData: UserTopicProgressUpdate = {}

    if (data.status !== undefined) {
      updateData.status = data.status
      // Set timestamps based on status
      if (data.status === 'in_progress' && updateData.started_at === undefined) {
        updateData.started_at = new Date().toISOString()
      }
      if (data.status === 'completed' && updateData.completed_at === undefined) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (data.progressPercentage !== undefined) {
      updateData.progress_percentage = data.progressPercentage
    }

    if (data.readingProgress !== undefined) {
      updateData.reading_progress = data.readingProgress
    }

    const { data: progress, error } = await this.supabase
      .from('user_topic_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to update topic progress: ${error.message}`)
    }

    return progress
  }

  /**
   * Start a topic (mark as in progress)
   */
  async startTopic(userId: string, topicId: string): Promise<UserTopicProgress> {
    return this.updateTopicProgress(userId, topicId, {
      status: 'in_progress',
      progressPercentage: 0
    })
  }

  /**
   * Complete a topic
   */
  async completeTopic(userId: string, topicId: string): Promise<UserTopicProgress> {
    const progress = await this.updateTopicProgress(userId, topicId, {
      status: 'completed',
      progressPercentage: 100
    })

    // Automatically update plan progress
    await this.recalculatePlanProgress(userId, progress.topic_id)

    return progress
  }

  /**
   * Update reading progress within a topic
   */
  async updateReadingProgress(userId: string, topicId: string, resourceId: string, progressPercent: number): Promise<UserTopicProgress> {
    // Get current topic progress, or create if doesn't exist
    let currentProgress = await this.getTopicProgress(userId, topicId)

    // If no progress record exists, create one
    if (currentProgress == null) {
      const { data: newProgress, error } = await this.supabase
        .from('user_topic_progress')
        .insert({
          user_id: userId,
          topic_id: topicId,
          status: 'in_progress',
          progress_percentage: 0,
          reading_progress: {}
        })
        .select()
        .single()

      if (error != null) {
        throw new Error(`Failed to create topic progress: ${error.message}`)
      }

      currentProgress = newProgress
    }

    const readingProgress = currentProgress?.reading_progress as Record<string, number> || {}

    // Update reading progress
    readingProgress[resourceId] = progressPercent

    // Calculate overall topic progress based on readings
    // For now, we'll use a simple average. This can be enhanced later.
    const readingProgressValues = Object.values(readingProgress)
    const averageProgress = readingProgressValues.length > 0
      ? readingProgressValues.reduce((sum, progress) => sum + progress, 0) / readingProgressValues.length
      : 0

    // Determine status based on progress
    const status = averageProgress >= 100 ? 'completed' : averageProgress > 0 ? 'in_progress' : 'not_started'

    const updatedProgress = await this.updateTopicProgress(userId, topicId, {
      status,
      progressPercentage: Math.round(averageProgress),
      readingProgress
    })

    // If topic is completed, recalculate plan progress
    if (status === 'completed') {
      await this.recalculatePlanProgress(userId, topicId)
    }

    return updatedProgress
  }

  /**
   * Recalculate plan progress based on topic completion
   */
  private async recalculatePlanProgress(userId: string, topicId: string): Promise<void> {
    // Get the plan ID for this topic
    const { data: topic } = await this.supabase
      .from('education_plan_topics')
      .select('education_plan_id')
      .eq('id', topicId)
      .single()

    if (topic == null) return

    // Get all topics for the plan and user's progress
    const { data: allTopics } = await this.supabase
      .from('education_plan_topics')
      .select('id')
      .eq('education_plan_id', topic.education_plan_id)

    const topicIds = allTopics?.map(t => t.id) ?? []

    let completedCount = 0
    if (topicIds.length > 0) {
      const { data: completedTopics } = await this.supabase
        .from('user_topic_progress')
        .select('topic_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('topic_id', topicIds)

      completedCount = completedTopics?.length || 0
    }

    const totalTopics = allTopics?.length || 0

    if (totalTopics > 0) {
      const progressPercentage = Math.round((completedCount / totalTopics) * 100)
      const status = progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started'

      await this.updatePlanProgress(userId, topic.education_plan_id, {
        status,
        progressPercentage
      })
    }
  }

  /**
   * Get enrollment statistics for a plan
   */
  async getPlanEnrollmentStats(planId: string): Promise<{
    totalEnrolled: number
    notStarted: number
    inProgress: number
    completed: number
    averageProgress: number
    completionRate: number
  }> {
    const { data: enrollments } = await this.supabase
      .from('user_plan_progress')
      .select('status, progress_percentage')
      .eq('education_plan_id', planId)

    if (!enrollments || enrollments.length === 0) {
      return {
        totalEnrolled: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        averageProgress: 0,
        completionRate: 0
      }
    }

    const totalEnrolled = enrollments.length
    const notStarted = enrollments.filter(e => e.status === 'not_started').length
    const inProgress = enrollments.filter(e => e.status === 'in_progress').length
    const completed = enrollments.filter(e => e.status === 'completed').length

    const totalProgress = enrollments.reduce((sum, e) => sum + e.progress_percentage, 0)
    const averageProgress = totalEnrolled > 0 ? Math.round(totalProgress / totalEnrolled) : 0
    const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0

    return {
      totalEnrolled,
      notStarted,
      inProgress,
      completed,
      averageProgress,
      completionRate
    }
  }

  /**
   * Get user's learning insights
   */
  async getUserLearningInsights(userId: string): Promise<{
    totalPlansEnrolled: number
    totalPlansCompleted: number
    totalTopicsCompleted: number
    totalTimeSpent: number
    currentStreak: number
    favoriteDifficultyLevel: string | null
  }> {
    const { data: enrollments } = await this.supabase
      .from('user_plan_progress')
      .select(`
        status,
        progress_percentage,
        education_plans (
          difficulty_level
        )
      `)
      .eq('user_id', userId)

    if (!enrollments || enrollments.length === 0) {
      return {
        totalPlansEnrolled: 0,
        totalPlansCompleted: 0,
        totalTopicsCompleted: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        favoriteDifficultyLevel: null
      }
    }

    const totalPlansEnrolled = enrollments.length
    const totalPlansCompleted = enrollments.filter(e => e.status === 'completed').length

    // Get topic completion data
    const { data: topicProgress } = await this.supabase
      .from('user_topic_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'completed')

    const totalTopicsCompleted = topicProgress?.length || 0

    // Calculate favorite difficulty level
    const completedPlans = enrollments.filter(e => e.status === 'completed')
    const difficultyCount = completedPlans.reduce((acc, e) => {
      type PlanDifficultyRelation = { difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null }
      const relationship = e.education_plans as PlanDifficultyRelation | PlanDifficultyRelation[] | null | undefined
      const level = Array.isArray(relationship)
        ? relationship[0]?.difficulty_level ?? null
        : relationship?.difficulty_level ?? null
      if (level) {
        acc[level] = (acc[level] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const favoriteDifficultyLevel = Object.keys(difficultyCount).length > 0
      ? Object.entries(difficultyCount).sort(([, a], [, b]) => b - a)[0][0]
      : null

    // TODO: Calculate actual time spent and streaks when we have that data
    const totalTimeSpent = 0 // Will be implemented later
    const currentStreak = 0 // Will be implemented later

    return {
      totalPlansEnrolled,
      totalPlansCompleted,
      totalTopicsCompleted,
      totalTimeSpent,
      currentStreak,
      favoriteDifficultyLevel
    }
  }
}
