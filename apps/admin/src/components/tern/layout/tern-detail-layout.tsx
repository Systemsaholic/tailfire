'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { TernTopNav } from './tern-top-nav'
import { TernDetailSidebar, type SidebarSection, type BackLink } from './tern-detail-sidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface TernDetailLayoutProps {
  children: React.ReactNode
  backHref: string
  backLabel: string
  additionalBackLinks?: BackLink[]
  sidebarSections: SidebarSection[]
}

/**
 * Tern Detail Layout
 * Layout for detail views with top nav + left sidebar (e.g., trip detail, contact detail)
 * Includes mobile drawer navigation for smaller screens
 */
export function TernDetailLayout({
  children,
  backHref,
  backLabel,
  additionalBackLinks,
  sidebarSections,
}: TernDetailLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <TernTopNav />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:flex md:h-full">
          <TernDetailSidebar
            backHref={backHref}
            backLabel={backLabel}
            additionalBackLinks={additionalBackLinks}
            sections={sidebarSections}
          />
        </div>

        {/* Mobile navigation drawer */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-tern-teal-600 text-white shadow-lg hover:bg-tern-teal-700 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <TernDetailSidebar
              backHref={backHref}
              backLabel={backLabel}
              additionalBackLinks={additionalBackLinks}
              sections={sidebarSections}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
