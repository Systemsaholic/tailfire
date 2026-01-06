/**
 * Zod schemas for validating Traveltek cruise JSON data.
 *
 * Uses z.coerce for fields with inconsistent types in Traveltek API responses.
 * Normalizes empty strings to null for cleaner data handling.
 */

import { z } from 'zod'

// Helper to normalize empty strings to null
const emptyStringToNull = z
  .string()
  .transform((val) => (val === '' ? null : val))
  .nullable()

// Itinerary port/day entry
export const TraveltekItineraryPortSchema = z.object({
  id: z.number(),
  day: z.coerce.number(), // Comes as string "1"
  orderid: z.coerce.number(),
  portid: z.number(),
  name: z.string(),
  itineraryname: z.string(),
  arrivedate: z.string(), // "YYYY-MM-DD"
  departdate: z.string(), // "YYYY-MM-DD"
  arrivetime: z.string(), // "HH:MM"
  departtime: z.string(), // "HH:MM"
  description: z.string().optional().default(''),
  shortdescription: z.string().optional().default(''),
  itinerarydescription: z.string().optional().default(''),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  ownerid: z.string().optional().nullable(),
  supercedes: z.unknown().nullable().optional(),
  idlcrossed: z.unknown().nullable().optional(),
})

export type TraveltekItineraryPort = z.infer<typeof TraveltekItineraryPortSchema>

// Cruise line content
export const TraveltekLineContentSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: emptyStringToNull, // Can be empty string
  shortname: z.string().optional().nullable(),
  enginename: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  niceurl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export type TraveltekLineContent = z.infer<typeof TraveltekLineContentSchema>

// Ship content
export const TraveltekShipContentSchema = z.object({
  id: z.number(),
  name: z.string(),
  shipclass: z.string().nullable(), // Can be null
  cruiseline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  facilities: z.unknown().optional().nullable(),
  images: z.unknown().optional().nullable(),
})

export type TraveltekShipContent = z.infer<typeof TraveltekShipContentSchema>

// Cabin information
export const TraveltekCabinSchema = z.object({
  id: z.string(),
  name: z.string(),
  cabincode: z.string(),
  cabincode2: z.string().optional().default(''),
  codtype: z.string(), // e.g., "suite"
  description: z.string().optional().default(''),
  imageurl: z.string().optional().nullable(),
  imageurlhd: z.string().optional().nullable(),
  imageurl2k: z.string().optional().nullable(),
  colourcode: z.string().optional().nullable(),
  isdefault: z.string().optional().default('N'),
  validfrom: z.string().optional().nullable(),
  validto: z.string().optional().nullable(),
  deckid: z.number().optional().nullable(),
  allcabindecks: z.array(z.number()).optional().default([]),
  allcabinimages: z
    .array(
      z.object({
        id: z.number(),
        cabinid: z.number(),
        imageurl: z.string().optional().nullable(),
        imageurlhd: z.string().optional().nullable(),
        imageurl2k: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
})

export type TraveltekCabin = z.infer<typeof TraveltekCabinSchema>

// Region mapping
export const TraveltekRegionsSchema = z.record(z.string(), z.string())

export type TraveltekRegions = z.infer<typeof TraveltekRegionsSchema>

// Ports mapping
export const TraveltekPortsSchema = z.record(z.string(), z.string())

export type TraveltekPorts = z.infer<typeof TraveltekPortsSchema>

// Cheapest prices structure
export const TraveltekCheapestSchema = z.object({
  prices: z.object({
    inside: z.number().nullable(),
    outside: z.number().nullable(),
    balcony: z.number().nullable(),
    suite: z.number().nullable(),
    insidepricecode: z.string().nullable(),
    outsidepricecode: z.string().nullable(),
    balconypricecode: z.string().nullable(),
    suitepricecode: z.string().nullable(),
  }),
  cachedprices: z.object({
    inside: z.number().nullable(),
    outside: z.number().nullable(),
    balcony: z.number().nullable(),
    suite: z.number().nullable(),
    insidepricecode: z.string().nullable(),
    outsidepricecode: z.string().nullable(),
    balconypricecode: z.string().nullable(),
    suitepricecode: z.string().nullable(),
  }),
  combined: z.object({
    inside: z.number().nullable(),
    outside: z.number().nullable(),
    balcony: z.number().nullable(),
    suite: z.number().nullable(),
    insidepricecode: z.string().nullable(),
    outsidepricecode: z.string().nullable(),
    balconypricecode: z.string().nullable(),
    suitepricecode: z.string().nullable(),
    insidesource: z.string().nullable(),
    outsidesource: z.string().nullable(),
    balconysource: z.string().nullable(),
    suitesource: z.string().nullable(),
  }),
})

export type TraveltekCheapest = z.infer<typeof TraveltekCheapestSchema>

// Main cruise schema
export const TraveltekCruiseSchema = z.object({
  // Identity
  cruiseid: z.number(),
  voyagecode: z.string(),
  name: z.string(),

  // Cruise line
  linecontent: TraveltekLineContentSchema,

  // Ship
  shipid: z.number(),
  shipcontent: TraveltekShipContentSchema.optional().nullable(),

  // Duration
  nights: z.coerce.number().transform((val) => Math.max(0, val)), // Clamp to >=0

  // Dates
  startdate: z.string(), // "YYYY-MM-DD"
  enddate: z.string().nullable(), // Can be null

  // Ports - these come as strings but contain numeric IDs
  startportid: z.coerce.number(),
  startportname: z.string().nullable(),
  endportid: z.coerce.number(),
  endportname: z.string().nullable(),

  // Regions
  regionids: z.string().optional().nullable(),
  regions: TraveltekRegionsSchema.optional().default({}),

  // Ports reference
  ports: TraveltekPortsSchema.optional().default({}),

  // Itinerary
  itinerary: z.array(TraveltekItineraryPortSchema),

  // Cabins
  cabins: z.record(z.string(), TraveltekCabinSchema).optional().default({}),

  // Pricing
  cheapest: TraveltekCheapestSchema.optional().nullable(),
  cheapestprice: z.number().nullable().optional(),
  cheapestinside: z.number().nullable().optional(),
  cheapestoutside: z.number().nullable().optional(),
  cheapestbalcony: z.number().nullable().optional(),
  cheapestsuite: z.number().nullable().optional(),

  // Flags
  showcruise: z.string().optional().default('N'),
  nofly: z.string().optional().default('N'),
  departuk: z.string().optional().default('N'),

  // Other
  ownerid: z.string().optional().nullable(),
  cacheddate: z.string().optional().nullable(),
  cachedprices: z.unknown().optional(),
  flycruiseinfo: z.unknown().optional().nullable(),
  altsailings: z.unknown().optional().nullable(),
})

export type TraveltekCruise = z.infer<typeof TraveltekCruiseSchema>

/**
 * Validate and parse Traveltek cruise JSON.
 * Throws ZodError if validation fails (fail fast).
 */
export function parseTraveltekCruise(data: unknown): TraveltekCruise {
  return TraveltekCruiseSchema.parse(data)
}

/**
 * Safely validate Traveltek cruise JSON.
 * Returns success/error result for handling validation errors gracefully.
 */
export function safeParseTraveltekCruise(data: unknown): z.SafeParseReturnType<unknown, TraveltekCruise> {
  return TraveltekCruiseSchema.safeParse(data)
}
