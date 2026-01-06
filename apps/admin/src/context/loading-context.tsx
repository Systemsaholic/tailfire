'use client'

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react'

/**
 * Loading State Management Context
 *
 * Provides a standardized, centralized way to manage loading states across the
 * entire application. Supports multiple concurrent loading operations with unique keys.
 *
 * ## Key Features
 * - **Multiple Concurrent Operations**: Track many loading states simultaneously
 * - **Unique Keys**: Each operation identified by a unique string key
 * - **Custom Messages**: Display context-specific loading messages
 * - **Global Overlay Integration**: Works with GlobalLoadingOverlay component
 *
 * ## Key Naming Convention
 * Use descriptive keys following the pattern: `{resource}-{action}`
 * - `trip-navigation` - Navigating to a trip page
 * - `contact-create` - Creating a new contact
 * - `bulk-import` - Importing multiple records
 *
 * ## Usage Example
 * ```tsx
 * const { startLoading, stopLoading, isLoading } = useLoading()
 *
 * const handleCreate = async () => {
 *   startLoading('trip-create', 'Creating your trip...')
 *   try {
 *     await createTrip(data)
 *   } finally {
 *     stopLoading('trip-create')
 *   }
 * }
 *
 * return (
 *   <Button disabled={isLoading('trip-create')}>
 *     {isLoading('trip-create') ? 'Creating...' : 'Create Trip'}
 *   </Button>
 * )
 * ```
 *
 * @see {@link useLoading} - Primary hook for accessing loading state
 * @see {@link useLoadingOperation} - Convenience hook for single operation
 * @see docs/loading-state-management.md - Full documentation
 */

/**
 * Represents a single loading state with optional message
 */
interface LoadingState {
  /** Whether the operation is currently loading */
  loading: boolean
  /** Optional user-friendly message describing the operation */
  message?: string
}

/**
 * The complete loading context value with all available methods
 */
interface LoadingContextValue {
  /** Internal map of all active loading states - prefer using methods instead */
  loadingStates: Map<string, LoadingState>

  /**
   * Start a loading operation
   * @param key - Unique identifier for this operation (e.g., 'trip-navigation')
   * @param message - Optional user-friendly message (e.g., 'Opening your trip...')
   */
  startLoading: (key: string, message?: string) => void

  /**
   * Stop a loading operation
   * @param key - The same key used when starting the operation
   */
  stopLoading: (key: string) => void

  /**
   * Check if a specific operation is currently loading
   * @param key - The operation key to check
   * @returns true if the operation is loading
   */
  isLoading: (key: string) => boolean

  /**
   * Check if any operation is currently loading
   * @returns true if at least one operation is active
   */
  isAnyLoading: () => boolean

  /**
   * Get the message for a specific loading operation
   * @param key - The operation key
   * @returns The message or undefined if not set/not loading
   */
  getMessage: (key: string) => string | undefined

  /**
   * Get the first active loading message (for global overlay)
   * @returns The first found message or undefined
   */
  getActiveMessage: () => string | undefined

  /**
   * Get all currently active loading keys (useful for debugging)
   * @returns Array of active loading operation keys
   */
  getLoadingKeys: () => string[]
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

/**
 * LoadingProvider
 *
 * Context provider that manages global loading states. Must wrap your application
 * to enable loading state management.
 *
 * @example
 * ```tsx
 * // In your providers.tsx or layout
 * import { LoadingProvider } from '@/context/loading-context'
 * import { GlobalLoadingOverlay } from '@/components/ui/loading-overlay'
 *
 * export function Providers({ children }) {
 *   return (
 *     <LoadingProvider>
 *       {children}
 *       <GlobalLoadingOverlay />
 *     </LoadingProvider>
 *   )
 * }
 * ```
 */
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(
    () => new Map()
  )

  const startLoading = useCallback((key: string, message?: string) => {
    setLoadingStates((prev) => {
      const next = new Map(prev)
      next.set(key, { loading: true, message })
      return next
    })
  }, [])

  const stopLoading = useCallback((key: string) => {
    setLoadingStates((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates.get(key)?.loading ?? false
    },
    [loadingStates]
  )

  const isAnyLoading = useCallback(() => {
    return loadingStates.size > 0
  }, [loadingStates])

  const getMessage = useCallback(
    (key: string) => {
      return loadingStates.get(key)?.message
    },
    [loadingStates]
  )

  const getActiveMessage = useCallback(() => {
    const entries = Array.from(loadingStates.values())
    return entries.find((state) => state.message)?.message
  }, [loadingStates])

  const getLoadingKeys = useCallback(() => {
    return Array.from(loadingStates.keys())
  }, [loadingStates])

  return (
    <LoadingContext.Provider
      value={{
        loadingStates,
        startLoading,
        stopLoading,
        isLoading,
        isAnyLoading,
        getMessage,
        getActiveMessage,
        getLoadingKeys,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

/**
 * useLoading Hook
 *
 * Primary hook for accessing the global loading state management system.
 * Provides methods to start/stop loading operations and check loading status.
 *
 * @returns {LoadingContextValue} Object containing loading state methods
 * @throws {Error} If used outside of LoadingProvider
 *
 * @example Basic usage
 * ```tsx
 * function MyComponent() {
 *   const { startLoading, stopLoading, isLoading } = useLoading()
 *
 *   const handleSave = async () => {
 *     startLoading('save-data', 'Saving your changes...')
 *     try {
 *       await saveData()
 *     } finally {
 *       stopLoading('save-data')
 *     }
 *   }
 *
 *   return (
 *     <Button
 *       onClick={handleSave}
 *       disabled={isLoading('save-data')}
 *     >
 *       {isLoading('save-data') ? 'Saving...' : 'Save'}
 *     </Button>
 *   )
 * }
 * ```
 *
 * @example Navigation with loading overlay
 * ```tsx
 * // In originating component
 * const { startLoading } = useLoading()
 * const router = useRouter()
 *
 * const handleCreate = async () => {
 *   const result = await createItem()
 *   startLoading('item-navigation', 'Opening your item...')
 *   router.push(`/items/${result.id}`)
 * }
 *
 * // In destination component
 * const { stopLoading } = useLoading()
 * const { data, isLoading } = useItem(id)
 *
 * useEffect(() => {
 *   if (!isLoading && data) {
 *     stopLoading('item-navigation')
 *   }
 * }, [isLoading, data, stopLoading])
 * ```
 *
 * @example Checking multiple loading states
 * ```tsx
 * const { isLoading, isAnyLoading, getLoadingKeys } = useLoading()
 *
 * // Check specific operations
 * const isSaving = isLoading('save')
 * const isDeleting = isLoading('delete')
 *
 * // Check if anything is loading
 * const anyLoading = isAnyLoading()
 *
 * // Debug: see all active operations
 * console.log('Active:', getLoadingKeys())
 * ```
 */
export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

/**
 * useLoadingOperation Hook
 *
 * Convenience hook for managing a single loading operation. Provides a simplified
 * API when you only need to track one operation in a component.
 *
 * @param {string} key - Unique identifier for this loading operation
 * @returns Object with start, stop, loading state, and message
 *
 * @example Form submission
 * ```tsx
 * function ContactForm() {
 *   const { start, stop, loading } = useLoadingOperation('contact-save')
 *
 *   const onSubmit = async (data: ContactData) => {
 *     start('Saving contact information...')
 *     try {
 *       await saveContact(data)
 *       toast({ title: 'Contact saved!' })
 *     } catch (error) {
 *       toast({ title: 'Error saving contact', variant: 'destructive' })
 *     } finally {
 *       stop()
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       {/* form fields *\/}
 *       <Button type="submit" disabled={loading}>
 *         {loading ? 'Saving...' : 'Save Contact'}
 *       </Button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example With cleanup on unmount
 * ```tsx
 * function DataLoader() {
 *   const { start, stop, loading } = useLoadingOperation('data-fetch')
 *
 *   useEffect(() => {
 *     start('Loading data...')
 *     fetchData().finally(() => stop())
 *
 *     // Cleanup: ensure loading stops if component unmounts
 *     return () => stop()
 *   }, [start, stop])
 *
 *   if (loading) return <Spinner />
 *   return <DataDisplay />
 * }
 * ```
 */
export function useLoadingOperation(key: string) {
  const { startLoading, stopLoading, isLoading, getMessage } = useLoading()

  const start = useCallback(
    (message?: string) => {
      startLoading(key, message)
    },
    [key, startLoading]
  )

  const stop = useCallback(() => {
    stopLoading(key)
  }, [key, stopLoading])

  return {
    /** Whether this specific operation is currently loading */
    loading: isLoading(key),
    /** The message for this operation (if set) */
    message: getMessage(key),
    /** Start this loading operation with optional message */
    start,
    /** Stop this loading operation */
    stop,
  }
}
