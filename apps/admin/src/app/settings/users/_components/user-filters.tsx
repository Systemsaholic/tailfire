'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserStatus, UserRole } from '@tailfire/shared-types'

interface UserFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: UserStatus | undefined
  onStatusChange: (value: UserStatus | undefined) => void
  role: UserRole | undefined
  onRoleChange: (value: UserRole | undefined) => void
}

export function UserFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={status || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as UserStatus)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="locked">Locked</SelectItem>
        </SelectContent>
      </Select>

      {/* Role Filter */}
      <Select
        value={role || 'all'}
        onValueChange={(value) => onRoleChange(value === 'all' ? undefined : value as UserRole)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
