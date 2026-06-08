import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!password) return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (verifyError) return NextResponse.json({ error: "Password salah" }, { status: 400 });

  const admin = createAdminClient();
  await admin.storage.from("avatars").remove((await admin.storage.from("avatars").list(user.id)).data?.map((f) => `${user.id}/${f.name}`) || []);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
