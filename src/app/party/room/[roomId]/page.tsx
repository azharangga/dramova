import type { Metadata } from "next";
import PartyRoomView from "@/components/party/PartyRoomView";

export const metadata: Metadata = {
  title: "Room Nonton Bareng · Dramova",
  description: "Sesi nonton bareng real-time di Dramova.",
};

export default async function PartyRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <PartyRoomView roomId={roomId} />;
}
