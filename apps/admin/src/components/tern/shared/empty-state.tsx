import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TernButton } from '../core/tern-button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Tern Empty State
 * Display when there's no data to show
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-tern-gray-100 p-3 text-tern-gray-400">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-tern-gray-900">
        {title}
      </h3>
      {description && (
        <p className="mb-4 text-sm text-tern-gray-500 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <TernButton onClick={action.onClick} size="sm">
          {action.label}
        </TernButton>
      )}
    </div>
  )
}
