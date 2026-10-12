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

  let body: { email?: unknown; password?: unknown; full_name?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const role = ["admin", "doctor", "nurse"].includes(String(body.role))
    ? (body.role as "admin" | "doctor" | "nurse")
    : null;
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !role) {
    return json(
      { error: "Name, valid email, role, and a password of at least 8 characters are required" },
      400,
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    return json({ error: createError?.message || "Unable to create staff account" }, 400);
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: created.user.id,
    role,
  });
  if (roleError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Unable to assign staff role" }, 500);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name: fullName,
    email,
  });
  if (profileError) {
    await admin.from("user_roles").delete().eq("user_id", created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Unable to save staff profile" }, 500);
  }

  return json({ ok: true, userId: created.user.id });
});
