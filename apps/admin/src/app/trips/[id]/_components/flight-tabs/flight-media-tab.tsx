'use client'

import { ImageIcon } from 'lucide-react'
import { ComponentMediaTab } from '@/components/tern/shared'
import { EmptyState } from '@/components/tern/shared/empty-state'
import { TernCard } from '@/components/tern/core'

interface FlightMediaTabProps {
  /** The flight component ID (only available when editing) */
  componentId?: string
}

export function FlightMediaTab({ componentId }: FlightMediaTabProps) {
  // Show message when creating a new flight (no ID yet)
  if (!componentId) {
    return (
      <TernCard>
        <EmptyState
          icon={<ImageIcon className="h-6 w-6" />}
          title="Save flight first"
          description="You can add photos after saving the flight"
        />
      </TernCard>
    )
  }

  return (
    <ComponentMediaTab
      componentId={componentId}
      entityType="flight"
      title="Flight Photos"
      description="Boarding passes, seat maps, and flight experience photos"
    />
  )
}
