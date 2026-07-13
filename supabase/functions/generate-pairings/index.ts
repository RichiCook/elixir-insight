import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// L-12: single-origin CORS (match the other edge functions).
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://classy.aitems.dev",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANG_NAMES: Record<string, string> = {
  EN: "English", IT: "Italian", DE: "German", FR: "French", ES: "Spanish",
  PT: "Portuguese", NL: "Dutch",
};

function langName(code: string) {
  return LANG_NAMES[code.toUpperCase()] || code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

  // Role check: only admin, supply, and editor may invoke AI generation
  const { data: roleRows } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "supply", "editor"]);
  if (!roleRows || roleRows.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const foodPairing = String(body.foodPairing || "").trim();
    const occasion = body.occasion ? String(body.occasion).trim() : "";
    const productName = String(body.productName || "");
    const spirit = body.spirit ? String(body.spirit).trim() : "";
    const flavour = body.flavour ? String(body.flavour).trim() : "";
    const targetLangs: string[] = Array.isArray(body.targetLangs) && body.targetLangs.length
      ? body.targetLangs.map((l: string) => String(l).toUpperCase())
      : ["IT", "FR", "DE"];

    if (!foodPairing) {
      return new Response(JSON.stringify({ pairings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const langsList = targetLangs.map(langName).join(", ");

    const systemPrompt = `You are a food & beverage editor for a premium Italian cocktail brand.
You receive a single raw "food pairing" note for a cocktail. It is often terse, ALL CAPS, written in Italian, or contains typos and run-on text.
Turn it into a curated list of 1–4 distinct food-pairing cards for the consumer product page.

For EACH pairing card:
- name: a clean, concise English name in Title Case (2–4 words). Correct all spelling and grammar. If the source is Italian, render a natural English name, but keep Italian food terms that are used in English (e.g. Salumi, Cicchetti, Baccalà, Pecorino).
- subtitle: a short English descriptor (2–4 words) adding texture or context (e.g. "Sheep milk · DOP", "70% cacao · bitter", "Crispy · fried"). Use " · " as the separator. Optional but strongly preferred.
- emoji: exactly one food or drink emoji that best represents the pairing.
- translations: natural, idiomatic translations of BOTH name and subtitle into: ${langsList}.

Rules:
- Split combined values into separate cards (e.g. "AGED CHEESE + Salumi" → two cards; "Cold Cuts, Cheese & Spritz" → separate cards, but drop the cocktail's own name if it appears).
- Stay faithful to the source intent — clean, structure, and translate only. Never invent unrelated pairings.
- Keep every card premium and appetising; no generic filler.
- Fix ALL grammar and spelling mistakes from the source.
- Return ONLY the tool call.`;

    const ctx = [
      `Cocktail: ${productName}`,
      spirit && `Main spirit: ${spirit}`,
      flavour && `Flavour profile: ${flavour}`,
      occasion && `Occasion: ${occasion}`,
      `Raw food pairing note: "${foodPairing}"`,
      `Target languages: ${langsList}`,
    ].filter(Boolean).join("\n");

    // translations schema — one object per requested language
    const translationLangProps: Record<string, any> = {};
    for (const l of targetLangs) {
      translationLangProps[l] = {
        type: "object",
        properties: {
          name: { type: "string", description: `Pairing name in ${langName(l)}` },
          subtitle: { type: "string", description: `Pairing subtitle in ${langName(l)}` },
        },
        required: ["name"],
        additionalProperties: false,
      };
    }

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GOOGLE_AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: ctx },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_pairings",
            description: "Return the structured, translated food-pairing cards",
            parameters: {
              type: "object",
              properties: {
                pairings: {
                  type: "array",
                  description: "1 to 4 pairing cards",
                  items: {
                    type: "object",
                    properties: {
                      emoji: { type: "string", description: "A single food or drink emoji" },
                      name: { type: "string", description: "Clean English name, Title Case" },
                      subtitle: { type: "string", description: "Short English descriptor" },
                      translations: {
                        type: "object",
                        properties: translationLangProps,
                        required: targetLangs,
                        additionalProperties: false,
                      },
                    },
                    required: ["emoji", "name", "translations"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["pairings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_pairings" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Pairing generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
    const pairings = Array.isArray(args.pairings) ? args.pairings.slice(0, 4) : [];

    // Normalise: uppercase translation lang keys (consumer reads translations[LANG.toUpperCase()])
    const normalised = pairings.map((p: any) => {
      const translations: Record<string, { name?: string; subtitle?: string }> = {};
      if (p.translations && typeof p.translations === "object") {
        for (const [lang, fields] of Object.entries(p.translations)) {
          translations[lang.toUpperCase()] = fields as { name?: string; subtitle?: string };
        }
      }
      return {
        emoji: typeof p.emoji === "string" ? p.emoji : "✦",
        name: String(p.name || "").trim(),
        subtitle: p.subtitle ? String(p.subtitle).trim() : null,
        translations,
      };
    }).filter((p: any) => p.name);

    return new Response(JSON.stringify({ pairings: normalised }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pairings error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
