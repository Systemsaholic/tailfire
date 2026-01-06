'use client'

import { useState, useEffect } from 'react'
import type { UserListItemDto } from '@tailfire/shared-types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface BatchResult {
  succeeded: string[]
  failed: Array<{ userId: string; error: string }>
}

interface BatchConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'lock' | 'unlock' | 'delete' | null
  selectedUsers: UserListItemDto[]
  currentUserId: string
  onConfirm: (reason?: string) => Promise<BatchResult>
}

function formatUserName(user: UserListItemDto): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

export function BatchConfirmDialog({
  open,
  onOpenChange,
  action,
  selectedUsers,
  currentUserId,
  onConfirm,
}: BatchConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)

  // Reset state when action changes to prevent cross-action leakage
  useEffect(() => {
    setReason('')
    setResult(null)
  }, [action])

  // Filter out current user
  const actionableUsers = selectedUsers.filter((u) => u.id !== currentUserId)

  // Filter to only users valid for this action
  const targetUsers = actionableUsers.filter((u) => {
    if (action === 'lock') return u.status === 'active' && u.isActive
    if (action === 'unlock') return u.status === 'locked'
    if (action === 'delete') return u.isActive
    return false
  })

  const handleConfirm = async () => {
    setIsProcessing(true)
    const res = await onConfirm(action === 'lock' ? reason : undefined)
    setResult(res)
    setIsProcessing(false)

    // Only auto-close on full success
    if (res.failed.length === 0) {
      onOpenChange(false)
      setResult(null)
      setReason('')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setResult(null)
    setReason('')
  }

  // Don't render if no action or not open
  if (!action || !open) return null

  // Show result state if we have results with failures
  if (result && result.failed.length > 0) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batch Operation Complete</AlertDialogTitle>
            <AlertDialogDescription>
              {result.succeeded.length} succeeded, {result.failed.length} failed
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {result.failed.map((f) => (
              <div key={f.userId} className="text-sm text-destructive">
                {selectedUsers.find((u) => u.id === f.userId)?.email}: {f.error}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Action titles and descriptions
  const actionConfig = {
    lock: {
      title: 'Lock Users',
      description: `This will lock ${targetUsers.length} user${targetUsers.length !== 1 ? 's' : ''}. They will not be able to log in until unlocked.`,
    },
    unlock: {
      title: 'Unlock Users',
      description: `This will unlock ${targetUsers.length} user${targetUsers.length !== 1 ? 's' : ''}. They will be able to log in again.`,
    },
    delete: {
      title: 'Delete Users',
      description: `This will delete ${targetUsers.length} user${targetUsers.length !== 1 ? 's' : ''}. They will no longer be able to access the system.`,
    },
  }

  const config = actionConfig[action]

  // Show confirmation state
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-32 overflow-y-auto">
          <ul className="text-sm space-y-1">
            {targetUsers.map((u) => (
              <li key={u.id}>
                {formatUserName(u)} ({u.email})
              </li>
            ))}
          </ul>
        </div>

        {action === 'lock' && (
          <div className="grid gap-2 py-2">
            <Label htmlFor="batchReason">Reason (optional)</Label>
            <Input
              id="batchReason"
              placeholder="e.g., Security concern"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing || targetUsers.length === 0}
            className={
              action === 'delete'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {isProcessing
              ? 'Processing...'
              : `${action.charAt(0).toUpperCase() + action.slice(1)} ${targetUsers.length} user${targetUsers.length !== 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
