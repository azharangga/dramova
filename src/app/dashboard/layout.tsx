import { requireSuperuser } from "@/lib/admin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: {
    index: false,
    follow: false,
  },
};

import DashboardLayoutClient from "./_DashboardLayoutClient";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side Superuser check before rendering layout
  await requireSuperuser();

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
