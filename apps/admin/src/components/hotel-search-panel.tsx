'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, Loader2, Building2, Star, MapPin, AlertCircle, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useDebouncedHotelLookup,
  getHotelSearchErrorMessage,
  classifyHotelSearchError,
} from '@/hooks/use-hotels'
import type { NormalizedHotelResult } from '@tailfire/shared-types'
import { cn } from '@/lib/utils'

interface HotelSearchPanelProps {
  /** Called when a hotel is selected */
  onSelect: (hotel: NormalizedHotelResult) => void
  /** Optional destination to filter results */
  destination?: string
  /** Check-in date (YYYY-MM-DD) for Amadeus pricing enrichment */
  checkIn?: string
  /** Check-out date (YYYY-MM-DD) for Amadeus pricing enrichment */
  checkOut?: string
  /** Number of adult guests */
  adults?: number
  /** Custom class name */
  className?: string
}

/**
 * HotelSearchPanel - Search and select hotels for auto-filling lodging forms
 *
 * Features:
 * - Debounced search as you type (300ms)
 * - Displays hotel name, rating, address
 * - Shows provider source (Google Places / Amadeus)
 * - Loading, empty, and error states
 */
export function HotelSearchPanel({
  onSelect,
  destination: _destination,
  checkIn,
  checkOut,
  adults,
  className,
}: HotelSearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const dateParams = useMemo(
    () => ({ checkIn, checkOut, adults }),
    [checkIn, checkOut, adults]
  )

  const {
    data: searchResults,
    isLoading,
    isFetching,
    error,
    searchValue,
    triggerSearch,
    clearSearch,
  } = useDebouncedHotelLookup(300, dateParams)

  // Handle input change - trigger search
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value)
      if (value.length >= 3) {
        triggerSearch(value)
        setIsExpanded(true)
      } else {
        clearSearch()
        if (value.length === 0) {
          setIsExpanded(false)
        }
      }
    },
    [triggerSearch, clearSearch]
  )

  // Handle hotel selection
  const handleSelect = useCallback(
    (hotel: NormalizedHotelResult) => {
      onSelect(hotel)
      setInputValue('')
      clearSearch()
      setIsExpanded(false)
    },
    [onSelect, clearSearch]
  )

  // Close panel without selection
  const handleBlur = useCallback(() => {
    // Delay to allow click on results
    setTimeout(() => {
      if (!inputValue) {
        setIsExpanded(false)
      }
    }, 200)
  }, [inputValue])

  const showResults = isExpanded && searchValue.length >= 3
  const hasResults = searchResults?.results && searchResults.results.length > 0
  const errorType = error ? classifyHotelSearchError(error) : null

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length >= 3 && setIsExpanded(true)}
          onBlur={handleBlur}
          placeholder="Search hotels to auto-fill..."
          className="pl-10 pr-10"
        />
        {(isLoading || isFetching) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Hint text */}
      {!showResults && (
        <p className="text-xs text-gray-500 mt-1">
          Type at least 3 characters to search
        </p>
      )}

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Loading State */}
          {isLoading && !hasResults && (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching hotels...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 text-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{getHotelSearchErrorMessage(error)}</p>
              {errorType === 'auth_error' && (
                <p className="text-xs text-gray-400 mt-1">
                  Check API credentials in Settings
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !hasResults && searchValue.length >= 3 && (
            <div className="p-4 text-center text-gray-500">
              <Building2 className="h-5 w-5 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hotels found for &quot;{searchValue}&quot;</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {/* Results List */}
          {hasResults && (
            <ScrollArea className="max-h-64">
              <ul className="divide-y divide-gray-100">
                {searchResults.results.map((hotel) => (
                  <li key={hotel.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(hotel)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        {/* Hotel Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-emerald-600" />
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {hotel.name}
                            </span>
                            {hotel.rating && (
                              <span className="flex items-center gap-0.5 text-sm text-amber-600">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {hotel.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Address */}
                          {hotel.location?.address && (
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {hotel.location.address}
                            </p>
                          )}

                          {/* Provider Badge & Pricing */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {hotel.provider === 'google_places' ? 'Google Places' :
                               hotel.provider === 'amadeus' ? 'Amadeus' :
                               hotel.provider === 'merged' ? 'Multiple Sources' : hotel.provider}
                            </span>
                            {hotel.offers?.[0]?.price && (
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {hotel.offers[0].price.currency} {hotel.offers[0].price.total}
                              </span>
                            )}
                            {hotel.website && (
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          {/* Provider Attribution */}
          {hasResults && searchResults.provider && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Results from {searchResults.provider === 'google_places' ? 'Google Places' :
                             searchResults.provider === 'amadeus' ? 'Amadeus Hotels' :
                             searchResults.provider}
                {searchResults.usedFallback && ' (fallback)'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
