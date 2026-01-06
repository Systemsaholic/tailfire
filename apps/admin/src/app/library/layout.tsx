'use client'

import { Ship, CalendarClock, Map, Package } from 'lucide-react'
import { TernDetailLayout } from '@/components/tern/layout/tern-detail-layout'
import type { SidebarSection } from '@/components/tern/layout/tern-detail-sidebar'

const librarySections: SidebarSection[] = [
  {
    title: 'Travel Activities',
    items: [
      {
        name: 'Itinerary Templates',
        href: '/library/itineraries',
        icon: Map,
      },
      {
        name: 'Package Templates',
        href: '/library/packages',
        icon: Package,
      },
      {
        name: 'Cruises',
        href: '/library/cruises',
        icon: Ship,
      },
    ],
  },
  {
    title: 'Trip Components',
    items: [
      {
        name: 'Payment Schedules',
        href: '/library/payment-schedules',
        icon: CalendarClock,
      },
    ],
  },
]

interface LibraryLayoutProps {
  children: React.ReactNode
}

export default function LibraryLayout({ children }: LibraryLayoutProps) {
  return (
    <TernDetailLayout
      backHref="/dashboard"
      backLabel="Dashboard"
      sidebarSections={librarySections}
    >
      {children}
    </TernDetailLayout>
  )
}
