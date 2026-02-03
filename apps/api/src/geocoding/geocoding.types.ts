/**
 * Geocoding Types
 *
 * Types for geocoding service operations.
 */

export interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
  country?: string
  countryCode?: string
  region?: string
  provider: 'google' | 'cache'
}

export interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[]
  status: string
  error_message?: string
}

export interface GoogleGeocodingResult {
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components: GoogleAddressComponent[]
}

export interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}
