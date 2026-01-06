import type { ActivityType } from '@tailfire/shared-types/api'
import { getActivityTypeMetadata } from './activity-constants'

/**
 * Default start time for activities (9:00 AM)
 */
export const DEFAULT_START_TIME = '09:00'

/**
 * Get the default start datetime for an activity on a given day
 * @param dayDate ISO date string for the day (e.g., "2025-06-01")
 * @param startTime Optional start time in HH:mm format (defaults to 09:00)
 * @returns ISO datetime string (e.g., "2025-06-01T09:00")
 */
export function getDefaultStartDatetime(
  dayDate: string | null | undefined,
  startTime: string = DEFAULT_START_TIME
): string | null {
  if (!dayDate) return null

  // Parse the date and combine with start time
  const date = new Date(dayDate)
  const parts = startTime.split(':')
  const hours = parts[0] || '0'
  const minutes = parts[1] || '0'
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

  // Return in ISO format but without timezone (local time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
}

/**
 * Initial values for a new activity
 */
export interface InitialActivityValues {
  activityType: ActivityType
  name: string
  startDatetime: string | null
}

/**
 * Get initial values for a new activity
 * @param activityType The type of activity
 * @param dayDate Optional date for the day
 * @param customName Optional custom name override
 * @param startTime Optional start time in HH:mm format
 * @returns Initial activity values
 */
export function getInitialActivityValues(
  activityType: ActivityType,
  dayDate?: string | null,
  customName?: string,
  startTime?: string
): InitialActivityValues {
  const metadata = getActivityTypeMetadata(activityType)

  return {
    activityType,
    name: customName || metadata.defaultName,
    startDatetime: getDefaultStartDatetime(dayDate, startTime),
  }
}
