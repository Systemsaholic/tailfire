'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface FormSuccessOverlayProps {
  show: boolean
  message?: string
  /** Called after duration. Can be async - if it fails, overlay remains visible with dismiss option */
  onComplete?: () => void | Promise<void | { success: boolean; error?: string }>
  duration?: number // ms
  /**
   * Called when user manually dismisses after a navigation failure.
   * Typically used to hide the overlay (setShowSuccess(false)).
   *
   * Note: The return context in sessionStorage is intentionally preserved when
   * dismissed, allowing the user to:
   * 1. Continue editing and save again (will retry navigation with same context)
   * 2. Manually navigate away (context expires after 1 hour or is cleared on successful return)
   */
  onDismiss?: () => void
}

export function FormSuccessOverlay({
  show,
  message = 'Activity Added!',
  onComplete,
  duration = 1000,
  onDismiss,
}: FormSuccessOverlayProps) {
  const [showDismiss, setShowDismiss] = useState(false)
  const dismissButtonRef = useRef<HTMLButtonElement>(null)

  const handleComplete = useCallback(async () => {
    if (!onComplete) return

    try {
      const result = await onComplete()
      // If result indicates failure, show dismiss button
      if (result && typeof result === 'object' && !result.success) {
        setShowDismiss(true)
      }
    } catch {
      // Navigation failed - show dismiss option
      setShowDismiss(true)
    }
  }, [onComplete])

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(handleComplete, duration)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete, duration, handleComplete])

  // Reset dismiss state when overlay is hidden
  useEffect(() => {
    if (!show) {
      setShowDismiss(false)
    }
  }, [show])

  // Focus dismiss button when it appears for keyboard accessibility
  useEffect(() => {
    if (showDismiss && dismissButtonRef.current) {
      dismissButtonRef.current.focus()
    }
  }, [showDismiss])

  if (!show) return null

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/95"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-200">
        <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" aria-hidden="true" />
        <p className="text-lg font-medium text-foreground">{message}</p>
        {showDismiss && (
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={onDismiss}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            Continue editing
          </button>
        )}
      </div>
    </div>
  )
}
