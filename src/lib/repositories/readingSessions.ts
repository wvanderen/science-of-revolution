import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type ReadingSession = Database['public']['Tables']['plan_reading_sessions']['Row']
type ReadingSessionInsert = Database['public']['Tables']['plan_reading_sessions']['Insert']
type ReadingSessionUpdate = Database['public']['Tables']['plan_reading_sessions']['Update']

export interface SessionAnalytics {
  totalSessions: number
  totalReadingTime: number // seconds
  averageSessionTime: number // seconds
  completedSessions: number
  completionRate: number // percentage
  sectionsViewed: number
  lastSessionDate: string | null
}

export interface UserReadingInsights {
  totalReadingTime: number // seconds
  totalSessions: number
  currentStreak: number // days
  completedReadings: number
  averageProgressPerSession: number // percentage
  mostActiveTime: string | null // hour of day
  recentSessions: ReadingSession[]
}

/**
 * Repository for managing reading session tracking and analytics
 */
export class ReadingSessionRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Start a new reading session
   */
  async startSession(data: {
    userId: string
    planId: string
    topicId: string
    resourceId: string
  }): Promise<ReadingSession> {
    const { data: session, error } = await this.supabase
      .from('plan_reading_sessions')
      .insert({
        user_id: data.userId,
        education_plan_id: data.planId,
        topic_id: data.topicId,
        resource_id: data.resourceId,
        session_start: new Date().toISOString()
      })
      .select()
      .single()

    if (error != null) throw error
    return session
  }

  /**
   * Update an active reading session
   */
  async updateSession(
    sessionId: string,
    updates: {
      readingTime?: number
      scrollProgress?: number
      sectionsViewed?: number
      completed?: boolean
    }
  ): Promise<ReadingSession> {
    const updateData: ReadingSessionUpdate = {}

    if (updates.readingTime != null) {
      updateData.reading_time_seconds = updates.readingTime
    }
    if (updates.scrollProgress != null) {
      updateData.scroll_progress = updates.scrollProgress
    }
    if (updates.sectionsViewed != null) {
      updateData.sections_viewed = updates.sectionsViewed
    }
    if (updates.completed != null) {
      updateData.completed = updates.completed
    }

    const { data, error } = await this.supabase
      .from('plan_reading_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * End a reading session
   */
  async endSession(sessionId: string): Promise<ReadingSession> {
    const { data, error } = await this.supabase
      .from('plan_reading_sessions')
      .update({
        session_end: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Get active session for a user and resource
   */
  async getActiveSession(
    userId: string,
    resourceId: string
  ): Promise<ReadingSession | null> {
    const { data, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .is('session_end', null)
      .order('session_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error != null) throw error
    return data
  }

  /**
   * Get session analytics for a resource
   */
  async getResourceAnalytics(
    userId: string,
    resourceId: string
  ): Promise<SessionAnalytics> {
    const { data: sessions, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .order('session_start', { ascending: false })

    if (error != null) throw error

    const totalSessions = sessions?.length ?? 0
    const totalReadingTime = sessions?.reduce((sum, s) => sum + (s.reading_time_seconds ?? 0), 0) ?? 0
    const completedSessions = sessions?.filter(s => s.completed).length ?? 0
    const sectionsViewed = sessions?.reduce((sum, s) => sum + (s.sections_viewed ?? 0), 0) ?? 0

    return {
      totalSessions,
      totalReadingTime,
      averageSessionTime: totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      sectionsViewed,
      lastSessionDate: sessions?.[0]?.session_start ?? null
    }
  }

  /**
   * Get session analytics for a topic
   */
  async getTopicAnalytics(
    userId: string,
    topicId: string
  ): Promise<SessionAnalytics> {
    const { data: sessions, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .order('session_start', { ascending: false })

    if (error != null) throw error

    const totalSessions = sessions?.length ?? 0
    const totalReadingTime = sessions?.reduce((sum, s) => sum + (s.reading_time_seconds ?? 0), 0) ?? 0
    const completedSessions = sessions?.filter(s => s.completed).length ?? 0
    const sectionsViewed = sessions?.reduce((sum, s) => sum + (s.sections_viewed ?? 0), 0) ?? 0

    return {
      totalSessions,
      totalReadingTime,
      averageSessionTime: totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      sectionsViewed,
      lastSessionDate: sessions?.[0]?.session_start ?? null
    }
  }

  /**
   * Get session analytics for a plan
   */
  async getPlanAnalytics(
    userId: string,
    planId: string
  ): Promise<SessionAnalytics> {
    const { data: sessions, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('education_plan_id', planId)
      .order('session_start', { ascending: false })

    if (error != null) throw error

    const totalSessions = sessions?.length ?? 0
    const totalReadingTime = sessions?.reduce((sum, s) => sum + (s.reading_time_seconds ?? 0), 0) ?? 0
    const completedSessions = sessions?.filter(s => s.completed).length ?? 0
    const sectionsViewed = sessions?.reduce((sum, s) => sum + (s.sections_viewed ?? 0), 0) ?? 0

    return {
      totalSessions,
      totalReadingTime,
      averageSessionTime: totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      sectionsViewed,
      lastSessionDate: sessions?.[0]?.session_start ?? null
    }
  }

  /**
   * Get comprehensive user reading insights
   */
  async getUserInsights(userId: string): Promise<UserReadingInsights> {
    // Get all sessions for the user
    const { data: sessions, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(100)

    if (error != null) throw error

    const totalSessions = sessions?.length ?? 0
    const totalReadingTime = sessions?.reduce((sum, s) => sum + (s.reading_time_seconds ?? 0), 0) ?? 0
    const completedReadings = sessions?.filter(s => s.completed).length ?? 0

    // Calculate average progress per session
    const totalProgress = sessions?.reduce((sum, s) => sum + (s.scroll_progress ?? 0), 0) ?? 0
    const averageProgressPerSession = totalSessions > 0 ? Math.round(totalProgress / totalSessions) : 0

    // Get current streak using the database function
    const { data: streakData } = await this.supabase.rpc('get_user_reading_streak', {
      p_user_id: userId
    })
    const currentStreak = streakData ?? 0

    // Find most active time (hour of day)
    let mostActiveTime: string | null = null
    if (sessions && sessions.length > 0) {
      const hourCounts = new Map<number, number>()
      sessions.forEach(session => {
        const hour = new Date(session.session_start).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
      })

      const mostActiveHour = Array.from(hourCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0]

      if (mostActiveHour != null) {
        const hour12 = mostActiveHour > 12 ? mostActiveHour - 12 : mostActiveHour === 0 ? 12 : mostActiveHour
        const ampm = mostActiveHour >= 12 ? 'PM' : 'AM'
        mostActiveTime = `${hour12}:00 ${ampm}`
      }
    }

    return {
      totalReadingTime,
      totalSessions,
      currentStreak,
      completedReadings,
      averageProgressPerSession,
      mostActiveTime,
      recentSessions: sessions?.slice(0, 10) ?? []
    }
  }

  /**
   * Get recent sessions for a user
   */
  async getRecentSessions(
    userId: string,
    limit: number = 10
  ): Promise<ReadingSession[]> {
    const { data, error } = await this.supabase
      .from('plan_reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(limit)

    if (error != null) throw error
    return data ?? []
  }
}
