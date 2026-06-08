"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "error" | "loading";

export type ToastItem = {
  id: string;
  nonce: number;
  title: string;
  description?: string;
  kind: ToastKind;
  duration?: number;
};

type ToastInput = string | { title: string; description?: string; id?: string; duration?: number };

const TOAST_EVENT = "dramova:toast";
const TOAST_DISMISS_EVENT = "dramova:toast-dismiss";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalize(input: ToastInput, kind: ToastKind, defaults?: Partial<ToastItem>) {
  const payload = typeof input === "string" ? { title: input } : input;
  return {
    id: payload.id || defaults?.id || createId(),
    nonce: Date.now(),
    title: payload.title,
    description: payload.description ?? defaults?.description,
    kind,
    duration: payload.duration ?? defaults?.duration ?? (kind === "loading" ? 100000 : 3200),
  } satisfies ToastItem;
}

function dispatch(item: ToastItem) {
  if (typeof window === "undefined") return item.id;
  window.dispatchEvent(new CustomEvent<ToastItem>(TOAST_EVENT, { detail: item }));
  return item.id;
}

function withOptions(input: ToastInput, options?: { id?: string; description?: string; duration?: number }) {
  if (!options) return input;
  if (typeof input === "string") return { title: input, ...options };
  return { ...input, ...options };
}

export const toast = {
  message(input: ToastInput) {
    return dispatch(normalize(input, "default"));
  },
  success(input: ToastInput, options?: { id?: string; description?: string; duration?: number }) {
    return dispatch(normalize(withOptions(input, options), "success"));
  },
  error(input: ToastInput, options?: { id?: string; description?: string; duration?: number }) {
    return dispatch(normalize(withOptions(input, options), "error"));
  },
  loading(input: ToastInput, options?: { id?: string; description?: string; duration?: number }) {
    return dispatch(normalize(withOptions(input, options), "loading"));
  },
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") return <CheckCircle2 className="h-5 w-5" />;
  if (kind === "error") return <XCircle className="h-5 w-5" />;
  if (kind === "loading") return <Loader2 className="h-5 w-5 animate-spin" />;
  return <Info className="h-5 w-5" />;
}

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    function handle(event: Event) {
      const item = (event as CustomEvent<ToastItem>).detail;
      setItems((current) => {
        const next = current.filter((toastItem) => toastItem.id !== item.id);
        return [item, ...next].slice(0, 5);
      });
    }
    function handleDismiss(event: Event) {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (!detail?.id) return;
      setItems((current) => current.filter((toastItem) => toastItem.id !== detail.id));
    }
    window.addEventListener(TOAST_EVENT, handle);
    window.addEventListener(TOAST_DISMISS_EVENT, handleDismiss);
    return () => {
      window.removeEventListener(TOAST_EVENT, handle);
      window.removeEventListener(TOAST_DISMISS_EVENT, handleDismiss);
    };
  }, []);

  return (
    <ToastPrimitives.Provider swipeDirection="right">
      {items.map((item) => (
        <ToastPrimitives.Root
          key={`${item.id}-${item.nonce}`}
          defaultOpen
          duration={item.duration}
          className={cn("shadcn-toast", `shadcn-toast--${item.kind}`)}
          onOpenChange={(open) => {
            if (!open) setItems((current) => current.filter((toastItem) => toastItem.id !== item.id));
          }}
        >
          <div className="shadcn-toast__icon"><ToastIcon kind={item.kind} /></div>
          <div className="shadcn-toast__body">
            <ToastPrimitives.Title className="shadcn-toast__title">{item.title}</ToastPrimitives.Title>
            {item.description ? (
              <ToastPrimitives.Description className="shadcn-toast__description">
                {item.description}
              </ToastPrimitives.Description>
            ) : null}
          </div>
          <ToastPrimitives.Close className="shadcn-toast__close" aria-label="Tutup">
            <X className="h-4 w-4" />
          </ToastPrimitives.Close>
        </ToastPrimitives.Root>
      ))}
      <ToastPrimitives.Viewport className="shadcn-toast-viewport" />
    </ToastPrimitives.Provider>
  );
}
