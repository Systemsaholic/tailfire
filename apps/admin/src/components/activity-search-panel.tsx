'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, MapPin, AlertCircle, Star, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useActivitySearch } from '@/hooks/use-external-apis'
import type { NormalizedTourActivity } from '@tailfire/shared-types'
import { cn } from '@/lib/utils'

export interface SearchLocation {
  label: string
  lat: number
  lng: number
}

interface ActivitySearchPanelProps {
  onSelect: (activity: NormalizedTourActivity) => void
  /** @deprecated Use locations instead */
  latitude?: number
  /** @deprecated Use locations instead */
  longitude?: number
  /** Named locations the user can pick from (e.g. day start / day end) */
  locations?: SearchLocation[]
  className?: string
}

export function ActivitySearchPanel({
  onSelect,
  latitude,
  longitude,
  locations,
  className,
}: ActivitySearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [selectedLocationIdx, setSelectedLocationIdx] = useState(0)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  // Resolve active coordinates — prefer locations[] over legacy lat/lng props
  const activeLocation = locations?.[selectedLocationIdx]
  const activeLat = activeLocation?.lat ?? latitude
  const activeLng = activeLocation?.lng ?? longitude
  const locationLabel = activeLocation?.label

  const { data, isLoading, error } = useActivitySearch(
    { latitude: activeLat, longitude: activeLng, keyword: keyword || undefined, radius: 20 },
    { enabled: searchEnabled && activeLat !== undefined && activeLng !== undefined }
  )

  const canSearch = activeLat !== undefined && activeLng !== undefined

  const handleSearch = () => {
    if (canSearch) setSearchEnabled(true)
  }

  const handleSelect = (activity: NormalizedTourActivity) => {
    onSelect(activity)
    setSearchEnabled(false)
  }

  const results = data?.results || []

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIdx >= 0 && highlightedIdx < results.length) {
        handleSelect(results[highlightedIdx]!)
      } else {
        handleSearch()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(prev => {
        const next = Math.min(prev + 1, results.length - 1)
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIdx(prev => {
        const next = Math.max(prev - 1, 0)
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
      return
    }
  }, [highlightedIdx, results])

  const handleLocationChange = (value: string) => {
    setSelectedLocationIdx(Number(value))
    setSearchEnabled(false)
  }

  const hasResults = data?.results && data.results.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Location selector + keyword row */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Search tours in</span>
          {locations && locations.length > 1 ? (
            <Select
              value={String(selectedLocationIdx)}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger className="h-8 w-auto min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : locationLabel ? (
            <span className="text-sm font-medium truncate">{locationLabel}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">no location set</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Filter by keyword (optional)"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setSearchEnabled(false); setHighlightedIdx(-1) }}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={!canSearch || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {!canSearch && (
        <p className="text-xs text-gray-500">Set a day location to search for tours nearby</p>
      )}

      {error && !isLoading && (
        <div className="p-3 text-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          {data?.warning || 'Search failed. Try again.'}
        </div>
      )}

      {searchEnabled && !isLoading && !error && !hasResults && (
        <p className="text-sm text-gray-500 text-center py-2">No tours found nearby</p>
      )}

      {hasResults && (
        <ScrollArea className="h-72 border rounded-lg">
          <ul ref={listRef} className="divide-y divide-gray-100">
            {data.results.map((activity, idx) => (
              <li key={activity.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(activity)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                    idx === highlightedIdx && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {activity.pictures?.[0] ? (
                      <img
                        src={activity.pictures[0]}
                        alt=""
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-orange-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {activity.rating && (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <Star className="h-3 w-3 fill-current" />
                            {activity.rating.toFixed(1)}
                          </span>
                        )}
                        {activity.price ? (
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            {activity.price.currency} {activity.price.amount}
                          </span>
                        ) : (
                          <span className="text-gray-400">Price on request</span>
                        )}
                        {activity.duration && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {activity.duration.replace('PT', '').toLowerCase()}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {activity.description.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
