'use client'

import { Loader2 } from 'lucide-react'
import { useLoading } from '@/context/loading-context'
import { cn } from '@/lib/utils'

/**
 * Loading UI Components
 *
 * This module provides loading indicator components for different use cases:
 *
 * - **GlobalLoadingOverlay**: Full-screen overlay for app-wide operations
 * - **LoadingOverlay**: Container-specific overlay for sections/dialogs
 * - **LoadingSpinner**: Inline spinner for buttons/small areas
 *
 * @module components/ui/loading-overlay
 * @see docs/loading-state-management.md for full documentation
 */

/**
 * GlobalLoadingOverlay
 *
 * Full-screen loading overlay that automatically displays when any loading
 * operation is active in the LoadingContext. Shows the first active message.
 *
 * **Setup**: This component should be placed once in your app, typically
 * inside the LoadingProvider in providers.tsx. It's already configured.
 *
 * **Behavior**:
 * - Automatically shows when `isAnyLoading()` returns true
 * - Displays centered spinner with optional message
 * - Uses semi-transparent backdrop with blur effect
 * - z-index: 100 for proper layering above all content
 *
 * @example Already configured in providers.tsx
 * ```tsx
 * // apps/admin/src/app/providers.tsx
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
 *
 * @example Triggering the overlay
 * ```tsx
 * const { startLoading, stopLoading } = useLoading()
 *
 * // This will show the global overlay with the message
 * startLoading('my-operation', 'Processing your request...')
 *
 * // This will hide the overlay (if no other operations are loading)
 * stopLoading('my-operation')
 * ```
 */
export function GlobalLoadingOverlay() {
  const { isAnyLoading, getActiveMessage } = useLoading()
  const message = getActiveMessage()

  if (!isAnyLoading()) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Props for the LoadingOverlay component
 */
interface LoadingOverlayProps {
  /** Whether to show the loading overlay */
  isLoading: boolean
  /** Optional message to display below the spinner */
  message?: string
  /** Additional CSS classes for custom styling */
  className?: string
  /** Use absolute positioning for containers instead of fixed for full-screen */
  absolute?: boolean
}

/**
 * LoadingOverlay
 *
 * Container-specific loading overlay for use within dialogs, cards, modals,
 * or any contained section that needs its own loading state.
 *
 * Unlike GlobalLoadingOverlay, this component:
 * - Requires manual control via `isLoading` prop
 * - Can be positioned absolutely within a container
 * - Doesn't depend on the loading context
 *
 * **Important**: Parent container must have `position: relative` for
 * absolute positioning to work correctly.
 *
 * @param props - LoadingOverlayProps
 *
 * @example Basic usage in a dialog
 * ```tsx
 * function MyDialog({ isOpen }) {
 *   const [isLoading, setIsLoading] = useState(false)
 *
 *   return (
 *     <Dialog open={isOpen}>
 *       <DialogContent className="relative">
 *         <LoadingOverlay
 *           isLoading={isLoading}
 *           message="Saving..."
 *           absolute
 *         />
 *         {/* Dialog content *\/}
 *       </DialogContent>
 *     </Dialog>
 *   )
 * }
 * ```
 *
 * @example In a data table
 * ```tsx
 * function DataTable({ data, isLoading }) {
 *   return (
 *     <div className="relative min-h-[200px]">
 *       <LoadingOverlay
 *         isLoading={isLoading}
 *         message="Loading data..."
 *         absolute
 *       />
 *       <Table>{/* table content *\/}</Table>
 *     </div>
 *   )
 * }
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message,
  className,
  absolute = false,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-background/80 backdrop-blur-sm',
        absolute ? 'absolute inset-0 z-50' : 'fixed inset-0 z-[100]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  /** Size of the spinner: 'sm' (16px), 'md' (24px), 'lg' (32px) */
  size?: 'sm' | 'md' | 'lg'
  /** Optional message to display next to the spinner */
  message?: string
  /** Additional CSS classes for custom styling */
  className?: string
}

/**
 * LoadingSpinner
 *
 * Inline loading spinner for use in buttons, form fields, or small UI areas.
 * Does not block interaction with surrounding elements.
 *
 * **Size Reference**:
 * - `sm`: 16x16px - Best for buttons, badges
 * - `md`: 24x24px - Default, good for most inline uses
 * - `lg`: 32x32px - For larger content areas
 *
 * @param props - LoadingSpinnerProps
 *
 * @example In a button
 * ```tsx
 * <Button disabled={isLoading}>
 *   {isLoading ? (
 *     <LoadingSpinner size="sm" message="Saving..." />
 *   ) : (
 *     'Save Changes'
 *   )}
 * </Button>
 * ```
 *
 * @example Standalone with message
 * ```tsx
 * {isLoading && (
 *   <LoadingSpinner size="md" message="Loading results..." />
 * )}
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <LoadingSpinner
 *   size="lg"
 *   message="Processing..."
 *   className="text-blue-500"
 * />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  message,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  )
}
