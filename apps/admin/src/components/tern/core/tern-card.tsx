import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Tern Card Component
 * Implements Tern's card design with minimal shadow, subtle border, and clean spacing
 */
const TernCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-md border border-tern-gray-200 bg-white shadow-sm p-6 transition-all duration-200 hover:shadow-md motion-reduce:transition-none',
      className
    )}
    {...props}
  />
))
TernCard.displayName = 'TernCard'

const TernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 p-4', className)}
    {...props}
  />
))
TernCardHeader.displayName = 'TernCardHeader'

const TernCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-tern-gray-900',
      className
    )}
    {...props}
  />
))
TernCardTitle.displayName = 'TernCardTitle'

const TernCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-tern-gray-500', className)}
    {...props}
  />
))
TernCardDescription.displayName = 'TernCardDescription'

const TernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
))
TernCardContent.displayName = 'TernCardContent'

const TernCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
))
TernCardFooter.displayName = 'TernCardFooter'

export {
  TernCard,
  TernCardHeader,
  TernCardFooter,
  TernCardTitle,
  TernCardDescription,
  TernCardContent
}
