import * as React from "react"

import { cn } from "@/lib/utils"

const variants = {
  default: "bg-[var(--accent)] text-[var(--accent-control-text)] shadow-[0_12px_28px_rgba(43,166,65,0.22)] hover:bg-[var(--accent-hover)]",
  outline: "border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--bg-raised)_86%,transparent)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]",
  secondary: "bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
  destructive: "bg-[color-mix(in_srgb,var(--negative)_16%,transparent)] text-[var(--negative)] hover:bg-[color-mix(in_srgb,var(--negative)_22%,transparent)]",
  link: "h-auto p-0 text-[var(--accent)] underline-offset-4 hover:underline",
}

const sizes = {
  default: "h-10 gap-2 px-4",
  xs: "h-7 gap-1.5 px-2 text-xs",
  sm: "h-8 gap-1.5 px-3 text-xs",
  lg: "h-11 gap-2.5 px-5",
  icon: "size-10",
  "icon-xs": "size-7",
  "icon-sm": "size-8",
  "icon-lg": "size-11",
}

function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className
  )
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> &
  {
    variant?: keyof typeof variants
    size?: keyof typeof sizes
  }) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
