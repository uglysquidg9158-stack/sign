import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

  const authClient = createClient(url, anonKey);
  const { data: { user }, error: userError } = await authClient.auth.getUser(authHeader.slice(7));
  if (userError || !user) return json({ error: "Invalid session" }, 401);

  // getUser() returns server-verified user data. app_metadata is controlled by the server,
  // unlike user_metadata, so it is safe to use for this administrator check.
  if (user.app_metadata?.role !== "admin") return json({ error: "Administrator access required" }, 403);

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const body = await req.json();
    if (body.action === "create") {
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a name and valid email." }, 400);
      if (username.length < 4 || !/^[a-z0-9_]+$/.test(username)) return json({ error: "Username must be at least 4 characters and use letters, numbers, or underscores." }, 400);
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) return json({ error: "Password must be 8+ characters and include uppercase, lowercase, and a number." }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, username }, app_metadata: { role: "user" } });
      if (error) throw error;
      const { error: profileError } = await admin.from("profiles").upsert({ id: data.user.id, name, email, username, role: "user" });
      if (profileError) { await admin.auth.admin.deleteUser(data.user.id); throw profileError; }
      return json({ success: true, id: data.user.id });
    }
    if (body.action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "Account ID is required." }, 400);
      if (id === user.id) return json({ error: "You cannot delete your own administrator account." }, 400);
      const { data: target, error: targetError } = await admin.from("profiles").select("id").eq("id", id).single();
      if (targetError || !target) return json({ error: "Account not found." }, 404);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ success: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    // Supabase Auth and PostgREST errors may be plain objects, not Error instances.
    // Preserve their diagnostic fields so the client can display the real failure.
    const value = error && typeof error === "object"
      ? error as Record<string, unknown>
      : null;
    const message = error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof value?.message === "string"
          ? value.message
          : typeof value?.error_description === "string"
            ? value.error_description
            : typeof value?.error === "string"
              ? value.error
              : "Request failed.";

    return json({
      error: message,
      ...(typeof value?.code === "string" ? { code: value.code } : {}),
      ...(typeof value?.details === "string" ? { details: value.details } : {}),
      ...(typeof value?.hint === "string" ? { hint: value.hint } : {}),
    }, 400);
  }
});
