'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useUpdateTripTraveler, useDeleteTripTraveler } from '@/hooks/use-trip-travelers'
import { useToast } from '@/hooks/use-toast'
import type { TripTravelerResponseDto } from '@tailfire/shared-types/api'

interface TravelerRowProps {
  traveler: TripTravelerResponseDto
  tripId: string
}

export function TravelerRow({ traveler, tripId }: TravelerRowProps) {
  const updateTraveler = useUpdateTripTraveler(tripId)
  const deleteTraveler = useDeleteTripTraveler(tripId)
  const { toast } = useToast()

  // Get name from contact snapshot or populated contact
  const getName = () => {
    if (traveler.contactSnapshot?.firstName || traveler.contactSnapshot?.lastName) {
      const first = traveler.contactSnapshot.firstName || ''
      const last = traveler.contactSnapshot.lastName || ''
      return `${first} ${last}`.trim()
    }

    if (traveler.contact?.firstName || traveler.contact?.lastName) {
      const first = traveler.contact.firstName || ''
      const last = traveler.contact.lastName || ''
      return `${first} ${last}`.trim()
    }

    return 'Unknown Traveler'
  }

  // Get initials for avatar
  const getInitials = () => {
    const name = getName()
    const parts = name.split(' ')
    const lastPart = parts[parts.length - 1]
    if (parts.length >= 2 && parts[0]?.[0] && lastPart?.[0]) {
      return `${parts[0][0]}${lastPart[0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get traveler type label
  const getTravelerTypeLabel = () => {
    switch (traveler.travelerType) {
      case 'adult':
        return 'Adult'
      case 'child':
        return 'Child'
      case 'infant':
        return 'Infant'
      default:
        return traveler.travelerType
    }
  }

  // Get role label for display
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'primary_contact':
        return 'Primary Contact'
      case 'full_access':
        return 'Full Access'
      case 'limited_access':
        return 'Limited Access'
      default:
        return role
    }
  }

  const handleRoleChange = async (newRole: 'primary_contact' | 'full_access' | 'limited_access') => {
    try {
      await updateTraveler.mutateAsync({
        id: traveler.id,
        data: { role: newRole },
      })
      toast({
        title: 'Role updated',
        description: `Traveler role updated to ${getRoleLabel(newRole)}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update traveler role',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTraveler.mutateAsync(traveler.id)
      toast({
        title: 'Traveler removed',
        description: 'The traveler has been removed from this trip',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove traveler',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Name and Type */}
        <div className="flex-1">
          <div className="font-medium text-gray-900">{getName()}</div>
          <div className="text-xs text-gray-500">{getTravelerTypeLabel()}</div>
        </div>

        {/* Role Dropdown */}
        <div className="w-48">
          <Select
            key={`role-${traveler.id}-${traveler.role}`}
            value={traveler.role}
            onValueChange={handleRoleChange}
            disabled={updateTraveler.isPending}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select role">
                {getRoleLabel(traveler.role)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary_contact">Primary Contact</SelectItem>
              <SelectItem value="full_access">Full Access</SelectItem>
              <SelectItem value="limited_access">Limited Access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteTraveler.isPending}
          className="h-9 w-9 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
