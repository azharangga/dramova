import type { Metadata } from "next";
import PartyLanding from "@/components/party/PartyLanding";

export const metadata: Metadata = {
  title: "Nonton Bareng · Dramova",
  description: "Tonton film dan serial bersama teman secara real-time dengan fitur Nonton Bareng Dramova.",
};

export default function PartyPage() {
  return <PartyLanding />;
}
