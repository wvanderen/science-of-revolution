import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type EducationPlanTopic = Database['public']['Tables']['education_plan_topics']['Row']
type EducationPlanTopicInsert = Database['public']['Tables']['education_plan_topics']['Insert']
type EducationPlanTopicUpdate = Database['public']['Tables']['education_plan_topics']['Update']

type TopicReading = Database['public']['Tables']['topic_readings']['Row']
type TopicReadingInsert = Database['public']['Tables']['topic_readings']['Insert']
type TopicReadingUpdate = Database['public']['Tables']['topic_readings']['Update']

export interface CreateTopicData {
  educationPlanId: string
  title: string
  description?: string
  estimatedHours?: number
  isRequired?: boolean
}

export interface UpdateTopicData {
  title?: string
  description?: string
  estimatedHours?: number
  isRequired?: boolean
  orderIndex?: number
}

export interface AssignReadingData {
  resourceId: string
  readingType: 'required' | 'further' | 'optional'
  orderIndex: number
  notes?: string
}

export class PlanTopicRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a new topic within an education plan
   */
  async create(topicInput: CreateTopicData): Promise<EducationPlanTopic> {
    // First, get the highest order index for this plan to place the new topic at the end
    const { data: maxOrder } = await this.supabase
      .from('education_plan_topics')
      .select('order_index')
      .eq('education_plan_id', topicInput.educationPlanId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = maxOrder ? maxOrder.order_index + 1 : 0

    const topicData: EducationPlanTopicInsert = {
      education_plan_id: topicInput.educationPlanId,
      title: topicInput.title,
      description: topicInput.description || null,
      order_index: nextOrderIndex,
      estimated_hours: topicInput.estimatedHours || 4,
      is_required: topicInput.isRequired !== false // Default to true
    }

    const { data, error } = await this.supabase
      .from('education_plan_topics')
      .insert(topicData)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to create topic: ${error.message}`)
    }

    return data
  }

  /**
   * Get a single topic by ID
   */
  async getById(id: string): Promise<EducationPlanTopic | null> {
    const { data, error } = await this.supabase
      .from('education_plan_topics')
      .select(`
        *,
        education_plans (
          id,
          title,
          cohort_id
        )
      `)
      .eq('id', id)
      .single()

    if (error != null) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get topic: ${error.message}`)
    }

    return data
  }

  /**
   * Get all topics for a specific education plan
   */
  async getByPlanId(planId: string): Promise<EducationPlanTopic[]> {
    const { data, error } = await this.supabase
      .from('education_plan_topics')
      .select(`
        *,
        topic_readings (
          id,
          resource_id,
          reading_type,
          order_index,
          notes,
          resources (
            id,
            title,
            author,
            type
          )
        )
      `)
      .eq('education_plan_id', planId)
      .order('order_index', { ascending: true })

    if (error != null) {
      throw new Error(`Failed to get topics for plan: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a topic
   */
  async update(id: string, topicInput: UpdateTopicData): Promise<EducationPlanTopic> {
    const updateData: EducationPlanTopicUpdate = {}

    if (topicInput.title != null) updateData.title = topicInput.title
    if (topicInput.description !== undefined) updateData.description = topicInput.description
    if (topicInput.estimatedHours != null) updateData.estimated_hours = topicInput.estimatedHours
    if (topicInput.isRequired !== undefined) updateData.is_required = topicInput.isRequired
    if (topicInput.orderIndex !== undefined) updateData.order_index = topicInput.orderIndex

    const { data: updatedTopic, error } = await this.supabase
      .from('education_plan_topics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error != null) {
      throw new Error(`Failed to update topic: ${error.message}`)
    }

    return updatedTopic
  }

  /**
   * Delete a topic and all its readings
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('education_plan_topics')
      .delete()
      .eq('id', id)

    if (error != null) {
      throw new Error(`Failed to delete topic: ${error.message}`)
    }
  }

  /**
   * Reorder topics within a plan
   */
  async reorderTopics(planId: string, topicIds: string[]): Promise<void> {
    // Use a transaction to update all topic orders
    const updates = topicIds.map((topicId, index) =>
      this.supabase
        .from('education_plan_topics')
        .update({ order_index: index })
        .eq('id', topicId)
        .eq('education_plan_id', planId)
    )

    // Execute all updates
    const results = await Promise.allSettled(updates)

    // Check if any updates failed
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      const firstError = failures[0] as PromiseRejectedResult
      throw new Error(`Failed to reorder topics: ${firstError.reason}`)
    }
  }

  /**
   * Assign a reading to a topic
   */
  async assignReading(topicId: string, readingInput: AssignReadingData): Promise<TopicReading> {
    const readingData: TopicReadingInsert = {
      topic_id: topicId,
      resource_id: readingInput.resourceId,
      reading_type: readingInput.readingType,
      order_index: readingInput.orderIndex,
      notes: readingInput.notes || null
    }

    const { data: reading, error } = await this.supabase
      .from('topic_readings')
      .insert(readingData)
      .select(`
        *,
        resources (
          id,
          title,
          author,
          type
        )
      `)
      .single()

    if (error != null) {
      if (error.code === '23505') {
        throw new Error('This reading is already assigned to the topic')
      }
      throw new Error(`Failed to assign reading: ${error.message}`)
    }

    return reading
  }

  /**
   * Update a reading assignment
   */
  async updateReading(readingId: string, updates: Partial<Pick<TopicReadingUpdate, 'reading_type' | 'notes' | 'order_index'>>): Promise<TopicReading> {
    const updateData: TopicReadingUpdate = {}

    if (updates.reading_type !== undefined) {
      updateData.reading_type = updates.reading_type
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }

    if (updates.order_index !== undefined) {
      updateData.order_index = updates.order_index
    }

    const { data, error } = await this.supabase
      .from('topic_readings')
      .update(updateData)
      .eq('id', readingId)
      .select(`
        *,
        resources (
          id,
          title,
          author,
          type
        )
      `)
      .single()

    if (error != null) {
      throw new Error(`Failed to update reading: ${error.message}`)
    }

    return data
  }

  /**
   * Remove a reading from a topic
   */
  async removeReading(topicId: string, readingId: string): Promise<void> {
    const { error } = await this.supabase
      .from('topic_readings')
      .delete()
      .eq('topic_id', topicId)
      .eq('id', readingId)

    if (error != null) {
      throw new Error(`Failed to remove reading: ${error.message}`)
    }
  }

  /**
   * Reorder readings within a topic
   */
  async reorderReadings(topicId: string, readingOrder: Array<{ id: string; orderIndex: number }>): Promise<void> {
    const updates = readingOrder.map(({ id, orderIndex }) =>
      this.supabase
        .from('topic_readings')
        .update({ order_index: orderIndex })
        .eq('id', id)
        .eq('topic_id', topicId)
    )

    const results = await Promise.allSettled(updates)

    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      const firstError = failures[0] as PromiseRejectedResult
      throw new Error(`Failed to reorder readings: ${firstError.reason}`)
    }
  }

  /**
   * Get all readings for a topic
   */
  async getTopicReadings(topicId: string): Promise<TopicReading[]> {
    const { data, error } = await this.supabase
      .from('topic_readings')
      .select(`
        *,
        resources (
          id,
          title,
          author,
          type
        )
      `)
      .eq('topic_id', topicId)
      .order('order_index', { ascending: true })

    if (error != null) {
      throw new Error(`Failed to get topic readings: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get reading statistics for a topic
   */
  async getTopicStats(topicId: string): Promise<{
    totalReadings: number
    requiredReadings: number
    furtherReadings: number
    optionalReadings: number
    estimatedReadingTime: number
  }> {
    const { data: readings, error: readingsError } = await this.supabase
      .from('topic_readings')
      .select('reading_type, resource_id')
      .eq('topic_id', topicId)

    if (readingsError != null) {
      throw new Error(`Failed to load topic readings: ${readingsError.message}`)
    }

    if (!readings || readings.length === 0) {
      return {
        totalReadings: 0,
        requiredReadings: 0,
        furtherReadings: 0,
        optionalReadings: 0,
        estimatedReadingTime: 0
      }
    }

    const totalReadings = readings.length
    const requiredReadings = readings.filter(r => r.reading_type === 'required').length
    const furtherReadings = readings.filter(r => r.reading_type === 'further').length
    const optionalReadings = readings.filter(r => r.reading_type === 'optional').length

    // Estimate reading time (200 words per minute average)
    const resourceIds = Array.from(new Set(readings.map(r => r.resource_id))).filter((id): id is string => !!id)
    let totalWords = 0

    if (resourceIds.length > 0) {
      const { data: sections, error: sectionsError } = await this.supabase
        .from('resource_sections')
        .select('resource_id, word_count')
        .in('resource_id', resourceIds)

      if (sectionsError != null) {
        throw new Error(`Failed to load resource sections: ${sectionsError.message}`)
      }

      totalWords = sections?.reduce((sum, section) => sum + (section.word_count ?? 0), 0) ?? 0
    }

    const estimatedReadingTime = Math.ceil(totalWords / 200) // in minutes

    return {
      totalReadings,
      requiredReadings,
      furtherReadings,
      optionalReadings,
      estimatedReadingTime
    }
  }

  /**
   * Duplicate a topic (create new topic with same readings)
   */
  async duplicate(topicId: string, newPlanId: string, overrides: Partial<CreateTopicData> = {}): Promise<EducationPlanTopic> {
    // Get the original topic with its readings
    const originalTopic = await this.getById(topicId)
    if (originalTopic == null) {
      throw new Error('Original topic not found')
    }

    const originalReadings = await this.getTopicReadings(topicId)

    // Create new topic
    const newTopicData: CreateTopicData = {
      educationPlanId: newPlanId,
      title: overrides.title || `Copy of ${originalTopic.title}`,
      description: overrides.description || originalTopic.description || undefined,
      estimatedHours: overrides.estimatedHours || originalTopic.estimated_hours || undefined,
      isRequired: overrides.isRequired !== undefined ? overrides.isRequired : originalTopic.is_required
    }

    const newTopic = await this.create(newTopicData)

    // Copy all readings to the new topic
    for (const reading of originalReadings) {
      await this.assignReading(newTopic.id, {
        resourceId: reading.resource_id,
        readingType: reading.reading_type,
        orderIndex: reading.order_index,
        notes: reading.notes || undefined
      })
    }

    return newTopic
  }

  /**
   * Check if a topic has any enrolled users (progress started)
   */
  async hasEnrolledUsers(topicId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_topic_progress')
      .select('id')
      .eq('topic_id', topicId)
      .limit(1)

    if (error != null) {
      throw new Error(`Failed to check enrolled users: ${error.message}`)
    }

    return (data?.length || 0) > 0
  }
}
