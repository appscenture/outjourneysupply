import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code || url.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/login?google=error", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Outjourney could not complete the Google OAuth callback.", error);
    return NextResponse.redirect(new URL("/login?google=error", url.origin));
  }

  return NextResponse.redirect(new URL("https://www.outjourney.id/workspace"));
}
