/**
 * Amadeus Hotels API Types
 *
 * Type definitions for Amadeus Hotel Search and Offers APIs.
 * @see https://developers.amadeus.com/self-service/category/hotels
 */

/**
 * Hotel list response from /v1/reference-data/locations/hotels/by-city
 */
export interface AmadeusHotelListResponse {
  data: AmadeusHotelBasic[]
  meta?: {
    count: number
    links?: {
      self?: string
      next?: string
    }
  }
}

/**
 * Basic hotel info from city search
 */
export interface AmadeusHotelBasic {
  /** Chain code (2 chars) */
  chainCode?: string
  /** IATA property code */
  iataCode?: string
  /** Amadeus hotel ID (8 chars) */
  hotelId: string
  /** Hotel name */
  name: string
  /** Amadeus duplicate ID (for merging) */
  dupeId?: number
  /** Geographic location */
  geoCode?: {
    latitude: number
    longitude: number
  }
  /** Address details */
  address?: {
    countryCode?: string
    stateCode?: string
    cityName?: string
    postalCode?: string
    lines?: string[]
  }
  /** Distance from city center */
  distance?: {
    value: number
    unit: 'KM' | 'MI'
  }
  /** Last updated */
  lastUpdate?: string
}

/**
 * Hotel offers response from /v3/shopping/hotel-offers
 */
export interface AmadeusHotelOffersResponse {
  data: AmadeusHotelOffer[]
  dictionaries?: {
    currencyConversionLookupRates?: Record<string, {
      rate: string
      target: string
    }>
  }
}

/**
 * Hotel offer details
 */
export interface AmadeusHotelOffer {
  /** Offer type */
  type: string
  /** Hotel info */
  hotel: {
    /** Hotel ID */
    hotelId: string
    /** Chain code */
    chainCode?: string
    /** Brand code */
    brandCode?: string
    /** Amadeus duplicate ID */
    dupeId?: number
    /** Hotel name */
    name: string
    /** City code */
    cityCode?: string
    /** Latitude */
    latitude?: number
    /** Longitude */
    longitude?: number
  }
  /** Available offers */
  offers: AmadeusOffer[]
  /** Whether it's available */
  available: boolean
  /** Self link */
  self?: string
}

/**
 * Individual room offer
 */
export interface AmadeusOffer {
  /** Offer ID */
  id: string
  /** Rate family code */
  rateFamilyEstimated?: {
    code: string
    type: string
  }
  /** Room info */
  room: {
    type?: string
    typeEstimated?: {
      category?: string
      beds?: number
      bedType?: string
    }
    description?: {
      text: string
      lang?: string
    }
  }
  /** Number of guests */
  guests?: {
    adults: number
    childAges?: number[]
  }
  /** Price details */
  price: AmadeusPrice
  /** Booking policies */
  policies?: AmadeusPolicies
  /** Check-in date */
  checkInDate?: string
  /** Check-out date */
  checkOutDate?: string
  /** Board type */
  boardType?: 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE'
}

/**
 * Price breakdown
 */
export interface AmadeusPrice {
  /** Currency code */
  currency: string
  /** Base price */
  base?: string
  /** Total price */
  total: string
  /** Tax breakdown */
  taxes?: {
    code?: string
    amount?: string
    currency?: string
    included?: boolean
    description?: string
    pricingFrequency?: string
    pricingMode?: string
  }[]
  /** Variations by stay */
  variations?: {
    average?: {
      base?: string
      total?: string
    }
    changes?: {
      startDate: string
      endDate: string
      base?: string
      total?: string
    }[]
  }
}

/**
 * Booking policies
 */
export interface AmadeusPolicies {
  /** Payment type */
  paymentType?: 'GUARANTEE' | 'DEPOSIT' | 'NONE'
  /** Cancellation policy */
  cancellation?: {
    type?: 'FULL_STAY'
    amount?: string
    numberOfNights?: number
    percentage?: string
    deadline?: string
    description?: {
      text: string
      lang?: string
    }
  }
  /** Guarantee policy */
  guarantee?: {
    acceptedPayments?: {
      creditCards?: string[]
      methods?: string[]
    }
    description?: {
      text: string
      lang?: string
    }
  }
  /** Deposit policy */
  deposit?: {
    amount?: string
    deadline?: string
    description?: {
      text: string
      lang?: string
    }
    acceptedPayments?: {
      creditCards?: string[]
      methods?: string[]
    }
  }
  /** Hold time */
  holdTime?: {
    deadline: string
  }
  /** Check-in/out times */
  checkInOut?: {
    checkIn?: string
    checkInDescription?: {
      text: string
      lang?: string
    }
    checkOut?: string
    checkOutDescription?: {
      text: string
      lang?: string
    }
  }
}

/**
 * Hotel ratings response from /v2/e-reputation/hotel-sentiments
 */
export interface AmadeusHotelSentimentsResponse {
  data: AmadeusHotelSentiment[]
  meta?: {
    count: number
  }
}

/**
 * Hotel sentiment/rating data
 */
export interface AmadeusHotelSentiment {
  /** Hotel ID */
  hotelId: string
  /** Overall rating (0-100) */
  overallRating?: number
  /** Number of reviews */
  numberOfReviews?: number
  /** Number of ratings */
  numberOfRatings?: number
  /** Sentiment breakdown */
  sentiments?: {
    /** Category scores */
    sleepQuality?: number
    service?: number
    facilities?: number
    roomComforts?: number
    valueForMoney?: number
    catering?: number
    swimmingPool?: number
    location?: number
    pointsOfInterest?: number
    staff?: number
  }
}

