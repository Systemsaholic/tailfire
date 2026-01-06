'use client'

import React from 'react'
import { Plane, Clock, Check, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Normalized time from Aerodatabox API
 */
interface NormalizedTime {
  local?: string
  utc?: string
}

/**
 * Normalized flight endpoint from Aerodatabox API
 */
interface NormalizedFlightEndpoint {
  airportIata: string
  airportIcao?: string
  airportName?: string
  timezone?: string
  terminal?: string
  gate?: string
  baggageBelt?: string
  scheduledTime?: NormalizedTime
  estimatedTime?: NormalizedTime
  actualTime?: NormalizedTime
}

/**
 * Normalized flight status from Aerodatabox API search results
 */
interface NormalizedFlightStatus {
  flightNumber: string
  callSign?: string
  airline: {
    name: string
    iataCode?: string
    icaoCode?: string
  }
  departure: NormalizedFlightEndpoint
  arrival: NormalizedFlightEndpoint
  status: string
  statusCategory: 'scheduled' | 'active' | 'completed' | 'disrupted'
  aircraft?: {
    registration?: string
    model?: string
    modeS?: string
  }
  lastUpdated?: string
  distanceKm?: number
}

interface FlightSearchResultCardProps {
  flight: NormalizedFlightStatus
  onApply: () => void
  className?: string
}

// Helper to format time from ISO string to 12h format
const formatTime = (time?: NormalizedTime): string => {
  const timeStr = time?.local || time?.utc
  if (!timeStr) return '--:--'

  try {
    // Parse ISO string like "2026-01-05T18:35:00-05:00"
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return '--:--'

    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return '--:--'
  }
}

// Helper to format date from ISO string
const formatDate = (time?: NormalizedTime): string => {
  const timeStr = time?.local || time?.utc
  if (!timeStr) return ''

  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
    return date.toLocaleDateString('en-US', options)
  } catch {
    return ''
  }
}

// Helper to calculate flight duration from two times
const calculateDuration = (
  departure?: NormalizedTime,
  arrival?: NormalizedTime
): number => {
  const depStr = departure?.utc || departure?.local
  const arrStr = arrival?.utc || arrival?.local
  if (!depStr || !arrStr) return 0

  try {
    const dep = new Date(depStr)
    const arr = new Date(arrStr)
    return Math.round((arr.getTime() - dep.getTime()) / (1000 * 60))
  } catch {
    return 0
  }
}

// Helper to format duration from minutes
const formatDuration = (minutes: number): string => {
  if (minutes < 1) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Get status badge color
const getStatusBadge = (
  statusCategory: string
): { className: string; label: string } => {
  switch (statusCategory) {
    case 'scheduled':
      return { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Scheduled' }
    case 'active':
      return { className: 'bg-green-50 text-green-700 border-green-200', label: 'In Progress' }
    case 'completed':
      return { className: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Completed' }
    case 'disrupted':
      return { className: 'bg-red-50 text-red-700 border-red-200', label: 'Disrupted' }
    default:
      return { className: 'bg-gray-50 text-gray-600 border-gray-200', label: statusCategory }
  }
}

export function FlightSearchResultCard({
  flight,
  onApply,
  className,
}: FlightSearchResultCardProps) {
  const duration = calculateDuration(
    flight.departure.scheduledTime,
    flight.arrival.scheduledTime
  )
  const statusBadge = getStatusBadge(flight.statusCategory)

  return (
    <Card
      className={cn(
        'overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group',
        className
      )}
      onClick={onApply}
    >
      <CardContent className="p-0">
        {/* Header with flight info */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900">
                {flight.flightNumber}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{flight.airline.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', statusBadge.className)}>
              {statusBadge.label}
            </Badge>
            <Button
              type="button"
              size="sm"
              className="bg-green-600 hover:bg-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>

        {/* Flight route visualization */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Departure */}
            <div className="flex flex-col items-start min-w-[100px]">
              <span className="text-2xl font-bold text-gray-900">
                {flight.departure.airportIata}
              </span>
              <span className="text-lg font-semibold text-gray-700">
                {formatTime(flight.departure.scheduledTime)}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {flight.departure.airportName}
              </span>
              {(flight.departure.terminal || flight.departure.gate) && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {flight.departure.terminal && `T${flight.departure.terminal}`}
                  {flight.departure.terminal && flight.departure.gate && ' • '}
                  {flight.departure.gate && `Gate ${flight.departure.gate}`}
                </span>
              )}
            </div>

            {/* Flight path visualization */}
            <div className="flex-1 mx-4 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">
                {formatDate(flight.departure.scheduledTime)}
              </span>
              <div className="w-full flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1 relative mx-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-blue-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-white px-2">
                      <Plane className="h-5 w-5 text-blue-600 transform rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
              {duration > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
              {flight.aircraft?.model && (
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {flight.aircraft.model}
                </span>
              )}
            </div>

            {/* Arrival */}
            <div className="flex flex-col items-end min-w-[100px]">
              <span className="text-2xl font-bold text-gray-900">
                {flight.arrival.airportIata}
              </span>
              <span className="text-lg font-semibold text-gray-700">
                {formatTime(flight.arrival.scheduledTime)}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[120px] text-right">
                {flight.arrival.airportName}
              </span>
              {(flight.arrival.terminal || flight.arrival.baggageBelt) && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {flight.arrival.terminal && `T${flight.arrival.terminal}`}
                  {flight.arrival.terminal && flight.arrival.baggageBelt && ' • '}
                  {flight.arrival.baggageBelt && `Belt ${flight.arrival.baggageBelt}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Click hint footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-end text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Click to apply flight data</span>
          <ChevronRight className="h-3 w-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  )
}
