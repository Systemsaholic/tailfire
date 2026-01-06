import { TernTopNav } from './tern-top-nav'

interface TernDashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Tern Dashboard Layout
 * Main layout with horizontal top navigation (no left sidebar on list views)
 */
export function TernDashboardLayout({ children }: TernDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-tern-gray-50">
      <TernTopNav />
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {children}
      </main>
    </div>
  )
}
