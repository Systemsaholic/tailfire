'use client'

import { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmationDialogOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'warning' | 'info'
}

interface ConfirmationDialogState extends ConfirmationDialogOptions {
  open: boolean
  resolve?: (value: boolean) => void
}

// @ts-expect-error Reserved for future global state access
const _globalDialogState: ConfirmationDialogState | null = null
let globalSetDialogState: ((state: ConfirmationDialogState | null) => void) | null = null

/**
 * Universal confirmation dialog hook
 *
 * Usage:
 * ```tsx
 * const confirmed = await confirmDialog({
 *   title: "Delete item?",
 *   description: "This action cannot be undone.",
 *   confirmLabel: "Delete",
 *   variant: "destructive"
 * })
 *
 * if (confirmed) {
 *   // user clicked confirm
 * }
 * ```
 */
export function confirmDialog(options: ConfirmationDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!globalSetDialogState) {
      console.error('ConfirmationDialogProvider not found in component tree')
      resolve(false)
      return
    }

    globalSetDialogState({
      ...options,
      open: true,
      resolve,
    })
  })
}

/**
 * Provider component - place near root of app
 *
 * Usage:
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ConfirmationDialogProvider>
 *           {children}
 *         </ConfirmationDialogProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function ConfirmationDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<ConfirmationDialogState | null>(null)

  // Register global setter
  if (globalSetDialogState !== setDialogState) {
    globalSetDialogState = setDialogState
  }

  const handleConfirm = useCallback(() => {
    if (dialogState?.resolve) {
      dialogState.resolve(true)
    }
    setDialogState(null)
  }, [dialogState])

  const handleCancel = useCallback(() => {
    if (dialogState?.resolve) {
      dialogState.resolve(false)
    }
    setDialogState(null)
  }, [dialogState])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && dialogState?.resolve) {
      // User closed dialog via escape or click outside - treat as cancel
      dialogState.resolve(false)
      setDialogState(null)
    }
  }, [dialogState])

  const variant = dialogState?.variant || 'info'
  const confirmButtonClassName =
    variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' :
    variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
    'bg-phoenix-gold-600 hover:bg-phoenix-gold-700'

  return (
    <>
      {children}
      {dialogState && (
        <AlertDialog open={dialogState.open} onOpenChange={handleOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                {dialogState.cancelLabel || 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={confirmButtonClassName}
              >
                {dialogState.confirmLabel || 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
