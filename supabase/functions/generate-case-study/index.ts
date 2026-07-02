import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Mirrors the auth/CORS/Gemini pattern used by analyse-image.
// Admin-only: this is a hidden beta feature.

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

// Allow the production origin plus localhost (for admin dev/testing). The security
// boundary is the admin JWT + role check below, not CORS — so permitting localhost
// here does not weaken access control.
function corsFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const prod = Deno.env.get("SITE_URL") ?? "https://classy.aitems.dev";
  const allow =
    origin === prod ||
    origin === "https://classy.aitems.dev" ||
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ? origin
      : prod;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Role check: admin only (hidden beta feature)
  const { data: roleRows } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin"]);
  if (!roleRows || roleRows.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { public_url, facts, scene_count, exclude_labels } = await req.json();
    if (!public_url) throw new Error("public_url is required");

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const sceneCount = Math.max(1, Math.min(8, Number(scene_count) || 4));
    const exclude = Array.isArray(exclude_labels) ? exclude_labels.filter(Boolean) : [];

    const systemPrompt =
      "You are a luxury brand strategist and copywriter producing a Denomination-style brand " +
      "case-study page from a single product photograph. Voice: restrained, confident, " +
      "luxury-editorial. Specificity over adjectives. No hype, no exclamation marks, no clichés. " +
      "British/neutral spelling. Anchor the design story in observable detail from the image. " +
      "Never contradict the image and never claim verifiable false facts (awards, vintages, prices). " +
      "Return your answer ONLY via the compose_case_study function.";

    const userPrompt =
      "Analyse this product photo and compose the case-study copy. " +
      "Identify the category (works for ANY product — drinks, fragrance, fashion, footwear/sneakers, " +
      "accessories, tech, etc.) and concrete visual details (form, palette, materials, finishes, typography). " +
      (facts && String(facts).trim().length
        ? `Use these supplied facts where relevant: ${String(facts).trim()}. `
        : "No extra facts supplied — infer tastefully from the image alone. ") +
      "Produce: name (short product/brand name), tagline (3-6 words), category (one word), " +
      "sector, client, intro (one positioning paragraph, 40-70 words), body (exactly 3 paragraphs: " +
      "1 naming & strategy, 2 the design/construction story rooted in what is visible, 3 finishes, " +
      "materials & details), closing (one short italic-worthy line), and 6-8 service tags. " +
      "ALSO return: profile (category, product_type, materials, finishes, palette as up to 4 hex colours, " +
      "typography, mood tags) describing what you observe; and scenes — EXACTLY " + sceneCount + " distinct photographic " +
      "scene briefs APPROPRIATE TO THIS PRODUCT CATEGORY for generating marketing imagery. The scenes MUST " +
      "fit the product type: e.g. footwear → studio on a plinth, on-foot street/lifestyle, top-down flatlay " +
      "with the box, dynamic motion/action; a drink → bar serve, ingredients flatlay, pour moment, lifestyle. " +
      "Never put cocktail/garnish/food elements on a non-beverage product. Each scene = { key (short slug), " +
      "label (2-4 words), prompt (a vivid photoreal generation brief: setting, props, lighting, composition, " +
      "with everything physically and realistically placed for THIS product type) }. " +
      "When writing scene briefs: keep props minimal and simple, and AVOID objects that image models distort — " +
      "no watches, dials, gauges, readable text on props, hands or faces. Vary the angle, setting and composition " +
      "across the scenes so each is clearly distinct." +
      (exclude.length
        ? ` IMPORTANT: these scene concepts already exist — ${exclude.join("; ")}. Produce ${sceneCount} NEW scenes that are` +
          " distinctly different in setting, composition and angle; do not repeat or closely resemble the existing ones."
        : "");

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
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: public_url } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "compose_case_study",
                description: "Return the editorial copy fields for a brand case-study page",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    tagline: { type: "string" },
                    category: { type: "string" },
                    sector: { type: "string" },
                    client: { type: "string" },
                    intro: { type: "string" },
                    body: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                    closing: { type: "string" },
                    services: { type: "array", items: { type: "string" }, minItems: 6, maxItems: 8 },
                    profile: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        product_type: { type: "string" },
                        materials: { type: "array", items: { type: "string" } },
                        finishes: { type: "array", items: { type: "string" } },
                        palette: { type: "array", items: { type: "string" }, maxItems: 4 },
                        typography: { type: "string" },
                        mood: { type: "array", items: { type: "string" } },
                      },
                    },
                    scenes: {
                      type: "array",
                      minItems: 1,
                      maxItems: 8,
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string" },
                          label: { type: "string" },
                          prompt: { type: "string" },
                        },
                        required: ["key", "label", "prompt"],
                      },
                    },
                  },
                  required: ["name", "tagline", "category", "sector", "client", "intro", "body", "closing", "services", "scenes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "compose_case_study" } },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured copy generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const { profile = null, scenes = [], ...copy } = parsed;
    // Defensive normalisation so the client always gets the expected shape.
    copy.body = Array.isArray(copy.body) ? copy.body.slice(0, 3) : [];
    copy.services = Array.isArray(copy.services) ? copy.services.slice(0, 8) : [];
    const cleanScenes = Array.isArray(scenes)
      ? scenes.slice(0, 8).filter((s: any) => s && s.prompt)
      : [];

    return new Response(JSON.stringify({ data: { copy, profile, scenes: cleanScenes } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-case-study error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
