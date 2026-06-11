"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import * as React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [position, setPosition] = React.useState<"top-center" | "top-right">("top-center")

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)")
    setPosition(mql.matches ? "top-right" : "top-center")
    const onChange = (e: MediaQueryListEvent) => setPosition(e.matches ? "top-right" : "top-center")
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  React.useEffect(() => {
    function handle(event: Event) {
      const item = (event as CustomEvent).detail;
      const method = item.kind === 'error' ? 'error' : item.kind === 'warning' ? 'warning' : item.kind === 'info' ? 'info' : item.kind === 'success' ? 'success' : item.kind === 'loading' ? 'loading' : 'message';
      const t = toast[method] || toast;
      t(item.title, {
        description: item.description,
        id: item.id,
        duration: item.duration,
      });
    }
    function handleDismiss(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.id) toast.dismiss(detail.id);
    }
    window.addEventListener("dramova:toast", handle);
    window.addEventListener("dramova:toast-dismiss", handleDismiss);
    return () => {
      window.removeEventListener("dramova:toast", handle);
      window.removeEventListener("dramova:toast-dismiss", handleDismiss);
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      closeButton={position === "top-right"}
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          error:
            "!bg-[var(--negative)] !text-white !border-[var(--negative)] [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
          success:
            "!bg-[var(--accent)] !text-white !border-[var(--accent)] [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
          warning:
            "!bg-[var(--warning)] !text-white !border-[var(--warning)] [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
          info:
            "!bg-[var(--bg-surface)] !text-[var(--text-primary)] !border-[var(--border-subtle)] [&_[data-description]]:!text-[var(--text-secondary)]",
          description: "group-[.toast]:!opacity-90",
          icon: "",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!bg-transparent !border-none !text-inherit !right-3 !top-1/2 !-translate-y-1/2 !left-auto !translate-x-0 hover:!bg-black/10 !opacity-70 hover:!opacity-100 transition-all !scale-125",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
