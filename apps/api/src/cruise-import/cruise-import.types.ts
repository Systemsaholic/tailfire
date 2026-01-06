/**
 * Cruise Import Types
 *
 * Type definitions for Traveltek FTP data import.
 * Types are derived from analyzing actual JSON data from cruise_sync_raw table.
 */

// ============================================================================
// TRAVELTEK JSON STRUCTURE (from FTP files)
// ============================================================================

export interface TraveltekSailingData {
  // IDs extracted from file path (not in JSON)
  codetocruiseid: string
  cruiselineid: string
  shipid: string

  // Fields from JSON
  name: string // Cruise name
  saildate: string // 'YYYY-MM-DD'
  nights: number
  sailnights?: number
  startdate?: string
  startportid: string
  endportid: string

  // Sailing metadata
  voyagecode?: string
  seadays?: number
  nofly?: boolean
  departuk?: boolean
  marketid?: number

  // Reference data lookups (from separate JSON fields)
  linecontent?: TraveltekCruiseLineContent
  shipcontent?: TraveltekShipContent
  ports?: Record<string, TraveltekPortInfo>
  regions?: Record<string, string> // { "4": "Europe", "9": "Scandinavia" }
  regionids?: string[]

  // Detailed data
  itinerary?: TraveltekItineraryDay[]
  prices?: Record<string, TraveltekPriceInfo> // Complex nested structure
  cachedprices?: Record<string, TraveltekCachedPrice>
  cabins?: Record<string, TraveltekCabinInfo>

  // Pre-calculated cheapest prices (CAD, per person)
  cheapestinside?: number
  cheapestoutside?: number
  cheapestbalcony?: number
  cheapestsuite?: number
  cheapestprice?: number

  // Alternate sailings
  altsailings?: TraveltekAltSailing[]
}

// ============================================================================
// CRUISE LINE CONTENT
// ============================================================================

export interface TraveltekCruiseLineContent {
  id?: number
  code?: string
  logo?: string // Logo URL
  name?: string
  niceurl?: string
  shortname?: string
  enginename?: string
  description?: string // HTML description
}

// ============================================================================
// SHIP CONTENT (includes deck plans and images)
// ============================================================================

export interface TraveltekShipContent {
  id?: number
  code?: string
  name?: string
  length?: number // Ship length in feet
  tonnage?: number // Gross tonnage
  launched?: string // 'YYYY-MM-DD'
  occupancy?: number // Passenger capacity
  shipclass?: string // e.g., "Arcadia class"
  shipdecks?: Record<string, TraveltekShipDeck>
  // Ship images
  defaultshipimage?: string // Default ship image URL
  defaultshipimage2k?: string // 2K resolution
  defaultshipimagehd?: string // HD resolution
  shipimages?: TraveltekShipImageEntry[] // Array of all ship images
}

export interface TraveltekShipImageEntry {
  imageurl?: string
  imageurl2k?: string
  imageurlhd?: string
  caption?: string
  default?: 'Y' | 'N'
}

export interface TraveltekShipDeck {
  deckname?: string
  planimage?: string // URL to deck plan image
  description?: string
  cabinlocations?: Record<string, TraveltekDeckCabinLocation>
}

export interface TraveltekDeckCabinLocation {
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  cabinid?: string
}

// ============================================================================
// CABIN TYPES
// ============================================================================

export interface TraveltekCabinInfo {
  id?: string
  name?: string
  deckid?: number
  codtype?: 'inside' | 'outside' | 'balcony' | 'suite' | string
  imageurl?: string
  imageurl2k?: string // Higher resolution
  imageurlhd?: string // HD resolution
  description?: string
  colourcode?: string // CSS color code
  allcabindecks?: string[]
  allcabinimages?: TraveltekCabinImage[]
}

export interface TraveltekCabinImage {
  url?: string
  caption?: string
}

// ============================================================================
// PORT INFORMATION
// ============================================================================

export interface TraveltekPortInfo {
  id?: number
  name?: string
  latitude?: string // As string from API
  longitude?: string
  country?: string
  countrycode?: string
  description?: string // HTML
  shortdescription?: string
  itinerarydescription?: string // Port-specific itinerary description
}

// ============================================================================
// ITINERARY
// ============================================================================

export interface TraveltekItineraryDay {
  day: string // Day number as string
  portid: number // Port ID as number
  name: string // Port name
  arrivetime?: string
  departtime?: string
  arrivedate?: string
  departdate?: string
  orderid?: number
  // Port details inline
  latitude?: string
  longitude?: string
  description?: string
  shortdescription?: string
  itinerarydescription?: string
}

// ============================================================================
// PRICING
// ============================================================================

export interface TraveltekPriceInfo {
  cabincode?: string
  cabincategory?: string
  baseprice?: number
  taxes?: number
  occupancy?: number
  perperson?: boolean
  available?: number
}

export interface TraveltekCachedPrice {
  id?: string
  price?: number
  currency?: string
  available?: boolean
}

// ============================================================================
// ALTERNATE SAILINGS
// ============================================================================

export interface TraveltekAltSailing {
  id?: string
  name?: string
  saildate?: string
  nights?: number
  cheapestprice?: number
}

// ============================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================================================

export interface TraveltekPrice {
  cabincode: string
  cabincategory: string
  baseprice: number
  taxes: number
  occupancy?: number
  perperson?: boolean
}

export interface TraveltekShipImage {
  url: string
  thumbnailurl?: string
  alttext?: string
  imagetype?: string
  ishero?: boolean
}

export interface TraveltekCabinType {
  cabincode: string
  category: string
  name: string
  description?: string
  imageurl?: string
  decklocations?: string
  defaultoccupancy?: number
}

// ============================================================================
// IMPORT METRICS & REPORTING
// ============================================================================

export interface ImportMetrics {
  /** Total files discovered on FTP (for dry-run this is the main output) */
  filesFound: number
  filesProcessed: number
  filesSkipped: number
  filesFailed: number
  sailingsUpserted: number
  sailingsCreated: number
  sailingsUpdated: number
  pricesInserted: number
  stopsInserted: number
  stubsCreated: {
    cruiseLines: number
    ships: number
    ports: number
    regions: number
  }
  /** Breakdown of skipped files by reason */
  skipReasons: {
    oversized: number
    downloadFailed: number
    parseError: number
    missingFields: number
    /** Files skipped because they haven't changed (delta sync) */
    unchanged: number
  }
  errors: ImportError[]
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  /** True if the sync was cancelled by user request */
  cancelled?: boolean
}

export interface ImportError {
  filePath: string
  error: string
  timestamp: Date
  providerSailingId?: string
}

export interface StubReport {
  type: 'cruise_lines' | 'cruise_ships' | 'cruise_ports' | 'cruise_regions'
  count: number
  items: Array<{
    id: string
    providerIdentifier: string
    name: string
    createdAt: Date
  }>
}

// ============================================================================
// FTP NAVIGATION
// ============================================================================

export interface FtpFileInfo {
  path: string
  name: string
  size: number
  modifiedAt?: Date
}

export interface FtpSyncOptions {
  dryRun?: boolean
  year?: number
  month?: number
  lineId?: string
  shipId?: string
  maxFiles?: number
  skipOversized?: boolean
  maxFileSizeBytes?: number
  fileTimeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  /** Include historical data (past months). Default: false (current month + future only) */
  includeHistorical?: boolean
  /** Max concurrent file downloads. Default: 4 */
  concurrency?: number
  /** FTP connection pool size. Default: concurrency + 1 */
  ftpPoolSize?: number
  /** Callback to check if cancellation was requested */
  shouldCancel?: () => boolean
  /** Enable delta sync to skip unchanged files. Default: true */
  deltaSync?: boolean
  /** Force full sync, ignoring delta tracking. Default: false */
  forceFullSync?: boolean
}

// ============================================================================
// SKIP REASONS (for metrics/logging)
// ============================================================================

export type SkipReason =
  | 'oversized'
  | 'historical'
  | 'parse_error'
  | 'missing_fields'
  | 'download_failed'

export interface SkippedFile {
  filePath: string
  reason: SkipReason
  details?: string
}

// ============================================================================
// PAST SAILING CLEANUP
// ============================================================================

export interface PastSailingCleanupResult {
  deletedSailings: number
  deletedStops: number
  deletedPrices: number
  deletedRegions: number
  cutoffDate: string
  durationMs: number
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheStats {
  cruiseLines: number
  ships: number
  ports: number
  regions: number
  totalEntries: number
  maxEntries: number
  hitRate: number
  hits: number
  misses: number
}

// ============================================================================
// PURGE TYPES
// ============================================================================

export interface PurgeResult {
  purgedCount: number
  maxSizeBytes: number
  oldestExpiredAt?: Date
  durationMs: number
}
