import { useEffect, useRef, useMemo } from 'react'
import { Control, UseFormSetValue, useWatch } from 'react-hook-form'
import {
  generateActivityName,
  getActivityNamePlaceholder,
  NameGeneratorInput,
} from '@/lib/activity-name-generator'
import { ActivityType } from '@tailfire/shared-types'

interface UseActivityNameGeneratorOptions {
  activityType: ActivityType
  control: Control<any>
  setValue: UseFormSetValue<any>
  // Pass PRIMITIVE watched values to avoid re-computation on every render
  // Each form watches its relevant fields and passes them here
  restaurantName?: string
  propertyName?: string
  tourName?: string
  portName?: string
  cruiseLineName?: string
  shipName?: string
  origin?: string
  destination?: string
  flightSegments?: NameGeneratorInput['flightSegments']
}

export function useActivityNameGenerator({
  activityType,
  control,
  setValue,
  restaurantName,
  propertyName,
  tourName,
  portName,
  cruiseLineName,
  shipName,
  origin,
  destination,
  flightSegments,
}: UseActivityNameGeneratorOptions) {
  const prevGeneratedRef = useRef<string>('')
  const initializedRef = useRef(false)

  // Watch name reactively to detect custom titles
  const nameValue = useWatch({ control, name: 'name' })

  // Stable key for flightSegments array (avoids identity change on every render)
  const flightSegmentsKey = useMemo(() => {
    if (!flightSegments) return ''
    return flightSegments
      .map(
        (s) =>
          `${s.airline || ''}${s.flightNumber || ''}${s.departureAirport || ''}${s.arrivalAirport || ''}`
      )
      .join('|')
  }, [flightSegments])

  // Memoize generated name with stable deps
  const generatedName = useMemo(() => {
    return generateActivityName({
      activityType,
      restaurantName,
      propertyName,
      tourName,
      portName,
      cruiseLineName,
      shipName,
      origin,
      destination,
      flightSegments,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flightSegmentsKey is stable derived key
  }, [
    activityType,
    restaurantName,
    propertyName,
    tourName,
    portName,
    cruiseLineName,
    shipName,
    origin,
    destination,
    flightSegmentsKey,
  ])

  const placeholder = getActivityNamePlaceholder(activityType)

  // Detect custom title: name differs from generated (and isn't empty)
  const hasCustomTitle =
    nameValue &&
    nameValue !== generatedName &&
    nameValue !== prevGeneratedRef.current

  // Auto-set name when generated name changes
  useEffect(() => {
    if (!generatedName) return

    const generatedChanged = generatedName !== prevGeneratedRef.current
    const shouldAutoSet =
      // New value: always set if user hasn't customized
      (generatedChanged && !hasCustomTitle) ||
      // Backfill: set if name is empty (even on edit)
      (!nameValue && !initializedRef.current)

    if (shouldAutoSet) {
      setValue('name', generatedName, { shouldDirty: true })
    }

    prevGeneratedRef.current = generatedName
    initializedRef.current = true
  }, [generatedName, nameValue, hasCustomTitle, setValue])

  const displayName = nameValue || generatedName

  return {
    generatedName,
    displayName,
    placeholder,
    hasCustomTitle: !!hasCustomTitle,
    resetToGenerated: () => {
      setValue('name', generatedName, { shouldDirty: true })
    },
  }
}
