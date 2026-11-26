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

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: caller, error: callerError } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (callerError || caller?.role !== "admin") return json({ error: "Administrator access required" }, 403);

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
      const { data: target, error: targetError } = await admin.from("profiles").select("role").eq("id", id).single();
      if (targetError) throw targetError;
      if (target.role === "admin") return json({ error: "Administrator accounts cannot be deleted here." }, 403);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ success: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request failed." }, 400);
  }
});
