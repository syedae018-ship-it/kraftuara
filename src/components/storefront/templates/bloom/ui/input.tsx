import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-bloom-border bg-bloom-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-bloom-foreground placeholder:text-bloom-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bloom-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-bloom-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
