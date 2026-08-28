"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  activeTab: string
  setActiveTab: (val: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({
  className,
  defaultValue = "",
  value,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
}) {
  const [selected, setSelected] = React.useState(value || defaultValue)
  const activeTab = value !== undefined ? value : selected
  const setActiveTab = React.useCallback(
    (val: string) => {
      if (value === undefined) setSelected(val)
      onValueChange?.(val)
    },
    [value, onValueChange],
  )
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn("inline-flex w-fit items-center justify-center rounded-full bg-[var(--bg-raised)] p-1 text-[var(--text-secondary)]", className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const isSelected = ctx?.activeTab === value
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={isSelected ? "active" : "inactive"}
      onClick={(e) => {
        ctx?.setActiveTab(value)
        onClick?.(e)
      }}
      className={cn(
        "relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-3 text-xs font-bold whitespace-nowrap transition-all hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-[var(--accent)] text-[var(--accent-control-text)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.activeTab !== value) return null
  return (
    <div
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
