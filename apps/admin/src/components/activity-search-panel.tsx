'use client'

import { useState } from 'react'
import { Search, Loader2, MapPin, AlertCircle, Star, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivitySearch } from '@/hooks/use-external-apis'
import type { NormalizedTourActivity } from '@tailfire/shared-types'
import { cn } from '@/lib/utils'

interface ActivitySearchPanelProps {
  onSelect: (activity: NormalizedTourActivity) => void
  latitude?: number
  longitude?: number
  className?: string
}

export function ActivitySearchPanel({
  onSelect,
  latitude,
  longitude,
  className,
}: ActivitySearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const [searchEnabled, setSearchEnabled] = useState(false)

  const { data, isLoading, error } = useActivitySearch(
    { latitude, longitude, keyword: keyword || undefined, radius: 20 },
    { enabled: searchEnabled && latitude !== undefined && longitude !== undefined }
  )

  const canSearch = latitude !== undefined && longitude !== undefined

  const handleSearch = () => {
    if (canSearch) setSearchEnabled(true)
  }

  const handleSelect = (activity: NormalizedTourActivity) => {
    onSelect(activity)
    setSearchEnabled(false)
  }

  const hasResults = data?.results && data.results.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <Input
          placeholder="Filter by keyword (optional)"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setSearchEnabled(false) }}
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
        <p className="text-xs text-gray-500">Location coordinates needed to search activities</p>
      )}

      {error && !isLoading && (
        <div className="p-3 text-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          {data?.warning || 'Search failed. Try again.'}
        </div>
      )}

      {searchEnabled && !isLoading && !error && !hasResults && (
        <p className="text-sm text-gray-500 text-center py-2">No activities found nearby</p>
      )}

      {hasResults && (
        <ScrollArea className="max-h-72 border rounded-lg">
          <ul className="divide-y divide-gray-100">
            {data.results.map((activity) => (
              <li key={activity.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(activity)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
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
                          {activity.description}
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
