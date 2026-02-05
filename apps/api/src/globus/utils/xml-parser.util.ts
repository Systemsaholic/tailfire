/**
 * Globus XML Parser Utilities
 *
 * Wraps fast-xml-parser for the 3 XML response shapes returned by the Globus WebAPI:
 * 1. DataSet/diffgram format (vacations, tours, promotions)
 * 2. ArrayOfString format (location/style keywords)
 * 3. ArrayOfDepartureWithPricing format (departures with cabin pricing)
 */

import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: true,
  isArray: (name) => {
    // Force arrays for known collection elements
    const arrayTags = [
      'Table',
      'Table1',
      'string',
      'DepartureWithPricing',
      'DeparturePricing',
      'DeparturePricingDetail',
      'TourMedia',
      'TourInfo',
      'DayMedia',
      'TourKeywords',
      'BasicHotelMedia',
    ]
    return arrayTags.includes(name)
  },
})

/**
 * Parse DataSet/diffgram XML responses (vacations, tours, promotions).
 * Structure: <DataSet><diffgr:diffgram><NewDataSet><TableName>...</TableName></NewDataSet></diffgr:diffgram></DataSet>
 */
export function parseDataSet<T>(xml: string, tableName: string): T[] {
  const parsed = parser.parse(xml)

  // Navigate: root > DataSet > diffgram > NewDataSet > Table
  const root = parsed?.DataSet ?? parsed?.dataSet ?? Object.values(parsed)[0]
  if (!root) return []

  const diffgram = root['diffgr:diffgram'] ?? root['diffgram'] ?? root
  if (!diffgram) return []

  const dataSet = diffgram.NewDataSet ?? diffgram.newDataSet ?? diffgram
  if (!dataSet) return []

  const rows = dataSet[tableName] ?? dataSet.Table ?? dataSet.Table1 ?? []
  return Array.isArray(rows) ? rows : [rows]
}

/**
 * Parse ArrayOfString XML responses (keyword lists).
 * Structure: <ArrayOfString><string>...</string></ArrayOfString>
 */
export function parseArrayOfString(xml: string): string[] {
  const parsed = parser.parse(xml)

  const root = parsed?.ArrayOfString ?? parsed?.arrayOfString ?? Object.values(parsed)[0]
  if (!root) return []

  const strings = root.string ?? root.String ?? []
  if (!strings) return []

  const arr = Array.isArray(strings) ? strings : [strings]
  return arr.map((s: unknown) => String(s)).filter(Boolean)
}

/**
 * Parse ArrayOfDepartureWithPricing XML responses.
 * Structure: <ArrayOfDepartureWithPricing><DepartureWithPricing>...</DepartureWithPricing></ArrayOfDepartureWithPricing>
 */
export function parseDeparturesWithPricing<T>(xml: string): T[] {
  const parsed = parser.parse(xml)

  const root =
    parsed?.ArrayOfDepartureWithPricing ??
    parsed?.arrayOfDepartureWithPricing ??
    Object.values(parsed)[0]
  if (!root) return []

  const departures = root.DepartureWithPricing ?? root.departureWithPricing ?? []
  return Array.isArray(departures) ? departures : [departures]
}

/**
 * Parse GetTourMedia DataSet response with multiple tables.
 * Returns all four table types: TourMedia, TourInfo, DayMedia, TourKeywords
 */
export function parseTourMediaDataSet(xml: string): {
  tourMedia: unknown[]
  tourInfo: unknown[]
  dayMedia: unknown[]
  tourKeywords: unknown[]
} {
  const parsed = parser.parse(xml)

  // Navigate: root > DataSet > diffgram > NewDataSet
  const root = parsed?.DataSet ?? parsed?.dataSet ?? Object.values(parsed)[0]
  if (!root) return { tourMedia: [], tourInfo: [], dayMedia: [], tourKeywords: [] }

  const diffgram = root['diffgr:diffgram'] ?? root['diffgram'] ?? root
  if (!diffgram) return { tourMedia: [], tourInfo: [], dayMedia: [], tourKeywords: [] }

  const dataSet = diffgram.NewDataSet ?? diffgram.newDataSet ?? diffgram
  if (!dataSet) return { tourMedia: [], tourInfo: [], dayMedia: [], tourKeywords: [] }

  const ensureArray = <T>(val: T | T[] | undefined): T[] => {
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  }

  return {
    tourMedia: ensureArray(dataSet.TourMedia),
    tourInfo: ensureArray(dataSet.TourInfo),
    dayMedia: ensureArray(dataSet.DayMedia),
    tourKeywords: ensureArray(dataSet.TourKeywords),
  }
}

/**
 * Parse ArrayOfBasicHotelMedia XML responses.
 * Structure: <ArrayOfBasicHotelMedia><BasicHotelMedia>...</BasicHotelMedia></ArrayOfBasicHotelMedia>
 */
export function parseHotelMediaArray<T>(xml: string): T[] {
  const parsed = parser.parse(xml)

  const root =
    parsed?.ArrayOfBasicHotelMedia ??
    parsed?.arrayOfBasicHotelMedia ??
    Object.values(parsed)[0]
  if (!root) return []

  const hotels = root.BasicHotelMedia ?? root.basicHotelMedia ?? []
  return Array.isArray(hotels) ? hotels : [hotels]
}

/**
 * Separate parser for XML-wrapped JSON responses.
 * Doesn't force arrays or retain attributes - just extracts text content.
 */
const jsonWrapperParser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  parseTagValue: false, // Keep as string, don't auto-parse
})

/**
 * Parse XML-wrapped JSON responses from GetExternalContentApiFile.
 * Structure: <?xml ...?><string xmlns="...">{"Brand":...}</string>
 *
 * The Globus API wraps JSON responses in an XML <string> element.
 * This function extracts and parses the inner JSON.
 */
export function parseStringWrappedJson<T>(data: string | T): T {
  // If already an object, return as-is
  if (typeof data !== 'string') {
    return data
  }

  const trimmed = data.trimStart()

  // Check if it's XML (starts with < after trimming whitespace/BOM)
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<string')) {
    const parsed = jsonWrapperParser.parse(data)

    // Extract the string content - may be direct value or in #text
    let jsonString: unknown = parsed?.string ?? parsed?.String ?? Object.values(parsed)[0]

    // Handle case where parser returns object with #text (shouldn't happen with ignoreAttributes)
    if (jsonString && typeof jsonString === 'object' && '#text' in (jsonString as Record<string, unknown>)) {
      jsonString = (jsonString as Record<string, unknown>)['#text']
    }

    // Handle array case (shouldn't happen with our parser config, but be safe)
    if (Array.isArray(jsonString)) {
      jsonString = jsonString[0]
      if (typeof jsonString === 'object' && '#text' in (jsonString as Record<string, unknown>)) {
        jsonString = (jsonString as Record<string, unknown>)['#text']
      }
    }

    if (typeof jsonString === 'string') {
      try {
        return JSON.parse(jsonString) as T
      } catch {
        throw new Error('Failed to parse JSON from XML string wrapper')
      }
    }

    throw new Error('Could not extract JSON string from XML response')
  }

  // Try parsing as plain JSON
  try {
    return JSON.parse(data) as T
  } catch {
    throw new Error('Response is neither valid JSON nor XML-wrapped JSON')
  }
}
