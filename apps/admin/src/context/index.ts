/**
 * Context Exports
 *
 * Central export point for all React contexts and their associated hooks.
 *
 * @module context
 */

/**
 * Loading State Management
 *
 * Centralized loading state management for the application.
 * Use these exports to manage loading states across components.
 *
 * @example
 * ```tsx
 * import { useLoading } from '@/context'
 *
 * function MyComponent() {
 *   const { startLoading, stopLoading, isLoading } = useLoading()
 *   // ...
 * }
 * ```
 *
 * @see docs/loading-state-management.md for full documentation
 */
export { LoadingProvider, useLoading, useLoadingOperation } from './loading-context'
