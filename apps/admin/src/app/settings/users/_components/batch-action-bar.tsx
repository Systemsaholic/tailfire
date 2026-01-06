'use client'

import { Lock, Unlock, Trash2, X } from 'lucide-react'
import type { UserListItemDto } from '@tailfire/shared-types'
import { Button } from '@/components/ui/button'

interface BatchActionBarProps {
  selectedUsers: UserListItemDto[]
  currentUserId: string
  onBatchLock: () => void
  onBatchUnlock: () => void
  onBatchDelete: () => void
  onClearSelection: () => void
  disabled: boolean
}

export function BatchActionBar({
  selectedUsers,
  currentUserId,
  onBatchLock,
  onBatchUnlock,
  onBatchDelete,
  onClearSelection,
  disabled,
}: BatchActionBarProps) {
  if (selectedUsers.length === 0) return null

  // Filter out current user for action eligibility
  const actionableUsers = selectedUsers.filter((u) => u.id !== currentUserId)
  const hasLockable = actionableUsers.some((u) => u.status === 'active' && u.isActive)
  const hasUnlockable = actionableUsers.some((u) => u.status === 'locked')
  const hasDeletable = actionableUsers.some((u) => u.isActive)
  const selfSelected = selectedUsers.length > actionableUsers.length

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
      <span className="text-sm font-medium">
        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
        <span className="text-muted-foreground ml-1">(this page)</span>
      </span>
      {selfSelected && (
        <span className="text-xs text-muted-foreground">(You cannot modify yourself)</span>
      )}
      <div className="flex-1" />
      {hasLockable && (
        <Button variant="outline" size="sm" onClick={onBatchLock} disabled={disabled}>
          <Lock className="h-4 w-4 mr-1" /> Lock
        </Button>
      )}
      {hasUnlockable && (
        <Button variant="outline" size="sm" onClick={onBatchUnlock} disabled={disabled}>
          <Unlock className="h-4 w-4 mr-1" /> Unlock
        </Button>
      )}
      {hasDeletable && (
        <Button variant="destructive" size="sm" onClick={onBatchDelete} disabled={disabled}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={disabled}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
