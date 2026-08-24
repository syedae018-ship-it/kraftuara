import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-bloom-primary/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-bloom-primary text-bloom-primary-foreground shadow hover:bg-bloom-primary/80",
        secondary:
          "border-transparent bg-bloom-secondary text-bloom-foreground hover:bg-bloom-secondary/80",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-500",
        outline: "text-bloom-foreground border-bloom-border",
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
