'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, MapPin, X, Loader2, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  searchAirports,
  getAirportByCode,
  formatAirportDisplay,
  type AirportSearchResult,
} from '@/lib/airport-utils'
import { useAirportLookup } from '@/hooks/use-flights'

interface AirportAutocompleteProps {
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Airport autocomplete component (ShadCN Combobox pattern)
 *
 * Allows searching by airport code (e.g., "YYZ"), city (e.g., "Toronto"),
 * or airport name (e.g., "Pearson") and returns the IATA code as the value.
 *
 * When a 3-letter code is entered that isn't in the static database,
 * automatically fetches airport details from the Aerodatabox API.
 */
export function AirportAutocomplete({
  value,
  onValueChange,
  placeholder = 'Select airport...',
  disabled = false,
  className,
}: AirportAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Check if search value looks like an airport code not in static database
  const isUnknownCode = React.useMemo(() => {
    const trimmed = searchValue.trim().toUpperCase()
    return (
      /^[A-Z]{3}$/.test(trimmed) &&
      searchAirports(trimmed, 1).length === 0
    )
  }, [searchValue])

  // Fetch from API when we have an unknown 3-letter code
  const {
    data: apiAirport,
    isLoading: isApiLoading,
    isError: isApiError,
  } = useAirportLookup(searchValue.trim(), {
    enabled: isUnknownCode && open,
  })

  // Get display value: show "YYZ - Toronto" format if known, otherwise just the code
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder
    const airport = getAirportByCode(value)
    return airport ? formatAirportDisplay(value) : value
  }, [value, placeholder])

  // Search airports based on input
  const filteredAirports = React.useMemo(() => {
    return searchAirports(searchValue, 15)
  }, [searchValue])

  // Create a combined result with API airport if found
  const apiAirportResult: AirportSearchResult | null = React.useMemo(() => {
    if (!apiAirport?.success || !apiAirport.data) return null
    return {
      code: apiAirport.data.iata,
      name: apiAirport.data.name,
      city: apiAirport.data.city,
      country: apiAirport.data.countryCode,
      lat: apiAirport.data.lat ?? 0,
      lon: apiAirport.data.lon ?? 0,
    }
  }, [apiAirport])

  const handleSelect = (code: string) => {
    // Toggle off if selecting current value
    if (code === value) {
      onValueChange(null)
    } else {
      onValueChange(code)
    }
    setOpen(false)
    setSearchValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Prevent form submission
      e.preventDefault()
      e.stopPropagation()

      if (filteredAirports.length > 0) {
        // Select the first match from static database
        const firstMatch = filteredAirports[0]
        if (firstMatch) {
          handleSelect(firstMatch.code)
        }
      } else if (apiAirportResult) {
        // Select API result
        handleSelect(apiAirportResult.code)
      } else if (searchValue.trim()) {
        // Try to use as custom code (3 letters) - fallback for when API fails
        const customCode = searchValue.trim().toUpperCase()
        if (/^[A-Z]{3}$/.test(customCode)) {
          onValueChange(customCode)
          setOpen(false)
          setSearchValue('')
        }
      }
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Airport"
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {value && <MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
            {displayValue}
          </span>
          <span className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
                aria-label="Clear airport selection"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code, city, or name..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {isApiLoading ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Looking up airport...
                </span>
              ) : searchValue.trim() && /^[A-Z]{3}$/i.test(searchValue.trim()) ? (
                isApiError ? (
                  <span className="text-sm">
                    Press Enter to use &quot;{searchValue.toUpperCase()}&quot;
                  </span>
                ) : (
                  <span className="text-sm">
                    Press Enter to use &quot;{searchValue.toUpperCase()}&quot;
                  </span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">
                  No airports found. Enter a 3-letter code.
                </span>
              )}
            </CommandEmpty>

            {/* Static database results */}
            {filteredAirports.length > 0 && (
              <CommandGroup heading="Airports">
                {filteredAirports.map((airport: AirportSearchResult) => (
                  <CommandItem
                    key={airport.code}
                    value={airport.code}
                    onSelect={() => handleSelect(airport.code)}
                    className="flex items-start py-2"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 mt-0.5 flex-shrink-0',
                        value === airport.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {airport.code}
                        </span>
                        <span className="text-sm truncate">{airport.city}</span>
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                          {airport.country}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {airport.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* API result for unknown airport code */}
            {apiAirportResult && filteredAirports.length === 0 && (
              <CommandGroup heading="Found via API">
                <CommandItem
                  value={apiAirportResult.code}
                  onSelect={() => handleSelect(apiAirportResult.code)}
                  className="flex items-start py-2"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 mt-0.5 flex-shrink-0',
                      value === apiAirportResult.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {apiAirportResult.code}
                      </span>
                      <span className="text-sm truncate">{apiAirportResult.city}</span>
                      <Globe className="h-3 w-3 text-blue-500 ml-auto flex-shrink-0" aria-label="Fetched from API" />
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {apiAirportResult.country}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {apiAirportResult.name}
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
