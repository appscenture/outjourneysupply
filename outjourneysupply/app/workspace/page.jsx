import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import WorkspaceClient from "./workspace-client";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL;
  if (!adminEmail) {
    throw new Error("Set NEXT_PUBLIC_ADMIN_LOGIN_EMAIL in .env.local to protect the workspace.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError" && error.status !== 401) {
    throw new Error(`Could not verify the workspace session: ${error.message}`);
  }

  if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    redirect("/login");
  }

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || "Admin";
  return <WorkspaceClient userName={userName} />;
}
