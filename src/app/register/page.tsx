import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Baru",
  description: "Daftar akun baru di Dramova secara gratis untuk menyimpan riwayat, favorit, dan membuat room watch party bersama teman.",
  robots: {
    index: false,
    follow: true,
  },
};

import { RegisterPage } from "@/components/pages/RegisterPage";

export default function Page() {
  return <RegisterPage />;
}
