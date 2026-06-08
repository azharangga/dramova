"use client";

import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
