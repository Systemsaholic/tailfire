'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Ship, Users, Building2 } from 'lucide-react'
import { SettingsTabsLayout } from './_components/settings-tabs-layout'

interface SettingsCategoryCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  available: boolean
}

const settingsCategories: SettingsCategoryCard[] = [
  {
    title: 'API Credentials',
    description: 'Manage API keys and credentials for external integrations',
    href: '/settings/api-credentials',
    icon: <Key className="h-6 w-6" />,
    available: true,
  },
  {
    title: 'Cruise Sync',
    description: 'Configure and monitor cruise line data synchronization',
    href: '/settings/cruise-sync',
    icon: <Ship className="h-6 w-6" />,
    available: true,
  },
  {
    title: 'User Management',
    description: 'Manage team members and user permissions',
    href: '/settings/users',
    icon: <Users className="h-6 w-6" />,
    available: true,
  },
  {
    title: 'Agency Settings',
    description: 'Configure agency-wide preferences and branding',
    href: '/settings/agency',
    icon: <Building2 className="h-6 w-6" />,
    available: false,
  },
]

export default function SettingsPage() {
  return (
    <SettingsTabsLayout activeTab="overview">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {settingsCategories.map((category) => (
          <Card
            key={category.title}
            className={
              category.available
                ? 'transition-colors hover:border-tern-teal-500'
                : 'opacity-60'
            }
          >
            {category.available ? (
              <Link href={category.href} className="block">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-tern-teal-50 p-2 text-tern-teal-600">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </CardHeader>
              </Link>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-tern-gray-100 p-2 text-tern-gray-400">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </SettingsTabsLayout>
  )
}
