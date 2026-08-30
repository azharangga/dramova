import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Akun",
  description: "Masuk ke akun Dramova Anda untuk menikmati streaming personalisasi, riwayat nonton, dan watch party.",
  robots: {
    index: false,
    follow: true,
  },
};

import { LoginPage } from "@/components/pages/LoginPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
