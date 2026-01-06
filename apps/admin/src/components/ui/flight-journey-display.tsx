'use client'

/**
 * Flight Journey Display
 *
 * Visual timeline component for displaying multi-segment flight journeys.
 * Shows airport codes, flight durations, and layover information with
 * color-coded status badges.
 *
 * Features:
 * - Hover popovers on airport codes showing full airport details
 * - Visual timeline with flight segments and layover indicators
 * - Day change indicators (+1d) for overnight flights
 *
 * Adapted from alpha for beta's architecture.
 */

import React from 'react'
import { Plane, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AirportPopover } from '@/components/ui/airport-popover'
import { AircraftPopover } from '@/components/ui/aircraft-popover'
import { cn } from '@/lib/utils'
import { getAirportInfo, type PersistedAirportData } from '@/lib/airport-utils'
import type { FlightSegmentDto } from '@tailfire/shared-types'
import {
  formatMinutes,
  getFlightDuration,
  getLayoverMinutes,
  getLayoverStatus,
  getLayoverStatusColor,
  getJourneyRoute,
  getTotalJourneyDuration,
  formatStopCount,
  hasRiskyConnections,
} from '@/lib/flight-journey-utils'

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding UTC conversion issues.
 */
function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

/**
 * Format a date string (YYYY-MM-DD) to local display without timezone shift.
 * Parses date components directly to avoid UTC conversion issues.
 */
function formatDateLocal(dateStr: string): string {
  return parseDateLocal(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface FlightJourneyDisplayProps {
  segments: FlightSegmentDto[]
  className?: string
  showDetails?: boolean
}

/**
 * FlightJourneyDisplay - Visual timeline for multi-segment flights
 *
 * @example Single segment (direct flight)
 * [YYZ] ──────────✈────────── [LHR]
 *          2h 30m
 *
 * @example Multi-segment (with connection)
 * [YYZ] ────✈──── [ORD] ────✈──── [LHR]
 *        2h 15m    45m      7h 30m
 *                layover
 */
export function FlightJourneyDisplay({
  segments,
  className,
  showDetails = true,
}: FlightJourneyDisplayProps) {
  // Early return for empty segments
  if (!segments || segments.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Plane className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-4">
            No flight segments to display
          </p>
        </div>
      </div>
    )
  }

  const firstSegment = segments[0]!
  const lastSegment = segments[segments.length - 1]!
  const totalDuration = getTotalJourneyDuration(segments)
  const stopCount = formatStopCount(segments)
  const hasRisky = hasRiskyConnections(segments)

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Journey Summary Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground">
            {getJourneyRoute(segments)}
          </span>
          <Badge variant="outline" className="text-xs">
            {stopCount}
          </Badge>
          {hasRisky && (
            <Badge variant="destructive" className="text-xs">
              Tight connection
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground">
          Total: <span className="font-medium">{totalDuration}</span>
        </span>
      </div>

      {/* Visual Timeline */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-fit">
          {/* Origin Airport */}
          <AirportBlock
            code={firstSegment.departureAirportCode}
            time={firstSegment.departureTime}
            date={firstSegment.departureDate}
            align="left"
            airportName={firstSegment.departureAirportName}
            airportCity={firstSegment.departureAirportCity}
            airportLat={firstSegment.departureAirportLat}
            airportLon={firstSegment.departureAirportLon}
            timezone={firstSegment.departureTimezone}
          />

          {/* Segments with connections */}
          <div className="flex-1 flex items-center mx-4">
            {segments.map((segment, index) => {
              const isLastSegment = index === segments.length - 1
              const nextSegment = segments[index + 1]
              const layoverMins = nextSegment
                ? getLayoverMinutes(segment, nextSegment)
                : null

              return (
                <React.Fragment key={segment.id || index}>
                  {/* Flight Segment */}
                  <FlightSegmentBlock segment={segment} />

                  {/* Connection Airport (if not last segment) */}
                  {!isLastSegment && nextSegment && (
                    <ConnectionBlock
                      arrivalCode={segment.arrivalAirportCode}
                      layoverMinutes={layoverMins}
                      airportName={segment.arrivalAirportName}
                      airportCity={segment.arrivalAirportCity}
                      airportLat={segment.arrivalAirportLat}
                      airportLon={segment.arrivalAirportLon}
                      timezone={segment.arrivalTimezone}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Destination Airport */}
          <AirportBlock
            code={lastSegment.arrivalAirportCode}
            time={lastSegment.arrivalTime}
            date={lastSegment.arrivalDate}
            departureDate={firstSegment.departureDate}
            align="right"
            airportName={lastSegment.arrivalAirportName}
            airportCity={lastSegment.arrivalAirportCity}
            airportLat={lastSegment.arrivalAirportLat}
            airportLon={lastSegment.arrivalAirportLon}
            timezone={lastSegment.arrivalTimezone}
          />
        </div>
      </div>

      {/* Detailed Segment List (optional) */}
      {showDetails && segments.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Flight Segments
          </h5>
          <div className="space-y-1">
            {segments.map((segment, index) => (
              <SegmentDetailRow
                key={segment.id || index}
                segment={segment}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

interface AirportBlockProps {
  code?: string | null
  time?: string | null
  date?: string | null
  departureDate?: string | null // For calculating +1d indicator
  align: 'left' | 'right'
  // Airport detail fields for popover
  airportName?: string | null
  airportCity?: string | null
  airportLat?: number | null
  airportLon?: number | null
  timezone?: string | null
}

function AirportBlock({
  code,
  time,
  date,
  departureDate,
  align,
  airportName,
  airportCity,
  airportLat,
  airportLon,
  timezone,
}: AirportBlockProps) {
  const timeDisplay = time ? time.substring(0, 5) : '--:--'

  // Calculate day difference for arrival (use local parsing to avoid timezone issues)
  let dayIndicator = ''
  if (departureDate && date && departureDate !== date) {
    const dep = parseDateLocal(departureDate)
    const arr = parseDateLocal(date)
    const dayDiff = Math.floor((arr.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24))
    if (dayDiff > 0) {
      dayIndicator = ` +${dayDiff}`
    }
  }

  // Build persisted data for airport lookup
  const persisted: PersistedAirportData | null =
    airportName || airportCity || airportLat || airportLon
      ? { name: airportName, city: airportCity, lat: airportLat, lon: airportLon }
      : null

  const airportInfo = getAirportInfo(code, persisted, timezone)

  return (
    <div className={cn('flex flex-col', align === 'left' ? 'items-start' : 'items-end')}>
      <AirportPopover airport={airportInfo} side={align === 'left' ? 'right' : 'left'}>
        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {code || '???'}
          </div>
        </div>
      </AirportPopover>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {timeDisplay}
        {dayIndicator && (
          <span className="text-xs text-orange-600 dark:text-orange-400">
            {dayIndicator}
          </span>
        )}
      </div>
      {date && (
        <div className="text-xs text-muted-foreground">
          {formatDateLocal(date)}
        </div>
      )}
    </div>
  )
}

interface FlightSegmentBlockProps {
  segment: FlightSegmentDto
}

function FlightSegmentBlock({ segment }: FlightSegmentBlockProps) {
  const duration = getFlightDuration(segment)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-[100px]">
      {/* Flight info badge */}
      <div className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700 mb-1">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          {segment.airline || 'Airline'}
        </div>
        <div className="text-xs font-bold text-primary text-center">
          {segment.flightNumber || 'TBD'}
        </div>
      </div>

      {/* Flight line with plane icon */}
      <div className="w-full relative h-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-[2px] bg-gradient-to-r from-gray-300 via-primary/50 to-gray-300 dark:from-gray-600 dark:via-primary/50 dark:to-gray-600" />
        </div>
        <div className="relative flex justify-center">
          <AircraftPopover
            aircraft={{
              model: segment.aircraftModel,
              registration: segment.aircraftRegistration,
              modeS: segment.aircraftModeS,
              imageUrl: segment.aircraftImageUrl,
              imageAuthor: segment.aircraftImageAuthor,
            }}
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 p-1 rounded-full hover:shadow-md hover:ring-2 hover:ring-primary/30 transition-all">
              <Plane className="w-4 h-4 text-primary transform rotate-45" />
            </div>
          </AircraftPopover>
        </div>
      </div>

      {/* Duration badge */}
      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
        {duration}
      </div>
    </div>
  )
}

interface ConnectionBlockProps {
  arrivalCode?: string | null
  layoverMinutes: number | null
  // Airport detail fields for popover
  airportName?: string | null
  airportCity?: string | null
  airportLat?: number | null
  airportLon?: number | null
  timezone?: string | null
}

function ConnectionBlock({
  arrivalCode,
  layoverMinutes,
  airportName,
  airportCity,
  airportLat,
  airportLon,
  timezone,
}: ConnectionBlockProps) {
  const status = getLayoverStatus(layoverMinutes)
  const statusColor = getLayoverStatusColor(status)
  const layoverDisplay =
    layoverMinutes !== null && layoverMinutes >= 0 ? formatMinutes(layoverMinutes) : '--'

  // Build persisted data for airport lookup
  const persisted: PersistedAirportData | null =
    airportName || airportCity || airportLat || airportLon
      ? { name: airportName, city: airportCity, lat: airportLat, lon: airportLon }
      : null

  const airportInfo = getAirportInfo(arrivalCode, persisted, timezone)

  return (
    <div className="flex flex-col items-center px-2">
      {/* Layover badge */}
      <div
        className={cn(
          'px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 mb-1',
          statusColor
        )}
      >
        <Clock className="w-3 h-3" />
        {layoverDisplay}
      </div>

      {/* Connection airport */}
      <AirportPopover airport={airportInfo} side="top">
        <div className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {arrivalCode || '???'}
          </div>
        </div>
      </AirportPopover>
    </div>
  )
}

interface SegmentDetailRowProps {
  segment: FlightSegmentDto
  index: number
}

function SegmentDetailRow({ segment, index }: SegmentDetailRowProps) {
  const formatTime = (date?: string | null, time?: string | null) => {
    if (!date || !time) return '--:--'
    try {
      const dt = new Date(`${date}T${time}`)
      return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return time.substring(0, 5)
    }
  }

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-mono">
          {segment.flightNumber || `Segment ${index + 1}`}
        </Badge>
        <span className="font-medium">
          {segment.departureAirportCode || '???'} → {segment.arrivalAirportCode || '???'}
        </span>
      </div>
      <div className="text-muted-foreground">
        {formatTime(segment.departureDate, segment.departureTime)} -{' '}
        {formatTime(segment.arrivalDate, segment.arrivalTime)}
      </div>
    </div>
  )
}

export default FlightJourneyDisplay
