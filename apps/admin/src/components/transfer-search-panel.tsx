'use client'

import { useState } from 'react'
import { Search, Loader2, Car, AlertCircle, Clock, Users } from 'lucide-react'
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
import { useTransferSearch } from '@/hooks/use-external-apis'
import type { NormalizedTransferResult, TransferLocationType } from '@tailfire/shared-types'
import { cn } from '@/lib/utils'

interface TransferSearchPanelProps {
  onSelect: (transfer: NormalizedTransferResult) => void
  defaultPickupAddress?: string
  defaultDropoffAddress?: string
  defaultDate?: string
  defaultTime?: string
  className?: string
}

export function TransferSearchPanel({
  onSelect,
  defaultPickupAddress = '',
  defaultDropoffAddress = '',
  defaultDate = '',
  defaultTime = '',
  className,
}: TransferSearchPanelProps) {
  const [pickupType, setPickupType] = useState<TransferLocationType>('airport')
  const [pickupCode, setPickupCode] = useState('')
  const [pickupAddress, setPickupAddress] = useState(defaultPickupAddress)
  const [dropoffType, setDropoffType] = useState<TransferLocationType>('hotel')
  const [dropoffCode, setDropoffCode] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState(defaultDropoffAddress)
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime || '10:00')
  const [passengers, setPassengers] = useState('2')
  const [searchEnabled, setSearchEnabled] = useState(false)

  const { data, isLoading, error } = useTransferSearch(
    {
      pickupType,
      pickupCode: pickupCode || undefined,
      pickupAddress: pickupAddress || undefined,
      dropoffType,
      dropoffCode: dropoffCode || undefined,
      dropoffAddress: dropoffAddress || undefined,
      date,
      time,
      passengers: parseInt(passengers, 10),
    },
    { enabled: searchEnabled }
  )

  const canSearch = date && time && (pickupCode || pickupAddress) && (dropoffCode || dropoffAddress)

  const handleSearch = () => {
    if (canSearch) setSearchEnabled(true)
  }

  const handleSelect = (transfer: NormalizedTransferResult) => {
    onSelect(transfer)
    setSearchEnabled(false)
  }

  const hasResults = data?.results && data.results.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Pickup */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={pickupType} onValueChange={(v) => { setPickupType(v as TransferLocationType); setSearchEnabled(false) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="airport">Airport</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="address">Address</SelectItem>
          </SelectContent>
        </Select>
        {pickupType === 'airport' ? (
          <Input
            placeholder="IATA (e.g. YUL)"
            value={pickupCode}
            onChange={(e) => { setPickupCode(e.target.value.toUpperCase()); setSearchEnabled(false) }}
            maxLength={3}
            className="col-span-2"
          />
        ) : (
          <Input
            placeholder="Pickup address"
            value={pickupAddress}
            onChange={(e) => { setPickupAddress(e.target.value); setSearchEnabled(false) }}
            className="col-span-2"
          />
        )}
      </div>

      {/* Dropoff */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={dropoffType} onValueChange={(v) => { setDropoffType(v as TransferLocationType); setSearchEnabled(false) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="airport">Airport</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="address">Address</SelectItem>
          </SelectContent>
        </Select>
        {dropoffType === 'airport' ? (
          <Input
            placeholder="IATA (e.g. CDG)"
            value={dropoffCode}
            onChange={(e) => { setDropoffCode(e.target.value.toUpperCase()); setSearchEnabled(false) }}
            maxLength={3}
            className="col-span-2"
          />
        ) : (
          <Input
            placeholder="Dropoff address"
            value={dropoffAddress}
            onChange={(e) => { setDropoffAddress(e.target.value); setSearchEnabled(false) }}
            className="col-span-2"
          />
        )}
      </div>

      {/* Date/Time/Passengers */}
      <div className="grid grid-cols-3 gap-2">
        <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSearchEnabled(false) }} />
        <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); setSearchEnabled(false) }} />
        <Input type="number" min={1} max={20} value={passengers} onChange={(e) => { setPassengers(e.target.value); setSearchEnabled(false) }} placeholder="Pax" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSearch}
        disabled={!canSearch || isLoading}
        className="w-full"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
        Search Transfers
      </Button>

      {error && !isLoading && (
        <div className="p-3 text-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          {data?.warning || 'Search failed. Try again.'}
        </div>
      )}

      {searchEnabled && !isLoading && !error && !hasResults && (
        <p className="text-sm text-gray-500 text-center py-2">No transfers found</p>
      )}

      {hasResults && (
        <ScrollArea className="max-h-64 border rounded-lg">
          <ul className="divide-y divide-gray-100">
            {data.results.map((transfer) => (
              <li key={transfer.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(transfer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-sm">{transfer.vehicle.type}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                        {transfer.transferType}
                      </span>
                    </div>
                    <span className="font-semibold text-sm">
                      {transfer.price.currency} {transfer.price.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="truncate">{transfer.vehicle.description}</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {transfer.vehicle.maxPassengers}
                    </span>
                    {transfer.duration && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {transfer.duration.replace('PT', '').toLowerCase()}
                      </span>
                    )}
                  </div>
                  {transfer.cancellationPolicy && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {transfer.cancellationPolicy.refundable ? 'Free cancellation' : 'Non-refundable'}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
