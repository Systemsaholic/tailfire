/**
 * Google Places API Types
 *
 * Type definitions for Google Places API (New) responses.
 * @see https://developers.google.com/maps/documentation/places/web-service/overview
 */

/**
 * Google Places Text Search response
 */
export interface GooglePlacesSearchResponse {
  places: GooglePlace[]
}

/**
 * Google Place object
 */
export interface GooglePlace {
  /** Resource name: "places/{place_id}" */
  name: string
  /** Unique identifier */
  id: string
  /** Display name localized */
  displayName?: {
    text: string
    languageCode?: string
  }
  /** Formatted address */
  formattedAddress?: string
  /** Address components */
  addressComponents?: GoogleAddressComponent[]
  /** Short formatted address */
  shortFormattedAddress?: string
  /** Location coordinates */
  location?: {
    latitude: number
    longitude: number
  }
  /** Place types (e.g., ["lodging", "establishment"]) */
  types?: string[]
  /** Primary type */
  primaryType?: string
  /** Google Maps URI */
  googleMapsUri?: string
  /** Website URL */
  websiteUri?: string
  /** Phone numbers */
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  /** Rating (1.0 - 5.0) */
  rating?: number
  /** Number of user ratings */
  userRatingCount?: number
  /** Price level (0-4) */
  priceLevel?: 'PRICE_LEVEL_UNSPECIFIED' | 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE'
  /** Business status */
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  /** Opening hours */
  regularOpeningHours?: GoogleOpeningHours
  /** Photos */
  photos?: GooglePhoto[]
  /** Reviews */
  reviews?: GoogleReview[]
  /** Editorial summary */
  editorialSummary?: {
    text: string
    languageCode?: string
  }

  // ============================================================================
  // AMENITY/FEATURE FIELDS (Hotel-specific)
  // ============================================================================

  /** Has free WiFi */
  hasFreeWifi?: boolean
  /** Has free parking */
  hasFreeParking?: boolean
  /** Has paid parking */
  hasPaidParking?: boolean
  /** Has pool */
  hasPool?: boolean
  /** Has fitness center */
  hasFitnessCenter?: boolean
  /** Has restaurant */
  hasRestaurant?: boolean
  /** Has bar */
  hasBar?: boolean
  /** Serves breakfast */
  servesBreakfast?: boolean
  /** Serves brunch */
  servesBrunch?: boolean
  /** Serves lunch */
  servesLunch?: boolean
  /** Serves dinner */
  servesDinner?: boolean
  /** Allows dogs */
  allowsDogs?: boolean
  /** Has laundry service */
  hasLaundryService?: boolean
  /** Has airport shuttle */
  hasAirportShuttle?: boolean
  /** Has room service */
  hasRoomService?: boolean
  /** Has spa */
  hasSpa?: boolean
  /** Has business center */
  hasBusinessCenter?: boolean
  /** Has concierge */
  hasConcierge?: boolean
  /** Outdoor seating */
  outdoorSeating?: boolean
  /** Good for children */
  goodForChildren?: boolean
  /** Wheelchair accessible entrance */
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  /** Parking options */
  parkingOptions?: {
    freeParkingLot?: boolean
    paidParkingLot?: boolean
    freeStreetParking?: boolean
    paidStreetParking?: boolean
    valetParking?: boolean
    freeGarageParking?: boolean
    paidGarageParking?: boolean
  }
  /** Payment options */
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
}

/**
 * Address component
 */
export interface GoogleAddressComponent {
  longText: string
  shortText: string
  types: string[]
  languageCode?: string
}

/**
 * Opening hours
 */
export interface GoogleOpeningHours {
  openNow?: boolean
  periods?: {
    open: { day: number; hour: number; minute: number }
    close?: { day: number; hour: number; minute: number }
  }[]
  weekdayDescriptions?: string[]
}

/**
 * Photo reference
 */
export interface GooglePhoto {
  /** Resource name: "places/{place_id}/photos/{photo_reference}" */
  name: string
  /** Photo width in pixels */
  widthPx: number
  /** Photo height in pixels */
  heightPx: number
  /** Author attributions */
  authorAttributions?: {
    displayName: string
    uri?: string
    photoUri?: string
  }[]
}

/**
 * Review
 */
export interface GoogleReview {
  /** Resource name */
  name: string
  /** Relative publish time (e.g., "2 weeks ago") */
  relativePublishTimeDescription?: string
  /** Rating (1-5) */
  rating: number
  /** Review text */
  text?: {
    text: string
    languageCode?: string
  }
  /** Original text if translated */
  originalText?: {
    text: string
    languageCode?: string
  }
  /** Author attribution */
  authorAttribution?: {
    displayName: string
    uri?: string
    photoUri?: string
  }
  /** Publish time ISO */
  publishTime?: string
}

/**
 * Text Search request body
 */
export interface GooglePlacesTextSearchRequest {
  /** Query string (e.g., "hotels in Paris") */
  textQuery: string
  /** Restrict results to specific type */
  includedType?: string
  /** Language for results */
  languageCode?: string
  /** Maximum results (1-20) */
  maxResultCount?: number
  /** Location bias for relevance */
  locationBias?: {
    circle?: {
      center: { latitude: number; longitude: number }
      radius: number
    }
    rectangle?: {
      low: { latitude: number; longitude: number }
      high: { latitude: number; longitude: number }
    }
  }
  /** Strict location restriction */
  locationRestriction?: {
    circle?: {
      center: { latitude: number; longitude: number }
      radius: number
    }
    rectangle?: {
      low: { latitude: number; longitude: number }
      high: { latitude: number; longitude: number }
    }
  }
  /** Ranking preference */
  rankPreference?: 'RELEVANCE' | 'DISTANCE'
  /** Filter by open now */
  openNow?: boolean
  /** Minimum rating filter */
  minRating?: number
  /** Price level filter */
  priceLevels?: string[]
}

/**
 * Field mask for API requests (controls response and billing)
 */
export const GOOGLE_PLACES_FIELD_MASKS = {
  /** Basic fields (cheaper) */
  BASIC: [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.types',
    'places.primaryType',
  ].join(','),

  /** Contact fields */
  CONTACT: [
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
  ].join(','),

  /** Rating/review fields */
  REVIEWS: [
    'places.rating',
    'places.userRatingCount',
    'places.reviews',
  ].join(','),

  /** Photo fields */
  PHOTOS: [
    'places.photos',
  ].join(','),

  /** All hotel-relevant fields for search (Text Search API) */
  HOTEL_SEARCH: [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.shortFormattedAddress',
    'places.location',
    'places.types',
    'places.rating',
    'places.userRatingCount',
    'places.photos',
    // Contact info for form auto-fill
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    // Editorial summary for description
    'places.editorialSummary',
    // Valid amenity/atmosphere fields for Google Places API (New)
    'places.servesBreakfast',
    'places.servesBrunch',
    'places.servesLunch',
    'places.servesDinner',
    'places.allowsDogs',
    'places.outdoorSeating',
    'places.goodForChildren',
    'places.accessibilityOptions',
    'places.parkingOptions',
  ].join(','),

  /** Full hotel details with all amenities */
  HOTEL_DETAILS: [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.shortFormattedAddress',
    'places.addressComponents',
    'places.location',
    'places.types',
    'places.googleMapsUri',
    'places.websiteUri',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.rating',
    'places.userRatingCount',
    'places.priceLevel',
    'places.businessStatus',
    'places.regularOpeningHours',
    'places.photos',
    'places.reviews',
    'places.editorialSummary',
    // Valid amenity/atmosphere fields for Google Places API (New)
    'places.servesBreakfast',
    'places.servesBrunch',
    'places.servesLunch',
    'places.servesDinner',
    'places.allowsDogs',
    'places.outdoorSeating',
    'places.goodForChildren',
    'places.restroom',
    'places.accessibilityOptions',
    'places.parkingOptions',
    'places.paymentOptions',
  ].join(','),
} as const
