import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider border transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground border-transparent",
        secondary:   "bg-surface-secondary text-muted-foreground border-border",
        destructive: "badge-rejected",
        outline:     "text-foreground border-border bg-transparent",
        approved:    "badge-approved",
        pending:     "badge-pending",
        draft:       "badge-draft",
        rejected:    "badge-rejected",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
