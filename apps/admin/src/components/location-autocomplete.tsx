'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GeoLocation } from '@tailfire/shared-types/api'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface LocationAutocompleteProps {
  value: GeoLocation | null
  onChange: (location: GeoLocation | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Override Google Places types filter. Default: ['(cities)']. Pass [] for all types. */
  types?: string[]
}

interface Prediction {
  placeId: string
  mainText: string
  secondaryText: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  disabled,
  types,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value?.name || '')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const abortRef = useRef<AbortController>()

  // Sync query when external value changes
  useEffect(() => {
    setQuery(value?.name || '')
  }, [value?.name])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchPredictions = useCallback(async (input: string) => {
    if (!API_KEY || !input.trim()) {
      setPredictions([])
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
        },
        body: JSON.stringify({
          input,
          ...(((types ?? ['(cities)']).length > 0) && { includedPrimaryTypes: types ?? ['(cities)'] }),
        }),
        signal: abortRef.current.signal,
      })

      const data = await res.json()
      const suggestions = data.suggestions || []
      setPredictions(
        suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            mainText: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text || '',
            secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
          }))
      )
      setIsOpen(true)
    } catch (e: any) {
      if (e.name !== 'AbortError') setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }, [types])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % predictions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? predictions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < predictions.length) {
        handleSelect(predictions[activeIndex]!)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!val.trim()) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => fetchPredictions(val), 300)
  }

  const handleSelect = async (prediction: Prediction) => {
    if (!API_KEY) return

    setIsLoading(true)
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${prediction.placeId}?fields=displayName,location,addressComponents`,
        {
          headers: {
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'displayName,location,addressComponents',
          },
        }
      )
      const place = await res.json()
      if (place.location) {
        const countryComponent = place.addressComponents?.find(
          (c: any) => c.types?.includes('country')
        )
        const location: GeoLocation = {
          name: prediction.mainText || place.displayName?.text || '',
          lat: place.location.latitude,
          lng: place.location.longitude,
          countryCode: countryComponent?.shortText || undefined,
        }
        setQuery(location.name)
        onChange(location)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    onChange(null)
    setPredictions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-8"
        />
        {(value || query) && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ul className="max-h-60 overflow-auto py-1" role="listbox">
            {predictions.map((p, idx) => (
              <li key={p.placeId} role="option" aria-selected={idx === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent',
                    idx === activeIndex && 'bg-accent'
                  )}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{p.mainText}</div>
                    {p.secondaryText && (
                      <div className="text-xs text-muted-foreground">{p.secondaryText}</div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
