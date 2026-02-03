/**
 * Tour Detail DTOs
 *
 * Response types for tour detail and departure endpoints.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Tour itinerary day
 */
export class ItineraryDayDto {
  @ApiProperty({ description: 'Day number' })
  dayNumber!: number

  @ApiPropertyOptional({ description: 'Day title' })
  title?: string

  @ApiPropertyOptional({ description: 'Day description' })
  description?: string

  @ApiPropertyOptional({ description: 'Overnight city' })
  overnightCity?: string
}

/**
 * Tour hotel
 */
export class TourHotelDto {
  @ApiPropertyOptional({ description: 'Day number' })
  dayNumber?: number

  @ApiProperty({ description: 'Hotel name' })
  hotelName!: string

  @ApiPropertyOptional({ description: 'City' })
  city?: string

  @ApiPropertyOptional({ description: 'Description' })
  description?: string
}

/**
 * Tour media item
 */
export class TourMediaDto {
  @ApiProperty({ description: 'Media type', enum: ['image', 'brochure', 'video', 'map'] })
  mediaType!: 'image' | 'brochure' | 'video' | 'map'

  @ApiProperty({ description: 'Media URL' })
  url!: string

  @ApiPropertyOptional({ description: 'Caption' })
  caption?: string
}

/**
 * Tour inclusion
 */
export class TourInclusionDto {
  @ApiProperty({ description: 'Inclusion type', enum: ['included', 'excluded', 'highlight'] })
  inclusionType!: 'included' | 'excluded' | 'highlight'

  @ApiPropertyOptional({ description: 'Category' })
  category?: string

  @ApiProperty({ description: 'Description' })
  description!: string
}

/**
 * Tour detail response
 */
export class TourDetailResponseDto {
  @ApiProperty({ description: 'Tour UUID' })
  id!: string

  @ApiProperty({ description: 'Provider (e.g., globus)' })
  provider!: string

  @ApiProperty({ description: 'Provider identifier (tour code)' })
  providerIdentifier!: string

  @ApiProperty({ description: 'Operator code' })
  operatorCode!: string

  @ApiProperty({ description: 'Tour name' })
  name!: string

  @ApiPropertyOptional({ description: 'Season year' })
  season?: string

  @ApiPropertyOptional({ description: 'Trip duration in days' })
  days?: number

  @ApiPropertyOptional({ description: 'Number of nights' })
  nights?: number

  @ApiPropertyOptional({ description: 'Full description' })
  description?: string

  @ApiProperty({ type: [ItineraryDayDto], description: 'Day-by-day itinerary' })
  itinerary!: ItineraryDayDto[]

  @ApiProperty({ type: [TourHotelDto], description: 'Hotels' })
  hotels!: TourHotelDto[]

  @ApiProperty({ type: [TourMediaDto], description: 'Media items' })
  media!: TourMediaDto[]

  @ApiProperty({ type: [TourInclusionDto], description: 'Inclusions and highlights' })
  inclusions!: TourInclusionDto[]

  @ApiPropertyOptional({ description: 'Number of available departures' })
  departureCount?: number

  @ApiPropertyOptional({ description: 'Lowest price in cents' })
  lowestPriceCents?: number
}

/**
 * Cabin pricing
 */
export class CabinPricingDto {
  @ApiPropertyOptional({ description: 'Cabin category' })
  cabinCategory?: string

  @ApiProperty({ description: 'Price in cents' })
  priceCents!: number

  @ApiPropertyOptional({ description: 'Discount in cents' })
  discountCents?: number

  @ApiProperty({ description: 'Currency' })
  currency!: string
}

/**
 * Tour departure
 */
export class TourDepartureDto {
  @ApiProperty({ description: 'Departure UUID' })
  id!: string

  @ApiProperty({ description: 'Departure code' })
  departureCode!: string

  @ApiPropertyOptional({ description: 'Season' })
  season?: string

  @ApiPropertyOptional({ description: 'Land start date (YYYY-MM-DD)' })
  landStartDate?: string

  @ApiPropertyOptional({ description: 'Land end date (YYYY-MM-DD)' })
  landEndDate?: string

  @ApiPropertyOptional({ description: 'Status' })
  status?: string

  @ApiPropertyOptional({ description: 'Base price in cents' })
  basePriceCents?: number

  @ApiProperty({ description: 'Currency' })
  currency!: string

  @ApiProperty({ description: 'Guaranteed departure' })
  guaranteedDeparture!: boolean

  @ApiPropertyOptional({ description: 'Ship name (if applicable)' })
  shipName?: string

  @ApiPropertyOptional({ description: 'Start city' })
  startCity?: string

  @ApiPropertyOptional({ description: 'End city' })
  endCity?: string

  @ApiProperty({ type: [CabinPricingDto], description: 'Cabin pricing options' })
  cabinPricing!: CabinPricingDto[]
}

/**
 * Tour departures response
 */
export class TourDeparturesResponseDto {
  @ApiProperty({ description: 'Tour UUID' })
  tourId!: string

  @ApiProperty({ type: [TourDepartureDto] })
  departures!: TourDepartureDto[]

  @ApiProperty({ description: 'Total departures' })
  total!: number
}
