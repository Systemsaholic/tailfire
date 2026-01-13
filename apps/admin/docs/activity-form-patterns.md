# Activity Form Patterns

Best practices and patterns used in the Trip Activity forms (Custom Cruise, Port Info, Dining, Tour, Package) within the Tailfire Admin application.

## Table of Contents

- [Overview](#overview)
- [Auto-Save Pattern](#auto-save-pattern)
- [Safety Net Refs Pattern](#safety-net-refs-pattern)
- [Floating Packages](#floating-packages)
- [Best Practices](#best-practices)

---

## Overview

Trip activities are managed through form components that support:

1. **Auto-save** - Automatic form submission when values change
2. **Create-on-first-edit** - Activities are created on first edit, not on mount
3. **Safety net refs** - Prevent duplicate creation during React's async state updates
4. **Floating packages** - Package activities that exist at the trip level, not tied to a specific day

---

## Auto-Save Pattern

### Problem

When using `useWatch({ control })` from react-hook-form, the returned object is a new reference on every render. This causes `useEffect` dependencies to trigger constantly, even when form values haven't actually changed.

```tsx
// BAD: useEffect fires on every render
const watchedValues = useWatch({ control })

useEffect(() => {
  // This runs constantly because watchedValues is a new object each time
  if (isDirty) {
    saveForm()
  }
}, [watchedValues, isDirty]) // watchedValues changes every render!
```

### Solution

Use `JSON.stringify()` with `useMemo` to create a stable primitive dependency:

```tsx
// GOOD: Stable dependency that only changes when values actually change
const watchedValues = useWatch({ control })
const watchedValuesKey = useMemo(
  () => JSON.stringify(watchedValues),
  [watchedValues]
)

useEffect(() => {
  if (isDirty) {
    saveForm()
  }
}, [watchedValuesKey, isDirty]) // Only fires when values actually change
```

### Implementation

```tsx
import { useMemo, useEffect, useCallback, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'

function ActivityForm() {
  const form = useForm<FormData>()
  const { control, formState: { isDirty } } = form

  // Watch all form values for auto-save
  const watchedValues = useWatch({ control })

  // Create stable string representation for dependency comparison
  // useWatch returns new object reference every render - JSON.stringify creates stable primitive
  const watchedValuesKey = useMemo(
    () => JSON.stringify(watchedValues),
    [watchedValues]
  )

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleAutoSave = useCallback(async () => {
    // Validate and save
    const isValid = await form.trigger()
    if (isValid) {
      await saveData(form.getValues())
    }
  }, [form])

  // Auto-save when form values change
  useEffect(() => {
    if (!isDirty) return

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Debounce auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave()
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [watchedValuesKey, isDirty, handleAutoSave]) // Use stable key
}
```

### Files Using This Pattern

- `apps/admin/src/app/trips/[id]/_components/package-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/dining-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/port-info-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/tour-form.tsx`

---

## Safety Net Refs Pattern

### Problem

When creating a new activity on first edit, React's async state updates can cause race conditions where the create mutation fires multiple times before the state updates to reflect the activity ID.

```tsx
// BAD: Race condition with async state
const [activityId, setActivityId] = useState<string | null>(null)

const handleChange = async () => {
  if (!activityId) {
    // Multiple change events can fire before setActivityId takes effect
    const newActivity = await createActivity.mutateAsync(data)
    setActivityId(newActivity.id) // State update is async!
  } else {
    await updateActivity.mutateAsync({ id: activityId, ...data })
  }
}
```

### Solution

Use `useRef` for synchronous state tracking alongside React state:

```tsx
// GOOD: Synchronous ref prevents race conditions
const [activityId, setActivityId] = useState<string | null>(null)
const activityIdRef = useRef<string | null>(null)
const createInProgressRef = useRef(false)

const handleChange = async () => {
  // Check ref synchronously - prevents race conditions
  if (!activityIdRef.current) {
    // Prevent concurrent create calls
    if (createInProgressRef.current) return
    createInProgressRef.current = true

    try {
      const newActivity = await createActivity.mutateAsync(data)
      // Update both ref (sync) and state (for re-render)
      activityIdRef.current = newActivity.id
      setActivityId(newActivity.id)
    } finally {
      createInProgressRef.current = false
    }
  } else {
    await updateActivity.mutateAsync({ id: activityIdRef.current, ...data })
  }
}
```

### Implementation

```tsx
function ActivityForm({ existingActivityId }: Props) {
  // Track activity ID in both state and ref
  // State: for React re-renders
  // Ref: for synchronous access in callbacks (prevents race conditions)
  const [activityId, setActivityId] = useState<string | null>(
    existingActivityId ?? null
  )
  const activityIdRef = useRef<string | null>(existingActivityId ?? null)

  // Safety net: prevent duplicate creation during async operations
  const createInProgressRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    activityIdRef.current = activityId
  }, [activityId])

  const handleAutoSave = useCallback(async () => {
    const values = form.getValues()

    // Use ref for synchronous check (prevents race conditions)
    if (!activityIdRef.current) {
      // Safety net: prevent concurrent create calls
      if (createInProgressRef.current) {
        console.log('Create already in progress, skipping')
        return
      }
      createInProgressRef.current = true

      try {
        const newActivity = await createActivity.mutateAsync(values)
        // Update both ref and state
        activityIdRef.current = newActivity.id
        setActivityId(newActivity.id)
      } finally {
        createInProgressRef.current = false
      }
    } else {
      // Update existing activity
      await updateActivity.mutateAsync({
        id: activityIdRef.current,
        ...values
      })
    }
  }, [form, createActivity, updateActivity])
}
```

### Why Both Ref and State?

| Use Case | Use Ref | Use State |
|----------|---------|-----------|
| Synchronous access in callbacks | Yes | No (async) |
| Prevent race conditions | Yes | No |
| Trigger re-renders | No | Yes |
| Display in UI | No | Yes |
| Persist across renders | Yes | Yes |

### Files Using This Pattern

- `apps/admin/src/app/trips/[id]/_components/package-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/dining-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/port-info-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/tour-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/custom-cruise-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/activity-booking-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/transportation-form.tsx`
- `apps/admin/src/app/trips/[id]/_components/accommodation-form.tsx`

---

## Floating Packages

### Overview

Package activities are "floating" - they exist at the trip level rather than being tied to a specific itinerary day. This is different from other activities (tours, dining, etc.) which belong to a specific day.

### Database Schema

```sql
-- activities table
ALTER TABLE activities
  ALTER COLUMN itinerary_day_id DROP NOT NULL;

ALTER TABLE activities
  ADD COLUMN trip_id UUID REFERENCES trips(id);

-- Constraint: floating packages must have trip_id, day-specific activities must have itinerary_day_id
ALTER TABLE activities
  ADD CONSTRAINT activities_floating_or_day_check
  CHECK (
    (itinerary_day_id IS NOT NULL) OR
    (trip_id IS NOT NULL AND type = 'package')
  );
```

### API Usage

When creating a floating package, pass `tripId` instead of `itineraryDayId`:

```tsx
// Frontend: Package form
const createActivity = useCreateTripActivity()

const handleCreate = async (data: FormData) => {
  await createActivity.mutateAsync({
    tripId: trip.id, // Not itineraryDayId
    type: 'package',
    ...data
  })
}
```

```typescript
// Backend: Controller extracts tripId from route
@Post('trips/:tripId/activities')
create(@Param('tripId') tripId: string, @Body() dto: CreateActivityDto) {
  return this.activitiesService.create({ ...dto, tripId })
}
```

### Fetching Floating Packages

Floating packages are fetched by trip ID, not by day:

```tsx
// useQuery hook
const { data: packages } = useQuery({
  queryKey: ['trip-packages', tripId],
  queryFn: () => api.get(`/trips/${tripId}/packages`)
})
```

---

## Best Practices

### 1. Always Use Both Ref and State for Activity IDs

```tsx
const [activityId, setActivityId] = useState<string | null>(null)
const activityIdRef = useRef<string | null>(null)
```

### 2. Use Stable Dependencies for Auto-Save

```tsx
const watchedValuesKey = useMemo(
  () => JSON.stringify(watchedValues),
  [watchedValues]
)
```

### 3. Guard Against Concurrent Creates

```tsx
const createInProgressRef = useRef(false)

if (createInProgressRef.current) return
createInProgressRef.current = true
try {
  await createActivity.mutateAsync(data)
} finally {
  createInProgressRef.current = false
}
```

### 4. Debounce Auto-Save

```tsx
const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

useEffect(() => {
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current)
  }
  autoSaveTimerRef.current = setTimeout(handleAutoSave, 1000)

  return () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
  }
}, [watchedValuesKey])
```

### 5. Initialize Refs from Props

```tsx
const activityIdRef = useRef<string | null>(existingActivityId ?? null)

useEffect(() => {
  activityIdRef.current = activityId
}, [activityId])
```

---

## Troubleshooting

### Auto-save fires constantly

**Cause**: Using `watchedValues` object directly in useEffect dependencies.

**Fix**: Use `JSON.stringify` with `useMemo`:
```tsx
const watchedValuesKey = useMemo(() => JSON.stringify(watchedValues), [watchedValues])
```

### Duplicate activities created

**Cause**: Race condition where create mutation fires before state updates.

**Fix**: Use `useRef` for synchronous state tracking and `createInProgressRef` guard.

### Floating package not saving

**Cause**: Missing `tripId` in create request or constraint violation.

**Fix**: Ensure `tripId` is passed when creating packages:
```tsx
await createActivity.mutateAsync({
  tripId: trip.id,
  type: 'package',
  ...data
})
```
