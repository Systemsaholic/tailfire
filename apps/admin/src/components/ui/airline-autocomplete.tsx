'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plane, X } from 'lucide-react'
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
import { searchAirlines, getAirlineByCode, formatAirlineDisplay, type Airline } from '@/lib/airlines-data'

interface AirlineAutocompleteProps {
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Airline autocomplete component (ShadCN Combobox pattern)
 *
 * Allows searching by airline name (e.g., "Air Canada") or code (e.g., "AC")
 * and returns the IATA code as the value.
 *
 * Supports custom values for airlines not in the list.
 */
export function AirlineAutocomplete({
  value,
  onValueChange,
  placeholder = 'Select airline...',
  disabled = false,
  className,
}: AirlineAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Get display value: show "AC - Air Canada" format if known, otherwise just the code
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder
    const airline = getAirlineByCode(value)
    return airline ? formatAirlineDisplay(airline) : value
  }, [value, placeholder])

  // Search airlines based on input
  const filteredAirlines = React.useMemo(() => {
    return searchAirlines(searchValue, 15)
  }, [searchValue])

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

      if (filteredAirlines.length > 0) {
        // Select the first match
        const firstMatch = filteredAirlines[0]
        if (firstMatch) {
          handleSelect(firstMatch.code)
        }
      } else if (searchValue.trim()) {
        // Try to use as custom code (2-3 alphanumeric)
        const customCode = searchValue.trim().toUpperCase()
        if (/^[A-Z0-9]{2,3}$/.test(customCode)) {
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
          aria-label="Airline"
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {value && <Plane className="h-3.5 w-3.5 text-muted-foreground" />}
            {displayValue}
          </span>
          <span className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
                aria-label="Clear airline selection"
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
            placeholder="Search airline or code..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue.trim() && /^[A-Z0-9]{2,3}$/i.test(searchValue.trim()) ? (
                <span className="text-sm">
                  Press Enter to use &quot;{searchValue.toUpperCase()}&quot;
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No airlines found. Enter a 2-3 letter code.
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredAirlines.map((airline: Airline) => (
                <CommandItem
                  key={airline.code}
                  value={airline.code}
                  onSelect={() => handleSelect(airline.code)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === airline.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {airline.code}
                  </span>
                  <span className="flex-1 truncate">{airline.name}</span>
                  {airline.country && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {airline.country}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
