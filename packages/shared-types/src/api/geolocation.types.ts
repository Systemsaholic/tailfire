/**
 * Geolocation Types
 *
 * Types for the cascading geolocation system that propagates
 * location changes from activities to itinerary days.
 */

export interface GeoLocation {
  name: string
  lat: number
  lng: number
  countryCode?: string
}

export interface DayLocation {
  startLocation: GeoLocation | null
  endLocation: GeoLocation | null
  startLocationOverride: boolean
  endLocationOverride: boolean
}

export interface CascadePreview {
  affectedDays: Array<{
    dayId: string
    dayNumber: number
    date?: string
    before: DayLocation
    after: DayLocation
  }>
  trigger: {
    activityId: string
    activityType: string
    description: string
  }
}

export interface CascadeConfirmation {
  dayIds: string[]
}

export interface CascadePreviewRequest {
  location: GeoLocation
  activityId: string
  activityType: string
  description?: string
}
