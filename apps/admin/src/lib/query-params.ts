/**
 * Query Params Builder
 *
 * Centralizes URLSearchParams building with consistent handling of optional values.
 * Matches existing `if (filters.x)` guard behavior by skipping falsy values.
 *
 * Usage:
 * ```typescript
 * const query = buildQueryString({
 *   search: filters.search,
 *   status: filters.status,
 *   page: filters.page,
 * })
 * return api.get<TripDto[]>(`/trips${query}`)
 * ```
 *
 * IMPORTANT: This matches existing `if (filters.x)` guards by skipping:
 * - null, undefined
 * - empty strings ('')
 * - false
 * - empty arrays
 *
 * Do NOT change this behavior without coordinating with API expectations.
 */

type ParamValue = string | number | boolean | string[] | null | undefined

/**
 * Builds URLSearchParams from an object, skipping falsy values.
 *
 * @param params - Object of param key-value pairs
 * @returns URLSearchParams instance
 */
export function buildQueryParams(
  params: Record<string, ParamValue>
): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    // Skip null, undefined, empty strings, and false (matches existing `if (filters.x)` guards)
    if (value === null || value === undefined || value === '' || value === false) {
      continue
    }

    if (Array.isArray(value)) {
      // Skip empty arrays
      if (value.length === 0) continue
      // Append each array item with the same key
      for (const item of value) {
        searchParams.append(key, item)
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams
}

/**
 * Builds a query string from an object, with leading '?' if non-empty.
 *
 * @param params - Object of param key-value pairs
 * @returns Query string (e.g., '?search=foo&page=1') or empty string
 */
export function buildQueryString(
  params: Record<string, ParamValue>
): string {
  const qs = buildQueryParams(params).toString()
  return qs ? `?${qs}` : ''
}
