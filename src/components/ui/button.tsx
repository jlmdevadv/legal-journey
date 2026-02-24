import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-secondary rounded",
        secondary:
          "bg-transparent border border-border text-foreground hover:bg-surface-secondary rounded",
        ghost:
          "text-muted-foreground hover:bg-surface-secondary hover:text-foreground rounded",
        link:
          "text-primary underline-offset-4 hover:underline",
        "outline-primary":
          "border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3.5 py-1.5 text-xs",
        lg:      "h-11 px-7 py-2.5 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
