import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";

export async function getAdminClient() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminEmail || adminEmail.startsWith("replace-with-")) {
    return {
      response: NextResponse.json({ error: "Admin dashboard management is not configured." }, { status: 503 }),
    };
  }
  if (!supabaseUrl || !secretKey || secretKey.startsWith("replace-with-")) {
    return {
      response: NextResponse.json({ error: "Server-side Supabase access is not configured." }, { status: 503 }),
    };
  }

  let authClient;
  try {
    authClient = await createSupabaseServerClient();
  } catch (error) {
    console.error("Could not initialize dashboard authentication.", error);
    return {
      response: NextResponse.json({ error: "Dashboard authentication is unavailable." }, { status: 503 }),
    };
  }

  const { data, error } = await authClient.auth.getUser();
  if (error) {
    console.error("Could not verify dashboard user.", error);
    return {
      response: NextResponse.json({ error: "Please sign in again to manage the dashboard." }, { status: 401 }),
    };
  }
  if (!data.user) {
    return {
      response: NextResponse.json({ error: "Sign in to manage the dashboard." }, { status: 401 }),
    };
  }
  if (data.user.email?.trim().toLowerCase() !== adminEmail) {
    return {
      response: NextResponse.json({ error: "Only the configured administrator can manage CRM data." }, { status: 403 }),
    };
  }

  return {
    client: createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}
