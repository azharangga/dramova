import * as React from "react"

import { cn } from "@/lib/utils"

const variants = {
  default: "bg-[var(--accent)] text-[var(--accent-control-text)]",
  secondary: "bg-[var(--bg-raised)] text-[var(--text-secondary)]",
  destructive: "bg-[color-mix(in_srgb,var(--negative)_16%,transparent)] text-[var(--negative)]",
  outline: "border-[var(--border-muted)] text-[var(--text-primary)]",
  ghost: "text-[var(--text-secondary)]",
  link: "text-[var(--accent)] underline-offset-4 hover:underline",
}

function badgeVariants({
  variant = "default",
  className,
}: {
  variant?: keyof typeof variants
  className?: string
} = {}) {
  return cn(
    "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-bold whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
    variants[variant],
    className
  )
}

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> &
  { variant?: keyof typeof variants }) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
