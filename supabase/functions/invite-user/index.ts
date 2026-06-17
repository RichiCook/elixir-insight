import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://classy.aitems.dev",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is authenticated
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify caller has admin role; also retrieve their brand_id for scoping
  const { data: callerRoleRows } = await supabaseAdmin
    .from("user_roles")
    .select("role, brand_id")
    .eq("user_id", user.id)
    .eq("role", "admin");
  if (!callerRoleRows || callerRoleRows.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // A super-admin has brand_id = null; a brand-scoped admin has a specific brand_id
  const callerBrandId: string | null = callerRoleRows[0].brand_id ?? null;

  const { email, role, brand_id: requestedBrandId } = await req.json();
  if (!email || !role) {
    return new Response(JSON.stringify({ error: "email and role are required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // L-08 — allowlist the assignable role. Brand-scoped admins may only assign
  // non-admin roles; only a super-admin (brand_id = null) can mint admins.
  const ASSIGNABLE = new Set(["editor", "marketing", "supply", "moderator", "user"]);
  const allowedRoles = callerBrandId === null ? new Set([...ASSIGNABLE, "admin"]) : ASSIGNABLE;
  if (!allowedRoles.has(role)) {
    return new Response(JSON.stringify({ error: "Forbidden: you can't assign that role" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Brand-scoped admins can only invite within their own brand.
  // Super-admins (callerBrandId = null) may specify any brand_id or null.
  const assignedBrandId: string | null =
    callerBrandId !== null ? callerBrandId : (requestedBrandId ?? null);

  // Check if the user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let targetUserId: string;

  if (existing) {
    targetUserId = existing.id;
  } else {
    // Invite new user — sends magic-link email automatically
    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteErr || !invited?.user) {
      return new Response(JSON.stringify({ error: inviteErr?.message ?? "Failed to invite user" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    targetUserId = invited.user.id;
  }

  // Assign the role, scoped to the correct brand
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: targetUserId, role, brand_id: assignedBrandId })
    .select();

  if (roleErr) {
    // Duplicate role is fine — user already has it
    if (!roleErr.message.includes("duplicate") && !roleErr.code?.includes("23505")) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      invited: !existing,
      message: existing
        ? `Role assigned to existing user ${email}`
        : `Invite sent to ${email} and role assigned`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
