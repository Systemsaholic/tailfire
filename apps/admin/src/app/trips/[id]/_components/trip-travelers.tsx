'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTripTravelers } from '@/hooks/use-trip-travelers'
import { EditTravelersDialog } from './edit-travelers-dialog'
import type { TripResponseDto, TripTravelerResponseDto } from '@tailfire/shared-types/api'

interface TripTravelersProps {
  trip: TripResponseDto
}

export function TripTravelers({ trip }: TripTravelersProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { data: travelers = [], isLoading } = useTripTravelers(trip.id)

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'primary_contact':
        return 'default'
      case 'full_access':
        return 'secondary'
      case 'limited_access':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Get role label
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

  // Get traveler name
  const getTravelerName = (traveler: TripTravelerResponseDto) => {
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

  // Get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    const lastPart = parts[parts.length - 1]
    if (parts.length >= 2 && parts[0]?.[0] && lastPart?.[0]) {
      return `${parts[0][0]}${lastPart[0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get traveler type badge
  const getTravelerTypeBadge = (type: string) => {
    switch (type) {
      case 'adult':
        return 'Adult'
      case 'child':
        return 'Child'
      case 'infant':
        return 'Infant'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Loading travelers...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Travelers</h2>
          <p className="text-sm text-gray-600">
            Manage travelers and their access levels for this trip
          </p>
        </div>
        <Button onClick={() => setShowEditDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Edit Travelers
        </Button>
      </div>

      {/* Travelers List */}
      {travelers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <UserCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No travelers yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Add travelers to this trip to manage their access and organize groups
          </p>
          <Button onClick={() => setShowEditDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Travelers
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {travelers.map((traveler) => {
            const name = getTravelerName(traveler)
            return (
              <div
                key={traveler.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {traveler.contactId ? (
                        <Link href={`/contacts/${traveler.contactId}`} className="hover:text-blue-600 hover:underline">
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(traveler.role)} className="text-xs">
                        {getRoleLabel(traveler.role)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {getTravelerTypeBadge(traveler.travelerType)}
                      </span>
                    </div>
                    {traveler.contactSnapshot?.email && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {traveler.contactSnapshot.email}
                      </p>
                    )}
                    {traveler.contact?.email && !traveler.contactSnapshot?.email && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {traveler.contact.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Travelers Dialog */}
      <EditTravelersDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        trip={trip}
      />
    </div>
  )
}
