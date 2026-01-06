/**
 * Booking.com API Types
 *
 * Type definitions for Booking.com DataCrawler API (via RapidAPI) responses.
 * @see https://rapidapi.com/DataCrawler/api/booking-com15
 */

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Standard wrapper for all Booking.com API responses
 */
export interface BookingComApiResponse<T> {
  status: boolean
  message: string
  timestamp: number
  data: T
}

// ============================================================================
// HOTEL SEARCH TYPES
// ============================================================================

/**
 * Hotel search result from searchHotelsByCoordinates
 */
export interface BookingComHotelSearchResult {
  hotel_id: number
  hotel_name: string
  hotel_name_trans?: string
  latitude: number
  longitude: number
  address: string
  city: string
  country_trans: string
  review_score?: number
  review_score_word?: string
  review_nr?: number
  main_photo_url?: string
  min_total_price?: number
  currency_code?: string
  distance_to_cc?: number
  distance?: string
  accommodation_type_name?: string
  class?: number
  class_is_estimated?: number
  url?: string
}

/**
 * Response from searchHotelsByCoordinates endpoint
 * Note: The actual API returns hotels in `result` array, not `hotels`
 */
export interface BookingComSearchResponse {
  result: BookingComHotelSearchResult[]
  page_loading_threshold?: number
  count?: number
  unfiltered_count?: number
}

// ============================================================================
// HOTEL DETAILS TYPES
// ============================================================================

/**
 * Full hotel details from getHotelDetails
 */
export interface BookingComHotelDetails {
  hotel_id: number
  hotel_name: string
  address: string
  city: string
  country_trans: string
  zip?: string
  latitude: number
  longitude: number
  url?: string
  review_score?: number
  review_score_word?: string
  review_nr?: number
  class?: number
  checkin?: {
    from?: string
    until?: string
  }
  checkout?: {
    from?: string
    until?: string
  }
  facilities_block?: {
    facilities: BookingComFacilityGroup[]
  }
  rooms?: BookingComRoom[]
  photos?: BookingComPhoto[]
  description?: string
}

/**
 * Facility group containing related amenities
 */
export interface BookingComFacilityGroup {
  name: string
  facilities: BookingComFacility[]
}

/**
 * Individual facility/amenity
 */
export interface BookingComFacility {
  name: string
  id: number
}

/**
 * Room type information
 */
export interface BookingComRoom {
  room_id: number
  room_name: string
  max_occupancy?: number
  photos?: BookingComPhoto[]
  facilities?: BookingComFacility[]
}

/**
 * Photo information
 */
export interface BookingComPhoto {
  url_original: string
  url_max300?: string
  url_square60?: string
  photo_id?: number
}

// ============================================================================
// DESTINATION TYPES
// ============================================================================

/**
 * Destination search result
 */
export interface BookingComDestination {
  dest_id: string
  dest_type: string
  city_name?: string
  country?: string
  label?: string
  region?: string
  hotels?: number
  nr_hotels?: number
}

// ============================================================================
// ENRICHMENT RESULT TYPES
// ============================================================================

/**
 * Normalized amenity result returned from enrichment
 */
export interface BookingComEnrichmentResult {
  /** Hotel matched in Booking.com */
  hotelId: string
  /** Match confidence (0-1) */
  matchScore: number
  /** Normalized amenity names */
  amenities: string[]
  /** Check-in time if available */
  checkInTime?: string
  /** Check-out time if available */
  checkOutTime?: string
}

// ============================================================================
// FACILITY MAPPING
// ============================================================================

/**
 * Map of Booking.com facility names to normalized amenity names
 * Case-insensitive, handles common translations
 */
export const BOOKING_COM_FACILITY_MAP: Record<string, string> = {
  // WiFi / Internet
  'free wifi': 'Free WiFi',
  'wi-fi': 'WiFi',
  'wifi': 'WiFi',
  'free wi-fi': 'Free WiFi',
  'internet': 'Internet',
  'free internet': 'Free Internet',
  // Pool
  'swimming pool': 'Pool',
  'outdoor swimming pool': 'Outdoor Pool',
  'indoor swimming pool': 'Indoor Pool',
  'pool': 'Pool',
  'heated pool': 'Heated Pool',
  'infinity pool': 'Infinity Pool',
  // Spa & Wellness
  'spa': 'Spa',
  'spa and wellness centre': 'Spa',
  'spa and wellness center': 'Spa',
  'sauna': 'Sauna',
  'hot tub': 'Hot Tub',
  'hot tub/jacuzzi': 'Hot Tub',
  'massage': 'Massage',
  'steam room': 'Steam Room',
  // Fitness
  'fitness centre': 'Fitness Center',
  'fitness center': 'Fitness Center',
  'gym': 'Fitness Center',
  'fitness': 'Fitness Center',
  // Dining
  'restaurant': 'Restaurant',
  'bar': 'Bar',
  'breakfast': 'Breakfast',
  'room service': 'Room Service',
  '24-hour room service': '24-Hour Room Service',
  'breakfast buffet': 'Breakfast Buffet',
  'on-site restaurant': 'Restaurant',
  // Services
  'airport shuttle': 'Airport Shuttle',
  'airport shuttle (free)': 'Free Airport Shuttle',
  'airport shuttle (surcharge)': 'Airport Shuttle',
  'laundry': 'Laundry',
  'dry cleaning': 'Dry Cleaning',
  'laundry service': 'Laundry',
  'concierge': 'Concierge',
  'concierge service': 'Concierge',
  '24-hour front desk': '24-Hour Front Desk',
  'front desk': 'Front Desk',
  'business centre': 'Business Center',
  'business center': 'Business Center',
  'meeting facilities': 'Meeting Rooms',
  // Parking
  'free parking': 'Free Parking',
  'parking': 'Parking',
  'on-site parking': 'Parking',
  'valet parking': 'Valet Parking',
  'garage': 'Parking Garage',
  // Room amenities
  'air conditioning': 'Air Conditioning',
  'air-conditioned': 'Air Conditioning',
  'heating': 'Heating',
  'balcony': 'Balcony',
  'terrace': 'Terrace',
  'kitchen': 'Kitchen',
  'kitchenette': 'Kitchenette',
  'minibar': 'Minibar',
  'safe': 'Safe',
  'in-room safe': 'In-Room Safe',
  // Family
  'family rooms': 'Family Rooms',
  'kids club': 'Kids Club',
  "children's playground": 'Playground',
  'babysitting': 'Babysitting',
  // Pet
  'pets allowed': 'Pet Friendly',
  'pet friendly': 'Pet Friendly',
  'pets': 'Pet Friendly',
  // Accessibility
  'facilities for disabled guests': 'Wheelchair Accessible',
  'wheelchair accessible': 'Wheelchair Accessible',
  'accessible': 'Accessible',
  // Beach
  'beachfront': 'Beachfront',
  'private beach': 'Private Beach',
  'beach': 'Beach Access',
  // Other
  'non-smoking rooms': 'Non-Smoking Rooms',
  'non-smoking': 'Non-Smoking',
  'elevator': 'Elevator',
  'lift': 'Elevator',
  'garden': 'Garden',
  'tennis court': 'Tennis Court',
  'golf course': 'Golf Course',
  'casino': 'Casino',
  'nightclub': 'Nightclub',
}

/**
 * Priority amenities to highlight (order matters for display)
 */
export const PRIORITY_AMENITIES = [
  'Free WiFi',
  'WiFi',
  'Pool',
  'Outdoor Pool',
  'Indoor Pool',
  'Spa',
  'Fitness Center',
  'Restaurant',
  'Bar',
  'Room Service',
  'Free Parking',
  'Airport Shuttle',
  'Free Airport Shuttle',
  '24-Hour Front Desk',
  'Concierge',
  'Business Center',
  'Pet Friendly',
  'Wheelchair Accessible',
  'Beachfront',
  'Air Conditioning',
]
