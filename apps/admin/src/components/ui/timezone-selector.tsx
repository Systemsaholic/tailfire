/**
 * Timezone Selector Component
 *
 * A dropdown component for selecting IANA timezone identifiers.
 * Uses shadcn/ui Select component with grouped timezones by region.
 */

import React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select'
import { getCommonTimezones, formatTimezoneLabel, getBrowserTimezone } from '@/lib/date-utils'

export interface TimezoneSelectorProps {
  value?: string
  onChange: (timezone: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showBrowserTimezone?: boolean
}

export function TimezoneSelector({
  value,
  onChange,
  placeholder = 'Select timezone...',
  disabled = false,
  className,
  showBrowserTimezone = true,
}: TimezoneSelectorProps) {
  const timezoneGroups = getCommonTimezones()
  const browserTimezone = getBrowserTimezone()

  // Filter out browser timezone from groups to avoid duplicate values
  const filteredGroups = showBrowserTimezone
    ? timezoneGroups.map(group => ({
        ...group,
        timezones: group.timezones.filter(tz => tz !== browserTimezone),
      })).filter(group => group.timezones.length > 0)
    : timezoneGroups

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value ? formatTimezoneLabel(value) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showBrowserTimezone && (
          <SelectGroup>
            <SelectLabel>Detected</SelectLabel>
            <SelectItem key={`browser-${browserTimezone}`} value={browserTimezone}>
              {formatTimezoneLabel(browserTimezone)} (Browser)
            </SelectItem>
          </SelectGroup>
        )}

        {filteredGroups.map((group) => (
          <SelectGroup key={group.region}>
            <SelectLabel>{group.region}</SelectLabel>
            {group.timezones.map((tz) => (
              <SelectItem key={`${group.region}-${tz}`} value={tz}>
                {formatTimezoneLabel(tz)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
