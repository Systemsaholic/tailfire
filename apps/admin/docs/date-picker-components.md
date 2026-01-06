# Date Picker Components

A comprehensive date selection system for the Tailfire Admin application. Provides both single date selection and smart date range picking with auto-adjustment capabilities.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Hooks](#hooks)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The date picker system consists of:

1. **DatePickerEnhanced** - Single date selection with manual input
2. **DateRangeInput** - Two-date selection with smart auto-adjustment
3. **useDatePickerState** - Hook for managing single date state
4. **useSmartDateRange** - Hook for managing date range with validation

### Key Features

- **ISO 8601 Format**: All dates use YYYY-MM-DD format
- **Manual Input**: Type dates directly, not just calendar selection
- **Smart Auto-Adjustment**: TO date adjusts when FROM date changes
- **Debounced Validation**: Prevents cursor jumping during typing (300ms default)
- **Strategy-Based**: Different behaviors for flights, hotels, trips
- **Accessible**: Full keyboard navigation and ARIA support

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DateRangeInput                          │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │ DatePickerEnhanced│    │ DatePickerEnhanced│            │
│  │   (FROM date)     │    │   (TO date)       │            │
│  └───────────────────┘    └───────────────────┘            │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       ▼                                     │
│            ┌─────────────────────┐                         │
│            │  useSmartDateRange  │                         │
│            │  - Auto-adjustment  │                         │
│            │  - Validation       │                         │
│            │  - Duration calc    │                         │
│            └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DatePickerEnhanced                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Input Field (YYYY-MM-DD)  │ [Clear] [Calendar]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                     │
│                       ▼                                     │
│            ┌─────────────────────┐                         │
│            │  useDatePickerState │                         │
│            │  - ISO validation   │                         │
│            │  - Debounced change │                         │
│            │  - Cursor stability │                         │
│            └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/admin/src/
├── components/ui/
│   ├── date-picker-enhanced.tsx  # Single date picker with input
│   ├── date-range-input.tsx      # Two-date range picker
│   └── calendar.tsx              # Base calendar (shadcn/ui)
├── hooks/
│   ├── use-date-picker-state.ts  # Single date state management
│   └── use-smart-date-range.ts   # Range state with auto-adjust
└── lib/
    └── date-utils.ts             # ISO date utilities
```

---

## Components

### DatePickerEnhanced

Single date selection with both calendar popup and manual text input.

```tsx
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'

<DatePickerEnhanced
  value={startDate}
  onChange={(isoDate) => setStartDate(isoDate)}
  placeholder="Enter date"
  minDate="2024-01-01"
  maxDate="2025-12-31"
  showClear
  debounceMs={300}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| null` | - | Current ISO date (YYYY-MM-DD) |
| `onChange` | `(isoDate: string \| null) => void` | - | Callback when date changes |
| `placeholder` | `string` | `'YYYY-MM-DD'` | Input placeholder text |
| `disabled` | `boolean` | `false` | Disable the picker |
| `minDate` | `string` | - | Minimum selectable date (ISO) |
| `maxDate` | `string` | - | Maximum selectable date (ISO) |
| `showClear` | `boolean` | `true` | Show clear button |
| `debounceMs` | `number` | `300` | Debounce delay for onChange |
| `aria-label` | `string` | - | Accessibility label |

**Features:**
- Type dates directly in YYYY-MM-DD format
- Calendar opens to selected date's month (uses `defaultMonth`)
- Invalid input shows red border
- Clear button when date is selected
- Full keyboard accessibility

---

### DateRangeInput

Two coordinated date pickers with smart auto-adjustment.

```tsx
import { DateRangeInput } from '@/components/ui/date-range-input'

// Flight booking (same-day return allowed)
<DateRangeInput
  fromValue={departureDate}
  toValue={returnDate}
  onChange={(from, to) => {
    setValue('departureDate', from)
    setValue('returnDate', to)
  }}
  minDuration={0}
  strategy="minimum"
  fromLabel="Departure"
  toLabel="Return"
  showDuration
/>

// Hotel booking (minimum 1 night)
<DateRangeInput
  fromValue={checkIn}
  toValue={checkOut}
  onChange={(from, to) => {
    setValue('checkIn', from)
    setValue('checkOut', to)
  }}
  minDuration={1}
  fromLabel="Check-in"
  toLabel="Check-out"
  showDuration
  formatDuration={(days) => `${days} night${days !== 1 ? 's' : ''}`}
/>

// Trip dates
<DateRangeInput
  fromValue={form.watch('startDate')}
  toValue={form.watch('endDate')}
  onChange={(from, to) => {
    form.setValue('startDate', from || '')
    form.setValue('endDate', to || '')
  }}
  minDuration={1}
  strategy="minimum"
  fromLabel="Travel Start Date"
  toLabel="Travel End Date"
  showDuration
  formatDuration={(days) => `${days} night${days !== 1 ? 's' : ''}`}
  disabled={form.watch('addDatesLater')}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fromValue` | `string \| null` | - | FROM date (ISO) |
| `toValue` | `string \| null` | - | TO date (ISO) |
| `onChange` | `(from, to) => void` | - | Callback when either date changes |
| `minDuration` | `number` | `0` | Minimum days between dates |
| `strategy` | `DateRangeStrategy` | `'minimum'` | Auto-adjustment strategy |
| `fromLabel` | `string` | `'From'` | Label for FROM field |
| `toLabel` | `string` | `'To'` | Label for TO field |
| `showDuration` | `boolean` | `false` | Show duration display |
| `formatDuration` | `(days) => string` | - | Custom duration formatter |
| `disabled` | `boolean` | `false` | Disable both pickers |
| `showLabels` | `boolean` | `true` | Show field labels |
| `minFromDate` | `string` | - | Min FROM date constraint |
| `maxFromDate` | `string` | - | Max FROM date constraint |
| `minToDate` | `string` | - | Min TO date constraint |
| `maxToDate` | `string` | - | Max TO date constraint |

**Auto-Adjustment Strategies:**

| Strategy | Behavior |
|----------|----------|
| `'minimum'` | Sets TO to FROM + minDuration when FROM changes invalidates range |
| `'maintain-duration'` | Preserves original duration when FROM changes |
| `'none'` | No auto-adjustment; shows validation error if invalid |

---

## Hooks

### useDatePickerState

Manages state for single date selection with debounced validation.

```tsx
import { useDatePickerState } from '@/hooks/use-date-picker-state'

const {
  selectedDate,      // Date object or null
  isoValue,          // String for input display
  isValid,           // Validation state
  setDate,           // Set from calendar
  handleInputChange, // Handle typing
  handleInputBlur,   // Validate on blur
  clear,             // Clear the date
  syncFromProp,      // Sync external changes
} = useDatePickerState({
  initialValue: '2024-01-15',
  onChange: (isoDate) => form.setValue('date', isoDate),
  debounceMs: 300,
})
```

**Key Design Decisions:**
- Debounced onChange prevents excessive re-renders during typing
- Validation happens on blur, not keystroke (better UX)
- `syncFromProp` updates internal state without triggering onChange (prevents loops)

---

### useSmartDateRange

Manages date range with auto-adjustment and validation.

```tsx
import { useSmartDateRange } from '@/hooks/use-smart-date-range'

const {
  fromDate,      // FROM date ISO string
  toDate,        // TO date ISO string
  isValid,       // Range validity
  errorMessage,  // Validation error
  setFromDate,   // Set FROM (may adjust TO)
  setToDate,     // Set TO (validates only)
  setDates,      // Set both atomically
  clear,         // Clear both dates
  duration,      // Days between dates
} = useSmartDateRange({
  minDuration: 1,
  strategy: 'minimum',
  onChange: (from, to) => {
    console.log('Range changed:', from, to)
  },
})
```

**Duration Semantics:**

| minDuration | Valid Example | Use Case |
|-------------|---------------|----------|
| `0` | Jan 15 → Jan 15 | Same-day flights |
| `1` | Jan 15 → Jan 16 | 1-night hotel stay |
| `7` | Jan 15 → Jan 22 | Week-long package |

---

## Usage Patterns

### Pattern 1: Trip Form with Add Dates Later

```tsx
function TripForm() {
  const form = useForm<TripFormValues>()
  const addDatesLater = form.watch('addDatesLater')

  return (
    <Form {...form}>
      <DateRangeInput
        fromValue={form.watch('startDate') || null}
        toValue={form.watch('endDate') || null}
        onChange={(from, to) => {
          form.setValue('startDate', from || '', { shouldValidate: true })
          form.setValue('endDate', to || '', { shouldValidate: true })
        }}
        minDuration={1}
        strategy="minimum"
        fromLabel="Travel Start Date"
        toLabel="Travel End Date"
        showDuration
        formatDuration={(days) => `${days} night${days !== 1 ? 's' : ''}`}
        disabled={addDatesLater}
      />

      <FormField
        name="addDatesLater"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked)
              if (checked) {
                form.clearErrors(['startDate', 'endDate'])
              }
            }}
          />
        )}
      />
    </Form>
  )
}
```

### Pattern 2: Itinerary Day Dates

```tsx
function DayDatePicker({ day, onUpdate }) {
  return (
    <DatePickerEnhanced
      value={day.date}
      onChange={(isoDate) => {
        if (isoDate) {
          onUpdate({ date: isoDate })
        }
      }}
      minDate={tripStartDate}
      maxDate={tripEndDate}
      placeholder="Select day date"
    />
  )
}
```

### Pattern 3: Flight Segment Dates

```tsx
function FlightSegment() {
  const [departure, setDeparture] = useState<string | null>(null)
  const [arrival, setArrival] = useState<string | null>(null)

  return (
    <DateRangeInput
      fromValue={departure}
      toValue={arrival}
      onChange={(from, to) => {
        setDeparture(from)
        setArrival(to)
      }}
      minDuration={0}  // Same-day allowed for flights
      strategy="minimum"
      fromLabel="Departure"
      toLabel="Arrival"
      showDuration
      formatDuration={(days) => days === 0 ? 'Same day' : `${days} day${days !== 1 ? 's' : ''}`}
    />
  )
}
```

### Pattern 4: Hotel Booking

```tsx
function HotelBooking() {
  return (
    <DateRangeInput
      fromValue={checkIn}
      toValue={checkOut}
      onChange={handleDatesChange}
      minDuration={1}  // Minimum 1 night
      strategy="maintain-duration"  // Preserve user's original stay length
      fromLabel="Check-in"
      toLabel="Check-out"
      showDuration
      formatDuration={(nights) => `${nights} night${nights !== 1 ? 's' : ''}`}
    />
  )
}
```

---

## Best Practices

### 1. Always Use ISO Format

```tsx
// Good - ISO format
const date = '2024-01-15'
<DatePickerEnhanced value={date} />

// Avoid - other formats
const date = 'January 15, 2024'  // Won't work
const date = '01/15/2024'        // Won't work
```

### 2. Handle Null Values

```tsx
// Good - handle null explicitly
onChange={(from, to) => {
  form.setValue('startDate', from || '', { shouldValidate: true })
  form.setValue('endDate', to || '', { shouldValidate: true })
}}

// Avoid - type errors
onChange={(from, to) => {
  form.setValue('startDate', from)  // Could be null
}}
```

### 3. Choose Appropriate minDuration

| Use Case | minDuration | Reasoning |
|----------|-------------|-----------|
| Flights | `0` | Same-day return is valid |
| Hotels | `1` | Minimum 1-night stay |
| Car Rentals | `0` | Same-day pickup/return |
| Trip Planning | `1` | At least 1 day/night |
| Multi-week Tours | `7` | Minimum week booking |

### 4. Use Meaningful Duration Labels

```tsx
// Flights - days
formatDuration={(days) => days === 0 ? 'Same day' : `${days} day${days !== 1 ? 's' : ''}`}

// Hotels - nights
formatDuration={(nights) => `${nights} night${nights !== 1 ? 's' : ''}`}

// Trips - nights (industry standard)
formatDuration={(nights) => `${nights} night${nights !== 1 ? 's' : ''}`}
```

### 5. Prevent Update Loops

When syncing with form state, use refs to track external vs internal changes:

```tsx
// DateRangeInput handles this internally
// For custom implementations:
const lastExternalRef = useRef(value)

useEffect(() => {
  if (value !== lastExternalRef.current) {
    lastExternalRef.current = value
    syncFromProp(value)  // Won't trigger onChange
  }
}, [value])
```

---

## Troubleshooting

### Calendar Opens to Wrong Month

**Cause**: Using `month` prop instead of `defaultMonth` in Calendar component.

**Fix**: Use `defaultMonth` for initial month without controlling navigation:

```tsx
<Calendar
  selected={selectedDate || undefined}
  defaultMonth={selectedDate || undefined}  // Correct
  // month={selectedDate || undefined}      // Wrong - blocks navigation
/>
```

### Cursor Jumps While Typing

**Cause**: onChange firing too frequently during typing.

**Fix**: Use the built-in debouncing (300ms default) or increase `debounceMs`:

```tsx
<DatePickerEnhanced
  debounceMs={500}  // Increase if needed
/>
```

### Infinite Update Loops

**Cause**: External value changes triggering onChange which updates external value.

**Fix**: The components handle this internally with refs. If building custom:

```tsx
// Use syncFromProp for external changes
syncFromProp(newValue)  // Updates state WITHOUT calling onChange
```

### TO Date Not Auto-Adjusting

**Cause**: Using `strategy="none"` or TO date is already valid.

**Fix**: Use `strategy="minimum"` for auto-adjustment:

```tsx
<DateRangeInput
  strategy="minimum"  // Will auto-adjust TO when FROM invalidates range
/>
```

### Validation Error Not Showing

**Cause**: `isValid` state not being checked in render.

**Fix**: Always render error message when `!isValid`:

```tsx
const { isValid, errorMessage } = useSmartDateRange(...)

{!isValid && errorMessage && (
  <div className="text-destructive">{errorMessage}</div>
)}
```

---

## Related Documentation

- [Loading State Management](./loading-state-management.md) - Global loading states
- [Form Validation](./form-validation.md) - Zod schemas and validation (if exists)
