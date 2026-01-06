# Form Validation with RHF + Zod

This directory contains form validation schemas and utilities for the admin app using [react-hook-form](https://react-hook-form.com/) with [Zod](https://zod.dev/) resolver.

## Migration Checklist

When migrating a form from `useState` to RHF + Zod:

- [ ] Create Zod schema with proper coercion (`z.coerce.date()`, `z.coerce.number()`)
- [ ] Add `refine(!Number.isNaN(d.getTime()))` for date fields to reject Invalid Date
- [ ] Add cross-field validations with explicit `path` for error placement
- [ ] Create `toDefaults()` hydration helper (no `undefined` values)
- [ ] Replace `useState` with `useForm` + `zodResolver`
- [ ] Use `reset(toDefaults(serverData))` for async data hydration
- [ ] Gate auto-save: `isDirty && isValid && !isValidating && !isSubmitting && !mutation.isPending`
- [ ] Call `form.reset(form.getValues(), { keepDirty: false })` on successful save
- [ ] Add `FormField` wrappers showing `errors[field]?.message`
- [ ] Ensure inputs have `data-field` or `name` attributes for scroll-to-error
- [ ] Implement `scrollToFirstError(errors)` only on explicit submit

## Quick Start

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lodgingFormSchema, toLodgingDefaults, LODGING_FORM_FIELDS } from '@/lib/validation'
import { mapServerErrors, scrollToFirstError } from '@/lib/validation/utils'

// Initialize form
const form = useForm({
  resolver: zodResolver(lodgingFormSchema),
  defaultValues: toLodgingDefaults(null, dayDate),
})

// Async hydration when server data loads
useEffect(() => {
  if (serverData) {
    form.reset(toLodgingDefaults(serverData, dayDate))
  }
}, [serverData])
```

## Auto-Save Pattern

```typescript
const { isDirty, isValid, isValidating, isSubmitting } = form.formState
const watchedFields = useWatch({ control: form.control, name: WATCHED_FIELDS })

useEffect(() => {
  if (!isDirty || !isValid || isValidating || isSubmitting || mutation.isPending) {
    return
  }

  const timer = setTimeout(() => {
    mutation.mutate(form.getValues(), {
      onSuccess: () => {
        form.reset(form.getValues(), { keepDirty: false })
        failureToastShown.current = false
      },
      onError: (error) => {
        mapServerErrors(error.fieldErrors, form.setError, WATCHED_FIELDS)
        if (!failureToastShown.current) {
          toast({ title: 'Save failed', variant: 'destructive' })
          failureToastShown.current = true
          setTimeout(() => { failureToastShown.current = false }, 5000)
        }
      }
    })
  }, 300)

  return () => clearTimeout(timer)
}, [watchedFields, isDirty, isValid, isValidating, isSubmitting, mutation.isPending])
```

## Server Error Mapping

Map API validation errors to form fields:

```typescript
import type { ServerFieldError, ApiValidationError } from '@/lib/validation/types'

// In mutation onError
onError: (error: ApiValidationError) => {
  if (error.fieldErrors) {
    mapServerErrors(error.fieldErrors, form.setError, KNOWN_FIELDS)
  }
  toast({ title: 'Save failed', variant: 'destructive' })
}
```

The `mapServerErrors` function:
- Handles flat fields (`name`) and dotted paths (`lodgingDetails.checkInDate`)
- Logs unrecognized fields for debugging
- Requires a list of known fields to prevent arbitrary error injection

## Handling Invalid Dates

Always add the Invalid Date refinement to date fields:

```typescript
const validDate = z.coerce.date().refine(
  (d) => !Number.isNaN(d.getTime()),
  { message: 'Invalid date' }
)
```

## Default Values Hydration

The `toDefaults()` function must:
1. Never return `undefined` values (RHF requirement)
2. Guard against undefined server payloads
3. Parse dates safely with fallbacks
4. Ensure cross-field constraints are satisfied (e.g., checkout > checkin)

```typescript
function parseDate(val: unknown, fallback: Date): Date {
  if (!val) return fallback
  const d = val instanceof Date ? val : new Date(String(val))
  return Number.isNaN(d.getTime()) ? fallback : d
}
```

## Field Arrays (Future Forms)

For forms with arrays (flight segments, port calls):
- Use stable keys from data (`field.id`), not array index
- Pattern: `fields.map((field) => <Input key={field.id} ... />)`
- Errors path: `fieldArrayName.0.fieldName`

```typescript
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'segments'
})

{fields.map((field, index) => (
  <Input
    key={field.id}
    data-field={`segments.${index}.origin`}
    {...form.register(`segments.${index}.origin`)}
  />
))}
```

## Timezone Consistency

In tests, normalize dates to UTC to avoid timezone-related flakes:

```typescript
// Good
const checkIn = new Date('2025-01-15T00:00:00Z')

// Avoid (timezone-dependent)
const checkIn = new Date('2025-01-15')
```

## Scroll to First Error

Use `scrollToFirstError` only on explicit submit, not during typing:

```typescript
const onSubmit = form.handleSubmit(
  (data) => { /* success */ },
  (errors) => scrollToFirstError(errors)
)
```

The function:
- Flattens nested error objects to find first leaf
- Queries `[data-field="..."]` then `[name="..."]`
- Scrolls element into view and focuses it

Ensure your controlled inputs (DatePicker, Select) render the `data-field` attribute:

```typescript
<DatePicker data-field="lodgingDetails.checkInDate" ... />
```

## Files

| File | Description |
|------|-------------|
| `types.ts` | Shared type definitions for server errors |
| `utils.ts` | Utilities: mapServerErrors, scrollToFirstError, flattenErrors |
| `lodging-validation.ts` | Lodging form schema and defaults |
| `__tests__/lodging-validation.test.ts` | Unit tests for lodging schema |
