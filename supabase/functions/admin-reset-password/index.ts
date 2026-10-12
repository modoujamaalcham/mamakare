import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !serviceRoleKey || !authorization?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: caller, error: callerError } = await admin.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  if (callerError || !caller.user) return json({ error: "Unauthorized" }, 401);

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) return json({ error: "Administrator access required" }, 403);

  let body: { user_id?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const userId = typeof body.user_id === "string" ? body.user_id : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!userId || password.length < 8) {
    return json(
      { error: "A staff account and a password of at least 8 characters are required" },
      400,
    );
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
});
