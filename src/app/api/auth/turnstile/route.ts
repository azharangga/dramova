import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({ token: "" }));
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  return NextResponse.json({ success: Boolean(data.success) }, { status: data.success ? 200 : 400 });
}
