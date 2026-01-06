import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TernCard } from '../core/tern-card'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
}

/**
 * Tern Stat Card
 * Individual KPI card for dashboard stats
 */
export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <TernCard className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-tern-gray-500">{title}</p>
          <p className="text-2xl font-bold text-tern-gray-900">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-md bg-tern-teal-50 p-2 text-tern-teal-600">
            {icon}
          </div>
        )}
      </div>
    </TernCard>
  )
}

interface StatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

/**
 * Tern Stats Grid
 * Responsive grid container for stat cards
 */
export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-1 md:grid-cols-2': columns === 2,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': columns === 4,
        },
        className
      )}
    >
      {children}
    </div>
  )
}
