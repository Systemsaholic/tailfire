/**
 * Airlines Data
 *
 * Common airlines with IATA codes for autocomplete functionality.
 * Sorted alphabetically by name for easy lookup.
 *
 * TODO: This static dataset covers ~90 major airlines but will go stale.
 * Consider hydrating from:
 * - A reference_airlines table in the database
 * - A JSON asset file that can be updated without code changes
 * - An external airlines API (e.g., aviation-edge, cirium)
 */

export interface Airline {
  code: string // IATA 2-letter code
  name: string
  country?: string
}

/**
 * List of common airlines used by travel agencies.
 * Includes major carriers, regional airlines, and low-cost carriers.
 */
export const AIRLINES: Airline[] = [
  // North America
  { code: 'AA', name: 'American Airlines', country: 'USA' },
  { code: 'AC', name: 'Air Canada', country: 'Canada' },
  { code: 'AS', name: 'Alaska Airlines', country: 'USA' },
  { code: 'B6', name: 'JetBlue Airways', country: 'USA' },
  { code: 'DL', name: 'Delta Air Lines', country: 'USA' },
  { code: 'F8', name: 'Flair Airlines', country: 'Canada' },
  { code: 'F9', name: 'Frontier Airlines', country: 'USA' },
  { code: 'G4', name: 'Allegiant Air', country: 'USA' },
  { code: 'HA', name: 'Hawaiian Airlines', country: 'USA' },
  { code: 'NK', name: 'Spirit Airlines', country: 'USA' },
  { code: 'PD', name: 'Porter Airlines', country: 'Canada' },
  { code: 'QK', name: 'Jazz Aviation', country: 'Canada' },
  { code: 'RV', name: 'Air Canada Rouge', country: 'Canada' },
  { code: 'SY', name: 'Sun Country Airlines', country: 'USA' },
  { code: 'TS', name: 'Air Transat', country: 'Canada' },
  { code: 'UA', name: 'United Airlines', country: 'USA' },
  { code: 'WN', name: 'Southwest Airlines', country: 'USA' },
  { code: 'WS', name: 'WestJet', country: 'Canada' },
  { code: 'WG', name: 'Sunwing Airlines', country: 'Canada' },
  { code: '8P', name: 'Pacific Coastal Airlines', country: 'Canada' },
  { code: 'MO', name: 'Calm Air', country: 'Canada' },
  { code: 'Y4', name: 'Volaris', country: 'Mexico' },
  { code: 'AM', name: 'Aeromexico', country: 'Mexico' },
  { code: '4O', name: 'Interjet', country: 'Mexico' },

  // Europe
  { code: 'AF', name: 'Air France', country: 'France' },
  { code: 'AY', name: 'Finnair', country: 'Finland' },
  { code: 'AZ', name: 'ITA Airways', country: 'Italy' },
  { code: 'BA', name: 'British Airways', country: 'UK' },
  { code: 'EI', name: 'Aer Lingus', country: 'Ireland' },
  { code: 'EW', name: 'Eurowings', country: 'Germany' },
  { code: 'FR', name: 'Ryanair', country: 'Ireland' },
  { code: 'IB', name: 'Iberia', country: 'Spain' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines', country: 'Netherlands' },
  { code: 'LH', name: 'Lufthansa', country: 'Germany' },
  { code: 'LO', name: 'LOT Polish Airlines', country: 'Poland' },
  { code: 'LX', name: 'Swiss International Air Lines', country: 'Switzerland' },
  { code: 'OS', name: 'Austrian Airlines', country: 'Austria' },
  { code: 'SK', name: 'SAS Scandinavian Airlines', country: 'Sweden' },
  { code: 'SN', name: 'Brussels Airlines', country: 'Belgium' },
  { code: 'TP', name: 'TAP Air Portugal', country: 'Portugal' },
  { code: 'U2', name: 'easyJet', country: 'UK' },
  { code: 'VY', name: 'Vueling', country: 'Spain' },
  { code: 'VS', name: 'Virgin Atlantic', country: 'UK' },
  { code: 'W6', name: 'Wizz Air', country: 'Hungary' },

  // Middle East
  { code: 'EK', name: 'Emirates', country: 'UAE' },
  { code: 'EY', name: 'Etihad Airways', country: 'UAE' },
  { code: 'GF', name: 'Gulf Air', country: 'Bahrain' },
  { code: 'MS', name: 'EgyptAir', country: 'Egypt' },
  { code: 'QR', name: 'Qatar Airways', country: 'Qatar' },
  { code: 'RJ', name: 'Royal Jordanian', country: 'Jordan' },
  { code: 'SV', name: 'Saudia', country: 'Saudi Arabia' },
  { code: 'TK', name: 'Turkish Airlines', country: 'Turkey' },
  { code: 'WY', name: 'Oman Air', country: 'Oman' },

  // Asia Pacific
  { code: 'AI', name: 'Air India', country: 'India' },
  { code: 'AK', name: 'AirAsia', country: 'Malaysia' },
  { code: 'BR', name: 'EVA Air', country: 'Taiwan' },
  { code: 'CA', name: 'Air China', country: 'China' },
  { code: 'CI', name: 'China Airlines', country: 'Taiwan' },
  { code: 'CX', name: 'Cathay Pacific', country: 'Hong Kong' },
  { code: 'CZ', name: 'China Southern Airlines', country: 'China' },
  { code: 'GA', name: 'Garuda Indonesia', country: 'Indonesia' },
  { code: 'JL', name: 'Japan Airlines', country: 'Japan' },
  { code: 'KE', name: 'Korean Air', country: 'South Korea' },
  { code: 'MH', name: 'Malaysia Airlines', country: 'Malaysia' },
  { code: 'MU', name: 'China Eastern Airlines', country: 'China' },
  { code: 'NH', name: 'All Nippon Airways', country: 'Japan' },
  { code: 'NZ', name: 'Air New Zealand', country: 'New Zealand' },
  { code: 'OZ', name: 'Asiana Airlines', country: 'South Korea' },
  { code: 'PR', name: 'Philippine Airlines', country: 'Philippines' },
  { code: 'QF', name: 'Qantas', country: 'Australia' },
  { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore' },
  { code: 'TG', name: 'Thai Airways', country: 'Thailand' },
  { code: 'TR', name: 'Scoot', country: 'Singapore' },
  { code: 'VA', name: 'Virgin Australia', country: 'Australia' },
  { code: 'VN', name: 'Vietnam Airlines', country: 'Vietnam' },

  // Latin America & Caribbean
  { code: 'AR', name: 'Aerolineas Argentinas', country: 'Argentina' },
  { code: 'AV', name: 'Avianca', country: 'Colombia' },
  { code: 'BW', name: 'Caribbean Airlines', country: 'Trinidad' },
  { code: 'CM', name: 'Copa Airlines', country: 'Panama' },
  { code: 'G3', name: 'Gol Linhas Aereas', country: 'Brazil' },
  { code: 'JJ', name: 'LATAM Brasil', country: 'Brazil' },
  { code: 'LA', name: 'LATAM Airlines', country: 'Chile' },

  // Africa
  { code: 'ET', name: 'Ethiopian Airlines', country: 'Ethiopia' },
  { code: 'KQ', name: 'Kenya Airways', country: 'Kenya' },
  { code: 'SA', name: 'South African Airways', country: 'South Africa' },
  { code: 'RO', name: 'Royal Air Maroc', country: 'Morocco' },
].sort((a, b) => a.name.localeCompare(b.name))

/**
 * Search airlines by code or name
 */
export function searchAirlines(query: string, limit = 10): Airline[] {
  if (!query.trim()) return AIRLINES.slice(0, limit)

  const searchTerm = query.toLowerCase().trim()

  // Exact code match gets priority
  const exactCodeMatch = AIRLINES.filter(
    (a) => a.code.toLowerCase() === searchTerm
  )

  // Starts with matches
  const startsWithMatches = AIRLINES.filter(
    (a) =>
      (a.code.toLowerCase().startsWith(searchTerm) ||
        a.name.toLowerCase().startsWith(searchTerm)) &&
      !exactCodeMatch.includes(a)
  )

  // Contains matches
  const containsMatches = AIRLINES.filter(
    (a) =>
      (a.code.toLowerCase().includes(searchTerm) ||
        a.name.toLowerCase().includes(searchTerm)) &&
      !exactCodeMatch.includes(a) &&
      !startsWithMatches.includes(a)
  )

  return [...exactCodeMatch, ...startsWithMatches, ...containsMatches].slice(0, limit)
}

/**
 * Get airline by IATA code
 */
export function getAirlineByCode(code: string): Airline | undefined {
  return AIRLINES.find((a) => a.code.toUpperCase() === code.toUpperCase())
}

/**
 * Format airline for display: "AC - Air Canada"
 */
export function formatAirlineDisplay(airline: Airline): string {
  return `${airline.code} - ${airline.name}`
}
