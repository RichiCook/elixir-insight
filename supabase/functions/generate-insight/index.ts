import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Multi-origin CORS. Access-Control-Allow-Origin can only carry ONE origin, so
 * echo the caller's origin when it's allowed (and set Vary: Origin so caches
 * don't cross-serve). Keeps the old + new domains working during a domain
 * cutover. Override the list with ALLOWED_ORIGINS (comma-separated).
 * The security boundary is the JWT/role check in each handler, not CORS.
 */
function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const site = Deno.env.get("SITE_URL");
  return [...new Set([...(site ? [site] : []), "https://classycocktails.info", "https://classy.aitems.dev", ...extra])];
}

function corsFor(req: Request) {
  const list = allowedOrigins();
  const origin = req.headers.get("Origin") ?? "";
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allow = list.includes(origin) || isLocal ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Role check
  const { data: roleRows } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "supply", "editor", "marketing"]);

  if (!roleRows || roleRows.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { productName, period, scans, changePct } = await req.json();

    if (!productName || !period) {
      return new Response(JSON.stringify({ error: "productName and period are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const fmtPct = (n: number) => (n > 0 ? "+" : "") + n + "%";

    const prompt =
      `You are an analytics copilot inside a cocktail brand's product platform. ` +
      `Write ONE punchy sentence (max 16 words, no emoji, no quotes) summarising QR-scan performance for "${productName}". ` +
      `Period that matters most: this ${period}. ` +
      `Scans this ${period}: ${scans}. ` +
      `Change vs previous ${period}: ${fmtPct(changePct)}. ` +
      `Tone: sharp, confident, like a smart colleague. Mention the direction and a plausible reason or next step.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          thinking: { type: "disabled" },
          messages: [
            { role: "user", content: prompt },
          ],
          max_tokens: 80,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI call failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content?.trim() ?? null;
    const clean = text ? text.replace(/^["']|["']$/g, "") : null;

    return new Response(JSON.stringify({ insight: clean }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
