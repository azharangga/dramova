import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveInviteCode, resolveRoomCode } from "@/lib/party";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Gabung Room · Dramova",
  description: "Bergabung ke room nonton bareng Dramova.",
};

export default async function PartyJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/party/join/${code}`);
  }

  // Try invite code first, then room code as fallback (both are 6-char uppercase)
  let roomId: string | null = null;
  let error: string | null = null;

  const inviteResult = await resolveInviteCode(supabase, code);
  if (inviteResult.roomId) {
    roomId = inviteResult.roomId;
  } else {
    const roomResult = await resolveRoomCode(supabase, code);
    if (roomResult.roomId) {
      roomId = roomResult.roomId;
    } else {
      error = inviteResult.error || roomResult.error || "Kode room tidak valid atau sudah kedaluwarsa.";
    }
  }

  // If we found a valid room, redirect to the room page
  if (roomId) {
    redirect(`/party/room/${roomId}?invite=${code}`);
  }

  // Otherwise show error page
  return (
    <PageShell>
      <section className="party-error-page">
        <div className="party-error-card">
          <div className="party-error-icon">
            <i data-lucide="alert-circle" className="h-16 w-16"></i>
          </div>
          <h1 className="party-error-title">Tidak Dapat Bergabung</h1>
          <p className="party-error-message">
            {error || "Kode room tidak valid atau sudah kedaluwarsa."}
          </p>
          <div className="party-error-actions">
            <a href="/party" className="party-btn party-btn-primary">
              <i data-lucide="arrow-left" className="h-4 w-4"></i>
              <span>Kembali ke Nonton Bareng</span>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
