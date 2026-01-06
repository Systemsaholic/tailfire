'use client'

import { useState } from 'react'
import { Search, X, ChevronDown, ChevronUp, Filter, Check, ChevronsUpDown, Anchor } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { SailingSearchFilters, SailingFiltersResponse, CabinCategory } from '@/hooks/use-cruise-library'

interface CruiseFiltersProps {
  filters: SailingSearchFilters
  filterOptions: SailingFiltersResponse | undefined
  isLoading: boolean
  onChange: (filters: Partial<SailingSearchFilters>) => void
}

const DURATION_OPTIONS = [
  { value: 'any', label: 'Any Duration', min: undefined, max: undefined },
  { value: '1-3', label: '1-3 Nights', min: 1, max: 3 },
  { value: '4-6', label: '4-6 Nights', min: 4, max: 6 },
  { value: '7-9', label: '7-9 Nights', min: 7, max: 9 },
  { value: '10-14', label: '10-14 Nights', min: 10, max: 14 },
  { value: '15+', label: '15+ Nights', min: 15, max: undefined },
]

export function CruiseFilters({
  filters,
  filterOptions,
  isLoading,
  onChange,
}: CruiseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.q ?? '')
  const [portsPopoverOpen, setPortsPopoverOpen] = useState(false)

  // Count active filters (excluding search and sort)
  const activeFilterCount = [
    filters.cruiseLineId,
    filters.shipId,
    filters.regionId,
    filters.embarkPortId,
    filters.disembarkPortId,
    filters.sailDateFrom,
    filters.sailDateTo,
    filters.nightsMin !== undefined || filters.nightsMax !== undefined,
    filters.priceMinCents !== undefined || filters.priceMaxCents !== undefined,
    filters.portOfCallIds && filters.portOfCallIds.length > 0,
    filters.cabinCategory, // Include cabin category in count
  ].filter(Boolean).length

  // Handle cabin category change
  const handleCabinCategoryChange = (value: string) => {
    onChange({ cabinCategory: value === 'all' ? undefined : value as CabinCategory })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onChange({ q: searchInput || undefined })
  }

  const handleSearchClear = () => {
    setSearchInput('')
    onChange({ q: undefined })
  }

  const handleDurationChange = (value: string) => {
    const option = DURATION_OPTIONS.find((o) => o.value === value)
    if (option) {
      onChange({
        nightsMin: option.min,
        nightsMax: option.max,
      })
    }
  }

  const handleClearAll = () => {
    setSearchInput('')
    onChange({
      q: undefined,
      cruiseLineId: undefined,
      shipId: undefined,
      regionId: undefined,
      embarkPortId: undefined,
      disembarkPortId: undefined,
      sailDateFrom: undefined,
      sailDateTo: undefined,
      nightsMin: undefined,
      nightsMax: undefined,
      priceMinCents: undefined,
      priceMaxCents: undefined,
      portOfCallIds: undefined,
      cabinCategory: undefined,
    })
  }

  // Handle ports of call selection toggle
  // Uses allIds to handle duplicate port entries with same name
  const handlePortOfCallToggle = (port: { id: string; allIds?: string[] }) => {
    const currentPorts = filters.portOfCallIds ?? []
    const portIds = port.allIds ?? [port.id]

    // Check if this port is already selected (any of its IDs)
    const isSelected = portIds.some(id => currentPorts.includes(id))

    let newPorts: string[]
    if (isSelected) {
      // Remove all IDs for this port
      newPorts = currentPorts.filter(id => !portIds.includes(id))
    } else {
      // Add all IDs for this port (to match all duplicate entries)
      newPorts = [...currentPorts, ...portIds]
    }

    onChange({ portOfCallIds: newPorts.length > 0 ? newPorts : undefined })
  }

  // Check if a port is selected (by checking if any of its allIds are in the filter)
  const isPortSelected = (port: { id: string; allIds?: string[] }): boolean => {
    const currentPorts = filters.portOfCallIds ?? []
    const portIds = port.allIds ?? [port.id]
    return portIds.some(id => currentPorts.includes(id))
  }

  // Get selected port names for display
  const getSelectedPortNames = (): string => {
    const selected = filters.portOfCallIds ?? []
    if (selected.length === 0) return 'Select ports...'

    // Count unique port names selected (not IDs, since one port can have multiple IDs)
    const selectedPorts = (filterOptions?.portsOfCall ?? []).filter(p => isPortSelected(p))

    if (selectedPorts.length === 0) return 'Select ports...'
    if (selectedPorts.length === 1) return selectedPorts[0]?.name ?? '1 port'
    return `${selectedPorts.length} ports selected`
  }

  // Format price in dollars
  const formatPriceDollars = (cents: number): string => {
    return `$${Math.round(cents / 100).toLocaleString()}`
  }

  // Get current price range values for slider
  const getPriceRangeValues = (): [number, number] => {
    const minPrice = filterOptions?.priceRange?.min ?? 0
    const maxPrice = filterOptions?.priceRange?.max ?? 1000000
    return [
      filters.priceMinCents ?? minPrice,
      filters.priceMaxCents ?? maxPrice,
    ]
  }

  const handlePriceRangeChange = (values: number[]) => {
    const minPrice = filterOptions?.priceRange?.min ?? 0
    const maxPrice = filterOptions?.priceRange?.max ?? 1000000

    // Only set values if they differ from the full range
    const newMin = values[0] === minPrice ? undefined : values[0]
    const newMax = values[1] === maxPrice ? undefined : values[1]

    onChange({
      priceMinCents: newMin,
      priceMaxCents: newMax,
    })
  }

  // Get current duration value
  const getCurrentDuration = (): string => {
    const { nightsMin, nightsMax } = filters
    if (nightsMin === undefined && nightsMax === undefined) return 'any'
    const option = DURATION_OPTIONS.find(
      (o) => o.min === nightsMin && o.max === nightsMax
    )
    return option?.value ?? 'any'
  }

  return (
    <div className="bg-white border border-tern-gray-200 rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tern-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by cruise name, ship, port..."
            className="pl-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tern-gray-400 hover:text-tern-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Cabin Category Tabs */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-tern-gray-600 font-medium">Cabin Type:</span>
        <Tabs
          value={filters.cabinCategory ?? 'all'}
          onValueChange={handleCabinCategoryChange}
          className="w-auto"
        >
          <TabsList className="h-9 bg-tern-gray-100">
            <TabsTrigger value="all" className="text-sm px-4">
              All Cabins
            </TabsTrigger>
            <TabsTrigger value="inside" className="text-sm px-4">
              Inside
            </TabsTrigger>
            <TabsTrigger value="oceanview" className="text-sm px-4">
              Oceanview
            </TabsTrigger>
            <TabsTrigger value="balcony" className="text-sm px-4">
              Balcony
            </TabsTrigger>
            <TabsTrigger value="suite" className="text-sm px-4">
              Suite
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Cruise Line */}
        <div className="w-40">
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={filters.cruiseLineId ?? 'all'}
              onValueChange={(v) => onChange({ cruiseLineId: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Cruise Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cruise Lines</SelectItem>
                {filterOptions?.cruiseLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                    {line.count !== undefined && (
                      <span className="ml-1 text-tern-gray-400">({line.count})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Region */}
        <div className="w-40">
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={filters.regionId ?? 'all'}
              onValueChange={(v) => onChange({ regionId: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions?.regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                    {region.count !== undefined && (
                      <span className="ml-1 text-tern-gray-400">({region.count})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Duration */}
        <div className="w-36">
          <Select value={getCurrentDuration()} onValueChange={handleDurationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* More Filters Toggle */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'gap-1.5',
                activeFilterCount > 0 && 'border-tern-teal-500 text-tern-teal-600'
              )}
            >
              <Filter className="h-4 w-4" />
              More Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-tern-teal-100 text-tern-teal-700 text-xs px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-tern-gray-100">
              {/* Ship */}
              <div className="space-y-1.5">
                <Label className="text-xs">Ship</Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={filters.shipId ?? 'all'}
                    onValueChange={(v) => onChange({ shipId: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Ships" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ships</SelectItem>
                      {filterOptions?.ships.map((ship) => (
                        <SelectItem key={ship.id} value={ship.id}>
                          {ship.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Departure Port */}
              <div className="space-y-1.5">
                <Label className="text-xs">Departure Port</Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={filters.embarkPortId ?? 'all'}
                    onValueChange={(v) => onChange({ embarkPortId: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Ports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ports</SelectItem>
                      {filterOptions?.embarkPorts.map((port) => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Return Port */}
              <div className="space-y-1.5">
                <Label className="text-xs">Return Port</Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={filters.disembarkPortId ?? 'all'}
                    onValueChange={(v) => onChange({ disembarkPortId: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Ports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ports</SelectItem>
                      {filterOptions?.disembarkPorts?.map((port) => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <Label className="text-xs">Departure From</Label>
                <DatePickerEnhanced
                  value={filters.sailDateFrom ?? null}
                  onChange={(date) => onChange({ sailDateFrom: date || undefined })}
                  placeholder="Select date"
                  minDate={filterOptions?.dateRange.min ?? undefined}
                  maxDate={filterOptions?.dateRange.max ?? undefined}
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <Label className="text-xs">Departure To</Label>
                <DatePickerEnhanced
                  value={filters.sailDateTo ?? null}
                  onChange={(date) => onChange({ sailDateTo: date || undefined })}
                  placeholder="Select date"
                  minDate={filters.sailDateFrom ?? filterOptions?.dateRange.min ?? undefined}
                  maxDate={filterOptions?.dateRange.max ?? undefined}
                />
              </div>

              {/* Ports of Call (Multi-select) */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs flex items-center gap-1">
                  <Anchor className="h-3 w-3" />
                  Ports of Call
                </Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Popover open={portsPopoverOpen} onOpenChange={setPortsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={portsPopoverOpen}
                        className={cn(
                          'w-full justify-between font-normal',
                          (filters.portOfCallIds?.length ?? 0) > 0 && 'border-tern-teal-500'
                        )}
                      >
                        <span className="truncate">{getSelectedPortNames()}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search ports..." />
                        <CommandList>
                          <CommandEmpty>No ports found.</CommandEmpty>
                          <CommandGroup>
                            {filterOptions?.portsOfCall?.map((port) => {
                              const selected = isPortSelected(port)
                              return (
                                <CommandItem
                                  key={port.id}
                                  value={port.name}
                                  onSelect={() => handlePortOfCallToggle(port)}
                                >
                                  <div
                                    className={cn(
                                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                      selected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'opacity-50 [&_svg]:invisible'
                                    )}
                                  >
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="truncate">{port.name}</span>
                                  {port.count !== undefined && (
                                    <span className="ml-auto text-xs text-tern-gray-400">
                                      ({port.count})
                                    </span>
                                  )}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      {(filters.portOfCallIds?.length ?? 0) > 0 && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => onChange({ portOfCallIds: undefined })}
                          >
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {/* Show selected ports as badges (unique port names) */}
                {(() => {
                  const selectedPorts = (filterOptions?.portsOfCall ?? []).filter(p => isPortSelected(p))
                  if (selectedPorts.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedPorts.slice(0, 3).map((port) => (
                        <Badge
                          key={port.id}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handlePortOfCallToggle(port)}
                        >
                          {port.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                      {selectedPorts.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedPorts.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Price Range Slider */}
            {filterOptions?.priceRange?.min != null && filterOptions?.priceRange?.max != null && (
              <div className="space-y-3 pt-3 border-t border-tern-gray-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Price Range</Label>
                  <span className="text-xs text-tern-gray-500">
                    {formatPriceDollars(getPriceRangeValues()[0])} - {formatPriceDollars(getPriceRangeValues()[1])}
                  </span>
                </div>
                <Slider
                  value={getPriceRangeValues()}
                  onValueCommit={handlePriceRangeChange}
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                  step={10000} // $100 increments
                  className="w-full"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Clear All */}
        {(filters.q || activeFilterCount > 0) && (
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-tern-gray-500">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
