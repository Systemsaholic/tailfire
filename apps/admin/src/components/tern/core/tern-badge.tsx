import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Tern Badge Component
 * Implements Tern's badge/pill design system with status-specific variants
 * Now using Phoenix Voyages brand colors for primary accents
 */
const ternBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Status badges matching Tern screenshots
        inbound: "bg-tern-gray-200 text-tern-gray-700",
        planning: "bg-amber-100 text-amber-700",
        booked: "bg-blue-100 text-blue-700",
        traveling: "bg-cyan-100 text-cyan-700",
        completed: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",

        // General purpose variants
        default: "bg-primary text-primary-foreground",
        secondary: "bg-tern-gray-100 text-tern-gray-700",
        outline: "border border-tern-gray-300 text-tern-gray-700",
        teal: "bg-phoenix-gold-500 text-white",

        // Phoenix brand variants
        highlight: "bg-golden-orange-500 text-white",

        // Traveler type badge (from contact detail)
        traveler: "bg-tern-gray-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TernBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ternBadgeVariants> {}

function TernBadge({ className, variant, ...props }: TernBadgeProps) {
  return (
    <div className={cn(ternBadgeVariants({ variant }), className)} {...props} />
  )
}

export { TernBadge, ternBadgeVariants }
