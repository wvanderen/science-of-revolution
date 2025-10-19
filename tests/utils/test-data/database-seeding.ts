/**
 * Test Database Seeding for Progress-Related Test Scenarios
 *
 * This file provides utilities for seeding test databases with progress data
 * for comprehensive E2E testing scenarios.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TestResourceFixture, TestProgressData } from '../../fixtures/resources/test-documents'
import { testDataManager } from './test-data-manager'

/**
 * Database seeding configuration
 */
interface SeedingConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  cleanupBeforeSeeding: boolean
  seedTestData: boolean
  seedUserSessions: boolean
}

/**
 * Test user data for seeding
 */
interface TestUser {
  id: string
  email: string
  name: string
  created_at: string
}

/**
 * Database seeder for progress testing
 */
export class ProgressTestDatabaseSeeder {
  private supabase: SupabaseClient
  private config: SeedingConfig

  constructor(config: SeedingConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
  }

  /**
   * Run complete seeding process
   */
  async seed(): Promise<{ success: boolean; errors: string[]; seededCounts: Record<string, number> }> {
    const errors: string[] = []
    const seededCounts: Record<string, number> = {
      users: 0,
      resources: 0,
      progressEntries: 0,
      sessions: 0
    }

    try {
      // Cleanup existing test data if requested
      if (this.config.cleanupBeforeSeeding) {
        await this.cleanupTestData()
      }

      // Seed test users
      if (this.config.seedUserSessions) {
        const userCount = await this.seedTestUsers()
        seededCounts.users = userCount
      }

      // Seed test resources
      if (this.config.seedTestData) {
        const resourceCount = await this.seedTestResources()
        seededCounts.resources = resourceCount

        // Seed progress data
        const progressCount = await this.seedProgressData()
        seededCounts.progressEntries = progressCount
      }

      return { success: true, errors, seededCounts }
    } catch (error) {
      errors.push(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, errors, seededCounts }
    }
  }

  /**
   * Clean up existing test data
   */
  private async cleanupTestData(): Promise<void> {
    console.log('Cleaning up existing test data...')

    // Delete progress data for test users
    const testUserIds = this.getTestUserIds()
    if (testUserIds.length > 0) {
      await this.supabase
        .from('reading_progress')
        .delete()
        .in('user_id', testUserIds)

      await this.supabase
        .from('user_sessions')
        .delete()
        .in('user_id', testUserIds)
    }

    // Delete test resources
    const testResourceIds = this.getTestResourceIds()
    if (testResourceIds.length > 0) {
      await this.supabase
        .from('resources')
        .delete()
        .in('id', testResourceIds)
    }

    // Delete test users
    await this.supabase
      .from('profiles')
      .delete()
      .in('id', testUserIds)

    console.log('Test data cleanup completed')
  }

  /**
   * Seed test users
   */
  private async seedTestUsers(): Promise<number> {
    console.log('Seeding test users...')

    const testUsers: TestUser[] = [
      {
        id: 'test-user-001',
        email: 'test-user-001@example.com',
        name: 'Test User One',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-user-002',
        email: 'test-user-002@example.com',
        name: 'Test User Two',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-user-003',
        email: 'test-user-003@example.com',
        name: 'Test User Three',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-scroll-user',
        email: 'scroll-test@example.com',
        name: 'Scroll Test User',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-multi-user',
        email: 'multi-test@example.com',
        name: 'Multi Document Test User',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-time-user',
        email: 'time-test@example.com',
        name: 'Time-based Test User',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-device-user',
        email: 'device-test@example.com',
        name: 'Device Test User',
        created_at: new Date().toISOString()
      }
    ]

    let seededCount = 0
    for (const user of testUsers) {
      try {
        const { error } = await this.supabase
          .from('profiles')
          .upsert(user, { onConflict: 'id' })

        if (error) {
          console.error(`Failed to seed user ${user.id}:`, error)
        } else {
          seededCount++
        }
      } catch (error) {
        console.error(`Error seeding user ${user.id}:`, error)
      }
    }

    console.log(`Seeded ${seededCount} test users`)
    return seededCount
  }

  /**
   * Seed test resources
   */
  private async seedTestResources(): Promise<number> {
    console.log('Seeding test resources...')

    const testResources = testDataManager.getAllResources()
    let seededCount = 0

    for (const resource of testResources) {
      try {
        const resourceData = {
          id: resource.id,
          title: resource.title,
          content: resource.content,
          metadata: resource.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error } = await this.supabase
          .from('resources')
          .upsert(resourceData, { onConflict: 'id' })

        if (error) {
          console.error(`Failed to seed resource ${resource.id}:`, error)
        } else {
          seededCount++
        }
      } catch (error) {
        console.error(`Error seeding resource ${resource.id}:`, error)
      }
    }

    console.log(`Seeded ${seededCount} test resources`)
    return seededCount
  }

  /**
   * Seed progress data
   */
  private async seedProgressData(): Promise<number> {
    console.log('Seeding progress data...')

    let seededCount = 0
    const testResources = testDataManager.getAllResources()

    for (const resource of testResources) {
      const progressData = testDataManager.getProgressData(resource.id)

      for (const progress of progressData) {
        try {
          const progressRecord = {
            user_id: progress.userId,
            resource_id: progress.resourceId,
            scroll_percent: progress.scrollPercent,
            status: progress.status,
            last_position: progress.lastPosition,
            reading_time_minutes: progress.readingTime,
            updated_at: progress.timestamp,
            created_at: progress.timestamp
          }

          const { error } = await this.supabase
            .from('reading_progress')
            .upsert(progressRecord, { onConflict: 'user_id,resource_id' })

          if (error) {
            console.error(`Failed to seed progress for user ${progress.userId}, resource ${progress.resourceId}:`, error)
          } else {
            seededCount++
          }
        } catch (error) {
          console.error(`Error seeding progress for user ${progress.userId}, resource ${progress.resourceId}:`, error)
        }
      }
    }

    console.log(`Seeded ${seededCount} progress entries`)
    return seededCount
  }

  /**
   * Seed user sessions for testing
   */
  private async seedUserSessions(): Promise<number> {
    console.log('Seeding user sessions...')

    const testUserIds = this.getTestUserIds()
    let seededCount = 0

    for (const userId of testUserIds) {
      try {
        // Create recent session
        const recentSession = {
          user_id: userId,
          session_token: `session-${userId}-recent`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          created_at: new Date().toISOString()
        }

        const { error: recentError } = await this.supabase
          .from('user_sessions')
          .insert(recentSession)

        if (recentError) {
          console.error(`Failed to seed recent session for user ${userId}:`, recentError)
        } else {
          seededCount++
        }

        // Create expired session for testing
        const expiredSession = {
          user_id: userId,
          session_token: `session-${userId}-expired`,
          expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 48 hours ago
        }

        const { error: expiredError } = await this.supabase
          .from('user_sessions')
          .insert(expiredSession)

        if (expiredError) {
          console.error(`Failed to seed expired session for user ${userId}:`, expiredError)
        } else {
          seededCount++
        }
      } catch (error) {
        console.error(`Error seeding sessions for user ${userId}:`, error)
      }
    }

    console.log(`Seeded ${seededCount} user sessions`)
    return seededCount
  }

  /**
   * Get test user IDs
   */
  private getTestUserIds(): string[] {
    return [
      'test-user-001',
      'test-user-002',
      'test-user-003',
      'test-scroll-user',
      'test-multi-user',
      'test-time-user',
      'test-device-user'
    ]
  }

  /**
   * Get test resource IDs
   */
  private getTestResourceIds(): string[] {
    return testDataManager.getAllResources().map(resource => resource.id)
  }

  /**
   * Verify seeding results
   */
  async verifySeeding(): Promise<{ success: boolean; counts: Record<string, number>; errors: string[] }> {
    const counts: Record<string, number> = {}
    const errors: string[] = []

    try {
      // Count test users
      const testUserIds = this.getTestUserIds()
      const { count: userCount, error: userError } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', testUserIds)

      if (userError) {
        errors.push(`Failed to count users: ${userError.message}`)
      } else {
        counts.users = userCount || 0
      }

      // Count test resources
      const testResourceIds = this.getTestResourceIds()
      const { count: resourceCount, error: resourceError } = await this.supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .in('id', testResourceIds)

      if (resourceError) {
        errors.push(`Failed to count resources: ${resourceError.message}`)
      } else {
        counts.resources = resourceCount || 0
      }

      // Count progress data
      const { count: progressCount, error: progressError } = await this.supabase
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .in('user_id', testUserIds)

      if (progressError) {
        errors.push(`Failed to count progress data: ${progressError.message}`)
      } else {
        counts.progressEntries = progressCount || 0
      }

      // Count user sessions
      const { count: sessionCount, error: sessionError } = await this.supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .in('user_id', testUserIds)

      if (sessionError) {
        errors.push(`Failed to count sessions: ${sessionError.message}`)
      } else {
        counts.sessions = sessionCount || 0
      }

      return { success: errors.length === 0, counts, errors }
    } catch (error) {
      errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, counts, errors }
    }
  }
}

/**
 * Factory function for creating a seeder
 */
export function createProgressTestSeeder(config?: Partial<SeedingConfig>): ProgressTestDatabaseSeeder {
  const defaultConfig: SeedingConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    cleanupBeforeSeeding: false,
    seedTestData: true,
    seedUserSessions: true
  }

  return new ProgressTestDatabaseSeeder({ ...defaultConfig, ...config })
}

/**
 * Quick seed function for common scenarios
 */
export async function quickSeedForTesting(): Promise<void> {
  console.log('Starting quick seed for E2E testing...')

  const seeder = createProgressTestSeeder({
    cleanupBeforeSeeding: true,
    seedTestData: true,
    seedUserSessions: true
  })

  const result = await seeder.seed()

  if (result.success) {
    console.log('Quick seed completed successfully:', result.seededCounts)
  } else {
    console.error('Quick seed failed:', result.errors)
    throw new Error(`Seeding failed: ${result.errors.join(', ')}`)
  }
}