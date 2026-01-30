# Itinerary Troubleshooting Guide

Common issues and fixes related to the Trip Itinerary Planner board view and activity forms.

## Table of Contents

- [Date Auto-Population Not Working](#date-auto-population-not-working)
- [Cruise Port Info / Sea Days Missing](#cruise-port-info--sea-days-missing)
- [Related Documentation](#related-documentation)

---

## Date Auto-Population Not Working

### Symptom

When dragging an activity type (Tour, Dining, etc.) from the component sidebar onto a specific day in the Itinerary Planner board view, the activity's start date field remains empty instead of auto-populating with the target day's date.

### Root Cause

The drag-and-drop handler in `trip-itinerary.tsx` (CASE 4) was **not passing `itineraryId`** in the URL params when navigating to `/activities/new`.

```typescript
// BEFORE (buggy):
const params = new URLSearchParams({
  dayId: targetDayId,
  type: componentType,
  name: componentLabel || metadata.defaultName,
})
```

When `itineraryId` is missing from the URL:

1. `NewActivityPage` (`page.tsx`) falls back to `selectedItinerary` computed from `trip?.itineraries`
2. This can mismatch with the `selectedItinerary` local state in `trip-itinerary.tsx`
3. When the page uses a different itinerary's days, `days.find(d.id === dayId)` returns `undefined`
4. `effectiveDayDate` becomes `null` and the date field stays empty

### Fix

Add `itineraryId` to the URL params in CASE 4 of `trip-itinerary.tsx`:

```typescript
// AFTER (fixed):
const params = new URLSearchParams({
  dayId: targetDayId,
  itineraryId: selectedItinerary?.id || '',
  type: componentType,
  name: componentLabel || metadata.defaultName,
})
```

### Verification

| Navigation Path | Passes `itineraryId`? | Status |
|-----------------|----------------------|--------|
| `day-column.tsx` (click "+" button) | Yes | Verified |
| `day-section.tsx` (add activity) | Yes | Verified |
| `trip-itinerary.tsx` CASE 5 (pendingDay mode) | Yes | Verified |
| `trip-itinerary.tsx` CASE 4 (DnD to day column) | **Now yes** | Fixed |

### Key Files

- `apps/admin/src/app/trips/[id]/_components/trip-itinerary.tsx` - DnD handler (lines ~650-700)
- `apps/admin/src/app/trips/[id]/activities/new/page.tsx` - Receives params, computes `effectiveDayDate`

### How `effectiveDayDate` Works

The `NewActivityPage` computes the date using this priority:

```typescript
const effectiveDayDate = useMemo(() => {
  // 1. Explicit dayDate from URL params (highest priority)
  if (dayDateParam) return dayDateParam

  // 2. Look up date from dayId + days array
  if (dayIdParam && days.length > 0) {
    const day = days.find((d) => d.id === dayIdParam)
    if (day?.date) return day.date
  }

  // 3. Fallback to null (date field stays empty)
  return null
}, [dayDateParam, dayIdParam, days])
```

For this to work correctly, the `days` array must come from the **same itinerary** that contains the target `dayId`.

---

## Cruise Port Info / Sea Days Missing

### Symptom

When pulling a cruise from the Cruise Library into a trip, the Port Info and Sea Day activities are not visible in the Itinerary Planner. Only the main cruise activity (spanning bar) appears.

### Root Cause

Bug in `spanning-activity-utils.ts` where `processSpanningActivities()` incorrectly filtered out child activities.

```typescript
// BEFORE (buggy):
const childActivities = activities.filter(
  activity =>
    activity.parentActivityId &&
    !processedSpanningIds.has(activity.parentActivityId)
)
```

The condition `!processedSpanningIds.has(activity.parentActivityId)` was **backwards**. It was excluding activities whose parent HAD been processed (the opposite of the intended behavior).

### Fix

Changed the condition to correctly keep child activities whose parent has been processed:

```typescript
// AFTER (fixed):
const childActivities = activities.filter(
  activity =>
    activity.parentActivityId &&
    !processedSpanningIds.has(activity.id)  // Don't re-include if already processed as spanning
)
```

### Key Files

- `apps/admin/src/lib/spanning-activity-utils.ts` - `processSpanningActivities()` function

### Understanding Spanning Activities

Cruise activities "span" multiple days and are rendered as Gantt-style bars across the board view:

```
┌─────────────────────────────────────────────────────────────┐
│ Day 1      │ Day 2      │ Day 3      │ Day 4      │ Day 5  │
├────────────┴────────────┴────────────┴────────────┴────────┤
│ ═══════════════════ CRUISE ════════════════════════════════│ (spanning bar)
├─────────────────────────────────────────────────────────────┤
│ Port Info  │ Sea Day    │ Port Info  │ Sea Day    │ Port   │ (child activities)
│ Nassau     │            │ Cozumel    │            │ Miami  │
└─────────────────────────────────────────────────────────────┘
```

- **Parent Activity**: The cruise itself (type: `custom_cruise`)
- **Child Activities**: Port Info and Sea Day activities with `parentActivityId` pointing to the cruise
- The `processSpanningActivities()` function separates these for proper rendering

---

## Related Documentation

- [Activity Form Patterns](./activity-form-patterns.md) - Auto-save, safety net refs, floating packages
- [Date Picker Components](./date-picker-components.md) - DatePicker and date field usage
- [Loading State Management](./loading-state-management.md) - Async data loading patterns

---

## Debugging Tips

### Date Auto-Population Issues

Add temporary logging in `NewActivityPage`:

```typescript
useEffect(() => {
  console.log('[Debug] Date auto-population:', {
    dayIdParam,
    itineraryIdParam,
    daysLength: days.length,
    foundDay: days.find(d => d.id === dayIdParam),
    effectiveDayDate,
  })
}, [dayIdParam, itineraryIdParam, days, effectiveDayDate])
```

If `foundDay` is `undefined` but `dayIdParam` exists, the itinerary mismatch is likely the cause.

### Missing Cruise Children

Check the database for parent-child relationships:

```sql
SELECT
  a.id,
  a.type,
  a.name,
  a.parent_activity_id,
  p.type as parent_type
FROM activities a
LEFT JOIN activities p ON a.parent_activity_id = p.id
WHERE a.trip_id = '<trip-id>'
ORDER BY a.parent_activity_id NULLS FIRST, a.id;
```

Port Info and Sea Day activities should have `parent_activity_id` pointing to the cruise activity.
