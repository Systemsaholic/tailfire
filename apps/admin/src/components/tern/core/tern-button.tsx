import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Tern Button Component
 * Implements Tern's button design system with Phoenix Gold primary color
 */
const ternButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phoenix-gold-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: Phoenix Gold
        default: 'bg-phoenix-gold-500 text-white hover:bg-phoenix-gold-600',

        // Destructive
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',

        // Outline: border with tern colors
        outline: 'border border-tern-gray-300 bg-white hover:bg-tern-gray-50 text-tern-gray-700',

        // Secondary: light gray background
        secondary: 'bg-tern-gray-100 text-tern-gray-900 hover:bg-tern-gray-200',

        // Ghost: transparent with hover
        ghost: 'hover:bg-tern-gray-100 hover:text-tern-gray-900',

        // Link: underline text
        link: 'text-phoenix-gold-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface TernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ternButtonVariants> {
  asChild?: boolean
}

const TernButton = React.forwardRef<HTMLButtonElement, TernButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(ternButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
TernButton.displayName = 'TernButton'

export { TernButton, ternButtonVariants }
