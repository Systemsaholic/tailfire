'use client'

import { Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'

interface SubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean
  submittingText?: string
  children: React.ReactNode
}

/**
 * Reusable submit button with loading state.
 *
 * Shows a spinner and custom text during submission.
 * Automatically disables the button while submitting.
 */
export function SubmitButton({
  isSubmitting,
  submittingText = 'Saving...',
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {submittingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
