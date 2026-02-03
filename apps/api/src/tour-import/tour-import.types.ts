/**
 * Tour Import Types
 *
 * Type definitions for tour catalog data sync operations.
 */

// Globus brand identifiers
export type GlobusBrand = 'Globus' | 'Cosmos' | 'Monograms'

// Map brand to lowercase code for API and DB
export const GLOBUS_BRAND_CODES: Record<GlobusBrand, string> = {
  Globus: 'globus',
  Cosmos: 'cosmos',
  Monograms: 'monograms',
}

// All Globus brands (Avalon excluded - handled by Traveltek Cruise API)
export const GLOBUS_BRANDS: GlobusBrand[] = ['Globus', 'Cosmos', 'Monograms']

/**
 * Tour sync options
 */
export interface TourSyncOptions {
  /** Brands to sync (default: all) */
  brands?: GlobusBrand[]
  /** Currency for pricing (default: CAD) */
  currency?: 'CAD' | 'USD'
  /** Force full sync, ignoring last_seen_at tracking */
  forceFullSync?: boolean
  /** Dry run mode (list what would be synced without changes) */
  dryRun?: boolean
}

/**
 * Tour sync metrics
 */
export interface TourSyncMetrics {
  brand: string
  currency: string
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  toursSynced: number
  toursCreated: number
  toursUpdated: number
  toursMarkedInactive: number
  departuresSynced: number
  departuresCreated: number
  departuresUpdated: number
  departuresMarkedInactive: number
  itineraryDaysSynced: number
  hotelsSynced: number
  mediaSynced: number
  inclusionsSynced: number
  errors: TourSyncError[]
}

/**
 * Tour sync error
 */
export interface TourSyncError {
  tourCode?: string
  error: string
  errorType: 'parse_error' | 'db_error' | 'api_error' | 'validation_error' | 'unknown'
  timestamp: Date
}

/**
 * Combined sync result for all brands
 */
export interface TourSyncResult {
  startedAt: Date
  completedAt: Date
  durationMs: number
  brandResults: TourSyncMetrics[]
  totalToursSynced: number
  totalDeparturesSynced: number
  totalErrors: number
  status: 'completed' | 'partial' | 'failed'
}

/**
 * Globus External Content API File (tour data structure)
 * This is the shape of data from GetExternalContentApiFile endpoint
 */
export interface GlobusExternalContentTour {
  TourNumber: string
  TourCode?: string // Short tour code for URL construction (e.g., "CQ")
  TourName: string
  Season: string
  Days: number
  Nights: number
  Description?: string
  StartCity?: string
  EndCity?: string
  TravelStyles?: string[]
  Regions?: string[]
  Countries?: string[]

  // Itinerary
  Itinerary?: Array<{
    DayNumber: number
    Title: string
    Description: string
    OvernightCity?: string
  }>

  // Hotels
  Hotels?: Array<{
    DayNumber?: number
    HotelName: string
    City?: string
    Description?: string
  }>

  // Media
  Images?: Array<{
    Url: string
    Caption?: string
    Type?: 'image' | 'brochure' | 'video' | 'map'
  }>
  BrochureUrl?: string
  MapUrl?: string
  VideoUrl?: string

  // Inclusions
  Highlights?: string[]
  IncludedFeatures?: Array<{
    Category?: string
    Description: string
  }>
  ExcludedFeatures?: string[]

  // Departures with pricing
  Departures?: Array<{
    DepartureCode: string
    Season?: string
    LandStartDate: string
    LandEndDate: string
    Status?: string
    GuaranteedDeparture?: boolean
    ShipName?: string
    StartCity?: string
    EndCity?: string
    CabinPricing?: Array<{
      CabinCategory?: string
      Price: number
      Discount?: number
      Currency: string
    }>
  }>
}

/**
 * Globus External Content API Response
 */
export interface GlobusExternalContentResponse {
  Tours: GlobusExternalContentTour[]
  UpdatedAt?: string
  Currency?: string
}
