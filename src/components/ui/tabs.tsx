"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

const listVariants = {
  default: "bg-[var(--bg-raised)] p-1",
  line: "gap-1 bg-transparent",
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: keyof typeof listVariants }) {
  return (
    <div
      data-slot="tabs-list"
      data-variant={variant}
      className={cn("inline-flex w-fit items-center justify-center rounded-full text-[var(--text-secondary)]", listVariants[variant], className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-4 text-sm font-bold whitespace-nowrap transition-all hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 aria-selected:bg-[var(--accent)] aria-selected:text-[var(--accent-control-text)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
