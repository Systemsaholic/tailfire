'use client'

import { Badge } from '@/components/ui/badge'
import type { UserStatus } from '@tailfire/shared-types'

interface UserStatusBadgeProps {
  status: UserStatus
  isActive: boolean
}

export function UserStatusBadge({ status, isActive }: UserStatusBadgeProps) {
  // Soft deleted takes precedence
  if (!isActive) {
    return <Badge variant="secondary">Deleted</Badge>
  }

  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-600">Active</Badge>
    case 'pending':
      return <Badge variant="default" className="bg-yellow-500">Pending</Badge>
    case 'locked':
      return <Badge variant="destructive">Locked</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
