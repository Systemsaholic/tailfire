'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export interface SidebarItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  onClick?: () => void
  isActive?: boolean
}

export interface BackLink {
  href: string
  label: string
}

interface TernDetailSidebarProps {
  backHref: string
  backLabel: string
  /** Optional additional back links to show below the primary back link */
  additionalBackLinks?: BackLink[]
  sections: SidebarSection[]
  /** Optional callback when navigation occurs (used to close mobile drawer) */
  onNavigate?: () => void
}

/**
 * Tern Detail Sidebar
 * Left sidebar that appears on detail views (e.g., trip detail, contact detail)
 * Based on the trip detail screenshot showing General/Finances/More sections
 */
export function TernDetailSidebar({
  backHref,
  backLabel,
  additionalBackLinks,
  sections,
  onNavigate,
}: TernDetailSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-44 h-full flex-shrink-0 border-r border-tern-gray-200 bg-white overflow-y-auto">
      {/* Primary back link */}
      <Link
        href={backHref}
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-3 text-sm text-tern-gray-600 hover:text-tern-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tern-teal-500 focus-visible:ring-offset-2 focus-visible:ring-inset"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Additional back links */}
      {additionalBackLinks && additionalBackLinks.length > 0 && (
        <div className="border-b border-tern-gray-200 pb-2">
          {additionalBackLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={onNavigate}
              className="flex items-center gap-2 px-3 py-2 text-sm text-tern-gray-600 hover:text-tern-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tern-teal-500 focus-visible:ring-offset-2 focus-visible:ring-inset"
            >
              <ChevronLeft className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Navigation sections */}
      <nav className="px-2 py-2">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-4">
            {section.title && (
              <h4 className="px-2 py-1 text-xs font-medium text-tern-gray-500 uppercase tracking-wider">
                {section.title}
              </h4>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.isActive !== undefined ? item.isActive : pathname === item.href
                const Icon = item.icon

                // If onClick is provided, render as button instead of link
                if (item.onClick) {
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => {
                          item.onClick?.()
                          onNavigate?.()
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tern-teal-500 focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-tern-teal-50 text-tern-teal-700 font-medium'
                            : 'text-tern-gray-700 hover:bg-tern-gray-50'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.badge && (
                          <span className="text-xs text-tern-gray-500">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tern-teal-500 focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-tern-teal-50 text-tern-teal-700 font-medium'
                          : 'text-tern-gray-700 hover:bg-tern-gray-50'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="text-xs text-tern-gray-500">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
