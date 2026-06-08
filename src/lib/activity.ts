import { createClient } from "@/lib/supabase/client";

type ActivityPayload = {
  type: string;
  metadata?: Record<string, unknown>;
};

export async function trackActivity(payload: ActivityPayload) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Activity tracking must never block the app.
  }
}

export async function upsertWatchProgress(data: {
  contentType: string;
  platform: string;
  contentId: string;
  episode?: number;
  title?: string;
  cover?: string;
  currentTime?: number;
  duration?: number;
  completed?: boolean;
}) {
  try {
    await fetch("/api/activity/watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    });
  } catch {}
}

export function getSupabaseForActivity() {
  return createClient();
}
