'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { SailingFiltersResponse, SailingSearchFilters } from '@/hooks/use-cruise-sailings'

export interface SailingFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterOptions?: SailingFiltersResponse
  filters: SailingSearchFilters
  onFiltersChange: (filters: Partial<SailingSearchFilters>) => void
}

/**
 * Advanced filters sheet for cruise sailings.
 */
export function SailingFiltersSheet({
  open,
  onOpenChange,
  filterOptions,
  filters,
  onFiltersChange,
}: SailingFiltersSheetProps) {
  const handleCruiseLineChange = (value: string) => {
    onFiltersChange({ cruiseLineId: value === 'all' ? undefined : value })
  }

  const handleRegionChange = (value: string) => {
    onFiltersChange({ regionId: value === 'all' ? undefined : value })
  }

  const handleShipChange = (value: string) => {
    onFiltersChange({ shipId: value === 'all' ? undefined : value })
  }

  const handleClearAll = () => {
    onFiltersChange({
      cruiseLineId: undefined,
      regionId: undefined,
      shipId: undefined,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Sailings</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Cruise Line Filter */}
          <div className="space-y-2">
            <Label>Cruise Line</Label>
            <Select
              value={filters.cruiseLineId || 'all'}
              onValueChange={handleCruiseLineChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cruise Lines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cruise Lines</SelectItem>
                {filterOptions?.cruiseLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label>Region</Label>
            <Select
              value={filters.regionId || 'all'}
              onValueChange={handleRegionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions?.regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ship Filter */}
          <div className="space-y-2">
            <Label>Ship</Label>
            <Select
              value={filters.shipId || 'all'}
              onValueChange={handleShipChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Ships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ships</SelectItem>
                {filterOptions?.ships?.map((ship) => (
                  <SelectItem key={ship.id} value={ship.id}>
                    {ship.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear All Button */}
          <div className="pt-4">
            <Button variant="outline" onClick={handleClearAll} className="w-full">
              Clear All Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
