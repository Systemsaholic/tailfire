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
import { useUpdateUserStatus, useDeleteUser, useResendInvite } from '@/hooks/use-users'
import { useToast } from '@/hooks/use-toast'

type ActionType = 'lock' | 'unlock' | 'activate' | 'delete' | 'resend-invite'

interface ChangeStatusDialogProps {
  user: UserListItemDto | null
  action: ActionType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const actionConfig: Record<ActionType, {
  title: string
  description: (name: string) => string
  confirmText: string
  variant: 'default' | 'destructive'
  requiresReason?: boolean
}> = {
  lock: {
    title: 'Lock User Account',
    description: (name) => `Are you sure you want to lock ${name}'s account? They will not be able to log in until unlocked.`,
    confirmText: 'Lock Account',
    variant: 'destructive',
    requiresReason: true,
  },
  unlock: {
    title: 'Unlock User Account',
    description: (name) => `Are you sure you want to unlock ${name}'s account? They will be able to log in again.`,
    confirmText: 'Unlock Account',
    variant: 'default',
  },
  activate: {
    title: 'Activate User',
    description: (name) => `Are you sure you want to activate ${name}'s account? This will mark them as an active user without requiring them to complete the invitation process.`,
    confirmText: 'Activate',
    variant: 'default',
  },
  delete: {
    title: 'Delete User',
    description: (name) => `Are you sure you want to delete ${name}? This action will soft-delete the user and they will no longer be able to access the system.`,
    confirmText: 'Delete User',
    variant: 'destructive',
  },
  'resend-invite': {
    title: 'Resend Invitation',
    description: (name) => `Are you sure you want to resend the invitation email to ${name}?`,
    confirmText: 'Resend Invite',
    variant: 'default',
  },
}

export function ChangeStatusDialog({ user, action, open, onOpenChange }: ChangeStatusDialogProps) {
  const [lockedReason, setLockedReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const updateStatus = useUpdateUserStatus()
  const deleteUser = useDeleteUser()
  const resendInvite = useResendInvite()
  const { toast } = useToast()

  // Reset locked reason when dialog opens or user/action changes
  useEffect(() => {
    if (open) {
      setLockedReason('')
    }
  }, [open, user?.id, action])

  if (!user || !action) return null

  const config = actionConfig[action]
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      if (action === 'delete') {
        await deleteUser.mutateAsync(user.id)
        toast({
          title: 'User deleted',
          description: `${userName} has been deleted`,
        })
      } else if (action === 'resend-invite') {
        await resendInvite.mutateAsync(user.id)
        toast({
          title: 'Invitation sent',
          description: `A new invitation has been sent to ${user.email}`,
        })
      } else {
        const statusMap: Record<Exclude<ActionType, 'delete' | 'resend-invite'>, 'active' | 'locked'> = {
          lock: 'locked',
          unlock: 'active',
          activate: 'active',
        }
        await updateStatus.mutateAsync({
          id: user.id,
          data: {
            status: statusMap[action],
            lockedReason: action === 'lock' ? lockedReason : undefined,
          },
        })
        toast({
          title: 'Status updated',
          description: `${userName}'s account has been ${action === 'lock' ? 'locked' : action === 'unlock' ? 'unlocked' : 'activated'}`,
        })
      }
      setLockedReason('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {config.description(userName)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {config.requiresReason && (
          <div className="grid gap-2 py-4">
            <Label htmlFor="lockedReason">Reason (optional)</Label>
            <Input
              id="lockedReason"
              placeholder="e.g., Security concern, policy violation"
              value={lockedReason}
              onChange={(e) => setLockedReason(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Processing...' : config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
