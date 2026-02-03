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
