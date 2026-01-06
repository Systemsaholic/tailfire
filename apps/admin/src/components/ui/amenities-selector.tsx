'use client'

/**
 * Amenities Selector Component
 *
 * A clean, organized UI for selecting amenities with:
 * - Selected items shown prominently at the top
 * - Search/filter functionality
 * - Collapsible categories (collapsed by default)
 * - Clear visual distinction between selected and unselected
 */

import { useState, useMemo } from 'react'
import { ChevronRight, X, Search, Loader2, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { AmenitiesByCategory } from '@tailfire/shared-types'

interface AmenitiesSelectorProps {
  /** Grouped amenities from the database */
  amenitiesGrouped: AmenitiesByCategory[] | undefined
  /** Currently selected amenity names */
  selectedAmenities: string[]
  /** Callback when selection changes */
  onToggle: (amenityName: string) => void
  /** Loading state */
  isLoading?: boolean
  /** Custom amenities not in the database (from API imports) */
  customAmenities?: string[]
}

export function AmenitiesSelector({
  amenitiesGrouped,
  selectedAmenities,
  onToggle,
  isLoading = false,
  customAmenities: _customAmenities = [],
}: AmenitiesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Get all database amenity names for checking custom amenities
  const dbAmenityNames = useMemo(() => {
    if (!amenitiesGrouped) return new Set<string>()
    return new Set(amenitiesGrouped.flatMap(g => g.amenities.map(a => a.name)))
  }, [amenitiesGrouped])

  // Filter amenities based on search query
  const filteredGroups = useMemo(() => {
    if (!amenitiesGrouped) return []
    if (!searchQuery.trim()) return amenitiesGrouped

    const query = searchQuery.toLowerCase()
    return amenitiesGrouped
      .map(group => ({
        ...group,
        amenities: group.amenities.filter(a =>
          a.name.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.amenities.length > 0)
  }, [amenitiesGrouped, searchQuery])

  // Get truly custom amenities (selected but not in DB)
  const actualCustomAmenities = useMemo(() => {
    return selectedAmenities.filter(a => !dbAmenityNames.has(a))
  }, [selectedAmenities, dbAmenityNames])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Count selected per category
  const getSelectedCount = (group: AmenitiesByCategory) => {
    return group.amenities.filter(a => selectedAmenities.includes(a.name)).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading amenities...</span>
      </div>
    )
  }

  if (!amenitiesGrouped || amenitiesGrouped.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">No amenities available.</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected amenities summary */}
      {selectedAmenities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">
              {selectedAmenities.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
            {selectedAmenities.map(amenity => (
              <Badge
                key={amenity}
                variant="default"
                className={cn(
                  'cursor-pointer pr-1 transition-colors',
                  dbAmenityNames.has(amenity)
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-blue-500 hover:bg-blue-600' // Custom/API amenities
                )}
                onClick={() => onToggle(amenity)}
              >
                {amenity}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Collapsible categories */}
      <div className="space-y-1 border rounded-lg divide-y">
        {filteredGroups.map(group => {
          const isExpanded = expandedCategories.has(group.category) || searchQuery.trim() !== ''
          const selectedCount = getSelectedCount(group)

          return (
            <Collapsible
              key={group.category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(group.category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                  <span className="font-medium text-gray-700">{group.label}</span>
                  <span className="text-sm text-gray-400">({group.amenities.length})</span>
                </div>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {selectedCount} selected
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                  {group.amenities.map(amenity => {
                    const isSelected = selectedAmenities.includes(amenity.name)
                    return (
                      <Badge
                        key={amenity.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'hover:bg-gray-100 hover:border-gray-400'
                        )}
                        onClick={() => onToggle(amenity.name)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {amenity.name}
                      </Badge>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {/* Custom/API imported amenities section */}
        {actualCustomAmenities.length > 0 && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-blue-700">Custom / API Imported</span>
                <span className="text-sm text-gray-400">({actualCustomAmenities.length})</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                {actualCustomAmenities.map(amenity => (
                  <Badge
                    key={amenity}
                    variant="default"
                    className="cursor-pointer transition-colors bg-blue-500 hover:bg-blue-600"
                    onClick={() => onToggle(amenity)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* No results message */}
      {searchQuery && filteredGroups.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No amenities match &quot;{searchQuery}&quot;
        </p>
      )}
    </div>
  )
}
