# Loading State Management

A centralized, type-safe loading state management system for the Tailfire Admin application. This system provides a consistent way to handle loading states across the entire application with support for multiple concurrent operations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Components](#components)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The loading state management system consists of:

1. **LoadingContext** - A React Context that manages loading states globally
2. **LoadingProvider** - The context provider that wraps the application
3. **useLoading Hook** - Primary hook for accessing loading state functions
4. **useLoadingOperation Hook** - Convenience hook for managing a single operation
5. **Loading Components** - UI components for displaying loading states

### Key Features

- **Multiple Concurrent Operations**: Support for tracking multiple loading operations simultaneously using unique keys
- **Global Overlay**: Full-screen loading overlay that activates when any operation is loading
- **Custom Messages**: Each loading operation can have its own descriptive message
- **Type-Safe**: Full TypeScript support with proper type inference
- **Flexible Components**: Multiple component options for different use cases

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Providers                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   LoadingProvider                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              LoadingContext                      │  │  │
│  │  │                                                  │  │  │
│  │  │   loadingStates: Map<string, LoadingState>      │  │  │
│  │  │   ┌─────────────────────────────────────────┐   │  │  │
│  │  │   │ 'trip-navigation' → { loading, message } │   │  │  │
│  │  │   │ 'contact-save'    → { loading, message } │   │  │  │
│  │  │   │ 'bulk-import'     → { loading, message } │   │  │  │
│  │  │   └─────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              GlobalLoadingOverlay                      │  │
│  │   (Renders when any operation is loading)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/admin/src/
├── context/
│   ├── index.ts                 # Exports all context utilities
│   └── loading-context.tsx      # LoadingProvider and hooks
├── components/ui/
│   └── loading-overlay.tsx      # Loading UI components
└── app/
    └── providers.tsx            # App providers (includes LoadingProvider)
```

---

## Quick Start

### 1. Basic Usage

```tsx
import { useLoading } from '@/context/loading-context'

function MyComponent() {
  const { startLoading, stopLoading, isLoading } = useLoading()

  const handleSave = async () => {
    startLoading('my-operation', 'Saving changes...')
    try {
      await saveData()
    } finally {
      stopLoading('my-operation')
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={isLoading('my-operation')}
    >
      {isLoading('my-operation') ? 'Saving...' : 'Save'}
    </button>
  )
}
```

### 2. Using the Operation Hook

```tsx
import { useLoadingOperation } from '@/context/loading-context'

function MyComponent() {
  const { start, stop, loading } = useLoadingOperation('my-operation')

  const handleSave = async () => {
    start('Saving changes...')
    try {
      await saveData()
    } finally {
      stop()
    }
  }

  return (
    <button onClick={handleSave} disabled={loading}>
      {loading ? 'Saving...' : 'Save'}
    </button>
  )
}
```

---

## API Reference

### LoadingProvider

The context provider that must wrap your application (already configured in `providers.tsx`).

```tsx
<LoadingProvider>
  {children}
</LoadingProvider>
```

### useLoading Hook

Returns the full loading context with all available functions.

```tsx
const {
  startLoading,
  stopLoading,
  isLoading,
  isAnyLoading,
  getActiveMessage,
  getLoadingKeys,
} = useLoading()
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `startLoading` | `(key: string, message?: string) => void` | Start a loading operation with an optional message |
| `stopLoading` | `(key: string) => void` | Stop a specific loading operation |
| `isLoading` | `(key: string) => boolean` | Check if a specific operation is loading |
| `isAnyLoading` | `() => boolean` | Check if any operation is currently loading |
| `getActiveMessage` | `() => string \| undefined` | Get the message from the first active loading operation |
| `getLoadingKeys` | `() => string[]` | Get all currently active loading keys |

### useLoadingOperation Hook

A convenience hook for managing a single loading operation.

```tsx
const { start, stop, loading } = useLoadingOperation('operation-key')
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `(message?: string) => void` | Start this operation with an optional message |
| `stop` | `() => void` | Stop this operation |
| `loading` | `boolean` | Whether this operation is currently loading |

---

## Components

### GlobalLoadingOverlay

Full-screen loading overlay that automatically shows when any loading operation is active. **Already configured in `providers.tsx`** - no additional setup needed.

```tsx
// Automatically renders when isAnyLoading() returns true
<GlobalLoadingOverlay />
```

**Features:**
- Fixed position covering entire viewport
- Semi-transparent backdrop with blur effect
- Centered spinner with optional message
- z-index of 100 for proper layering

### LoadingOverlay

Container-specific loading overlay for dialogs, cards, or sections.

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay'

<div className="relative">
  <LoadingOverlay
    isLoading={isLoading}
    message="Loading data..."
    absolute  // Use absolute positioning instead of fixed
  />
  {/* Your content */}
</div>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | required | Whether to show the overlay |
| `message` | `string` | `undefined` | Message to display |
| `className` | `string` | `undefined` | Additional CSS classes |
| `absolute` | `boolean` | `false` | Use absolute positioning for containers |

### LoadingSpinner

Inline loading spinner for buttons or small areas.

```tsx
import { LoadingSpinner } from '@/components/ui/loading-overlay'

<LoadingSpinner size="sm" message="Loading..." />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `message` | `string` | `undefined` | Message to display next to spinner |
| `className` | `string` | `undefined` | Additional CSS classes |

---

## Usage Patterns

### Pattern 1: Navigation with Loading

Show a loading state while navigating to a new page after an async operation.

```tsx
// In the originating component (e.g., form dialog)
const router = useRouter()
const { startLoading } = useLoading()

const handleCreate = async () => {
  const result = await createItem.mutateAsync(data)
  startLoading('item-navigation', 'Opening your new item...')
  router.push(`/items/${result.id}`)
}

// In the destination component (e.g., detail page)
const { stopLoading } = useLoading()
const { data, isLoading } = useItem(itemId)

useEffect(() => {
  if (!isLoading && data) {
    stopLoading('item-navigation')
  }
}, [isLoading, data, stopLoading])
```

### Pattern 2: Form Submission

Show loading state during form submission with proper cleanup.

```tsx
const { startLoading, stopLoading, isLoading } = useLoading()

const onSubmit = async (data: FormData) => {
  startLoading('form-submit', 'Saving your changes...')
  try {
    await saveData(data)
    toast({ title: 'Saved successfully' })
  } catch (error) {
    toast({ title: 'Error', variant: 'destructive' })
  } finally {
    stopLoading('form-submit')
  }
}

return (
  <Button
    type="submit"
    disabled={isLoading('form-submit')}
  >
    {isLoading('form-submit') ? 'Saving...' : 'Save'}
  </Button>
)
```

### Pattern 3: Bulk Operations

Track progress of bulk operations with descriptive messages.

```tsx
const { startLoading, stopLoading } = useLoading()

const handleBulkDelete = async (items: string[]) => {
  startLoading('bulk-delete', `Deleting ${items.length} items...`)
  try {
    await bulkDelete(items)
    toast({ title: `Deleted ${items.length} items` })
  } finally {
    stopLoading('bulk-delete')
  }
}
```

### Pattern 4: Multiple Concurrent Operations

Handle multiple loading states independently.

```tsx
const { startLoading, stopLoading, isLoading, isAnyLoading } = useLoading()

// Start multiple operations
startLoading('fetch-users', 'Loading users...')
startLoading('fetch-roles', 'Loading roles...')

// Check individual operations
const usersLoading = isLoading('fetch-users')
const rolesLoading = isLoading('fetch-roles')

// Check if anything is loading
const anyLoading = isAnyLoading()

// Stop operations independently
stopLoading('fetch-users')
stopLoading('fetch-roles')
```

### Pattern 5: Container-Specific Loading

Show loading overlay for a specific section without blocking the entire page.

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay'

function DataTable({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="relative min-h-[200px]">
      <LoadingOverlay
        isLoading={isLoading}
        message="Loading data..."
        absolute
      />
      {/* Table content */}
    </div>
  )
}
```

---

## Best Practices

### 1. Use Descriptive Keys

Use clear, descriptive keys that indicate the operation being performed.

```tsx
// Good
startLoading('trip-navigation', 'Opening trip...')
startLoading('contact-create', 'Creating contact...')
startLoading('bulk-import', 'Importing contacts...')

// Avoid
startLoading('loading1')
startLoading('op')
```

### 2. Use Consistent Key Naming Convention

Follow a consistent pattern: `{resource}-{action}`

```tsx
'trip-navigation'
'trip-create'
'trip-update'
'contact-save'
'contact-delete'
'itinerary-publish'
```

### 3. Always Clean Up

Ensure `stopLoading` is called in all code paths, including error cases.

```tsx
// Use try/finally
startLoading('my-operation')
try {
  await asyncOperation()
} finally {
  stopLoading('my-operation')
}

// Or use useEffect cleanup
useEffect(() => {
  startLoading('page-load')
  return () => stopLoading('page-load')
}, [])
```

### 4. Provide Meaningful Messages

Use clear, user-friendly messages that describe what's happening.

```tsx
// Good
startLoading('save', 'Saving your changes...')
startLoading('delete', 'Deleting selected items...')
startLoading('upload', 'Uploading files...')

// Avoid
startLoading('save', 'Loading...')
startLoading('delete', 'Please wait')
```

### 5. Disable Interactive Elements

Disable buttons and interactive elements while their associated operation is loading.

```tsx
<Button
  onClick={handleSave}
  disabled={isLoading('save') || isLoading('delete')}
>
  Save
</Button>
```

### 6. Handle Dialog State

When using loading with dialogs, stop loading if the dialog is reopened.

```tsx
useEffect(() => {
  if (open) {
    stopLoading('previous-operation')
  }
}, [open, stopLoading])
```

---

## Examples

### Complete Trip Creation Flow

```tsx
// trip-form-dialog.tsx
import { useRouter } from 'next/navigation'
import { useLoading } from '@/context/loading-context'

function TripFormDialog({ open, onOpenChange }) {
  const router = useRouter()
  const { startLoading, stopLoading, isLoading } = useLoading()
  const isNavigating = isLoading('trip-navigation')

  const createTrip = useCreateTrip()

  // Clean up loading state when dialog opens
  useEffect(() => {
    if (open) {
      stopLoading('trip-navigation')
    }
  }, [open, stopLoading])

  const onSubmit = async (data: TripFormValues) => {
    try {
      const newTrip = await createTrip.mutateAsync(data)

      // Start loading overlay for navigation
      startLoading('trip-navigation', 'Opening your new trip...')

      toast({
        title: 'Trip created',
        description: 'Redirecting to your new trip...',
      })

      onOpenChange(false)
      router.push(`/trips/${newTrip.id}`)
    } catch (error) {
      // Handle error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form fields */}

          <Button
            type="submit"
            disabled={createTrip.isPending || isNavigating}
          >
            {isNavigating
              ? 'Opening trip...'
              : createTrip.isPending
                ? 'Creating...'
                : 'Create Trip'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

```tsx
// trips/[id]/page.tsx
import { useLoading } from '@/context/loading-context'

function TripDetailPage() {
  const params = useParams()
  const tripId = params?.id as string
  const { stopLoading } = useLoading()

  const { data: trip, isLoading, error } = useTrip(tripId)

  // Stop navigation loading when trip data loads
  useEffect(() => {
    if (!isLoading && trip) {
      stopLoading('trip-navigation')
    }
  }, [isLoading, trip, stopLoading])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <TripDetail trip={trip} />
  )
}
```

---

## Troubleshooting

### Loading overlay doesn't appear

1. Ensure `LoadingProvider` wraps your application in `providers.tsx`
2. Ensure `GlobalLoadingOverlay` is rendered inside `LoadingProvider`
3. Check that the loading key matches between `startLoading` and `stopLoading`

### Loading overlay doesn't disappear

1. Ensure `stopLoading` is called with the same key used in `startLoading`
2. Check for missing `stopLoading` calls in error handling paths
3. Use browser devtools to check active loading keys:

```tsx
const { getLoadingKeys } = useLoading()
console.log('Active loading keys:', getLoadingKeys())
```

### Hook error: "useLoading must be used within a LoadingProvider"

The component using `useLoading` is not wrapped by `LoadingProvider`. Ensure the provider is set up in your app's root layout or providers file.
