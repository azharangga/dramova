import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akun Saya",
  robots: {
    index: false,
    follow: false,
  },
};

import { ProfilePage } from "@/components/pages/ProfilePage";
import PageShell from "@/components/PageShell";

export default function Page() {
  return (
    <PageShell>
      <ProfilePage />
    </PageShell>
  );
}
