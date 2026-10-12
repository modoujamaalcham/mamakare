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
  const { data: authData, error: authError } = await admin.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

  const { data: adminRole, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !adminRole) return json({ error: "Administrator access required" }, 403);

  let body: { email?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "doctor" || body.role === "nurse" ? body.role : null;
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !role) {
    return json({ error: "A valid email and staff role are required" }, 400);
  }

  const { data: invite, error: inviteError } = await admin
    .from("staff_invites")
    .insert({
      email,
      role,
      invited_by: authData.user.id,
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    })
    .select("id")
    .single();
  if (inviteError || !invite) {
    return json(
      {
        error:
          inviteError?.code === "23505"
            ? "A pending invite already exists for this email"
            : "Unable to create invitation",
      },
      inviteError?.code === "23505" ? 409 : 400,
    );
  }

  const { data: invited, error: authInviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { staff_invite_id: invite.id, requested_role: role } },
  );
  if (authInviteError || !invited.user) {
    await admin.from("staff_invites").delete().eq("id", invite.id);
    return json({ error: "Unable to send invitation" }, 400);
  }

  const { error: roleInsertError } = await admin.from("user_roles").insert({
    user_id: invited.user.id,
    role,
  });
  if (roleInsertError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    await admin.from("staff_invites").delete().eq("id", invite.id);
    return json({ error: "Unable to provision staff role" }, 500);
  }

  return json({ ok: true, inviteId: invite.id });
});
