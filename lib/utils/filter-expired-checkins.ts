// Utility functions for check-in expiration logic

export interface CheckIn {
  id: string
  start_time: string
  duration_minutes: number
  status: string
  [key: string]: any
}

/**
 * Filter out expired check-ins from an array
 * A check-in is expired if current time > start_time + duration_minutes
 * @param checkIns - Array of check-ins to filter
 * @returns Array of only active (non-expired) check-ins
 */
export function filterActiveCheckIns<T extends CheckIn>(checkIns: T[]): T[] {
  const now = new Date()

  return checkIns.filter((checkIn) => {
    // Only filter active status check-ins
    if (checkIn.status !== "active") {
      return false
    }

    const expiresAt = calculateExpiresAt(checkIn.start_time, checkIn.duration_minutes)
    return expiresAt > now
  })
}

/**
 * Calculate when a check-in expires
 * @param startTime - ISO timestamp string
 * @param durationMinutes - Duration in minutes
 * @returns Date object representing expiration time
 */
export function calculateExpiresAt(startTime: string, durationMinutes: number): Date {
  const expiresAt = new Date(startTime)
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes)
  return expiresAt
}

/**
 * Calculate time remaining in minutes for a check-in
 * @param startTime - ISO timestamp string
 * @param durationMinutes - Duration in minutes
 * @returns Number of minutes remaining (0 if expired)
 */
export function calculateTimeRemaining(startTime: string, durationMinutes: number): number {
  const expiresAt = calculateExpiresAt(startTime, durationMinutes)
  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  return Math.max(0, Math.floor(diffMs / 60000)) // Convert to minutes
}

/**
 * Check if a check-in is expired
 * @param startTime - ISO timestamp string
 * @param durationMinutes - Duration in minutes
 * @returns true if expired, false otherwise
 */
export function isCheckInExpired(startTime: string, durationMinutes: number): boolean {
  return calculateTimeRemaining(startTime, durationMinutes) === 0
}

/**
 * Format time remaining for display
 * @param minutes - Number of minutes remaining
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes === 0) {
    return "Expired"
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}m`
  }
}
