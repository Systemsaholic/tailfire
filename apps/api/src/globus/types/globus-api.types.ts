/**
 * Globus Family of Brands WebAPI types
 *
 * Covers Globus, Cosmos, and Monograms brands.
 * Avalon is excluded (handled by Traveltek Cruise API).
 */

// Supported brands (Avalon excluded — it's in Traveltek)
export enum GlobusBrand {
  Globus = 'Globus',
  Cosmos = 'Cosmos',
  Monograms = 'Monograms',
}

export const GLOBUS_BRAND_VALUES = Object.values(GlobusBrand)

// --- Raw XML → parsed intermediate types ---

export interface GlobusVacationRaw {
  TourCode: string
  Season: string
  Name: string
}

export interface GlobusTourRaw {
  TourNumber: string
  Brand: string
  Name: string
}

export interface GlobusDepartureRaw {
  Brand: string
  Name: string
  AirStartDate: string
  LandStartDate: string
  LandEndDate: string
  LandOnlyPrice: number
  ShipName: string
  Status: string
  DepartureCode: string
  GuaranteedDeparture: boolean
  PopularDeparture: boolean
  IntraTourAirRequired: boolean
  IntraTourAir: number
  IntraTourAirTax: number
  Single: number
  Triple: number
  TourStartAirportCity: string
  TourEndAirportCity: string
}

export interface GlobusDeparturePricingRaw {
  Price: number
  Discount: number
  CabinCategory: string | null
  DeparturePricingDetails:
    | { PromotionId: string; PromotionAmount: number }[]
    | null
}

export interface GlobusDepartureWithPricingRaw {
  Departure: GlobusDepartureRaw
  Pricing: { DeparturePricing: GlobusDeparturePricingRaw[] } | GlobusDeparturePricingRaw[]
}

export interface GlobusPromotionRaw {
  PromotionId: number
  Headline: string
  Disclaimer: string
  Category: string
  BookStartDate: string
  BookEndDate: string
  TravelStartDate: string
  TravelEndDate: string
  AskReceiveCode: string
  RequiresAir: boolean
}

export interface GlobusPromotionTourRaw {
  PromotionId: number
  TourCode: string
  Year: number
  Brand: string
}

// --- Transformed response types ---

export interface GlobusSearchResult {
  tourCode: string
  season: string
  name: string
}

export interface GlobusTour {
  tourNumber: string
  brand: string
  name: string
}

export interface GlobusDeparture {
  brand: string
  name: string
  airStartDate: string
  landStartDate: string
  landEndDate: string
  landOnlyPrice: number
  shipName: string
  status: string
  departureCode: string
  guaranteedDeparture: boolean
  popularDeparture: boolean
  intraTourAirRequired: boolean
  intraTourAir: number
  intraTourAirTax: number
  singleSupplement: number
  tripleReduction: number
  tourStartAirportCity: string
  tourEndAirportCity: string
  pricing: GlobusCabinPricing[]
}

export interface GlobusCabinPricing {
  price: number
  discount: number
  cabinCategory: string | null
  promotions: { promotionId: string; amount: number }[]
}

export interface GlobusPromotion {
  promotionId: number
  headline: string
  disclaimer: string
  category: string
  bookStartDate: string
  bookEndDate: string
  travelStartDate: string
  travelEndDate: string
  askReceiveCode: string
  requiresAir: boolean
  tours: { tourCode: string; year: number; brand: string }[]
}
