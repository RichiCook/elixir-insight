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
    const occasion = String(body.occasion || "").trim();
    const productName = String(body.productName || "");
    const spirit = body.spirit ? String(body.spirit).trim() : "";
    const flavour = body.flavour ? String(body.flavour).trim() : "";
    const garnish = body.garnish ? String(body.garnish).trim() : "";
    const glass = body.glass ? String(body.glass).trim() : "";
    const targetLangs: string[] = Array.isArray(body.targetLangs) && body.targetLangs.length
      ? body.targetLangs.map((l: string) => String(l).toUpperCase())
      : ["IT", "FR", "DE"];

    if (!occasion) {
      return new Response(JSON.stringify({ moments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const langsList = targetLangs.map(langName).join(", ");

    const systemPrompt = `You are a lifestyle copywriter for a premium Italian cocktail brand.
You receive a single raw "occasion pairing" note for a cocktail taken from a technical sheet. It is often terse, ALL CAPS, misspelled (e.g. "APERITF"), a bare word ("DINNER"), or free text ("Post-round aperitivo, elegant outdoor gatherings").
Turn it into 2–3 distinct "serve moment" cards for the consumer product page. Each card paints one moment when this cocktail shines.

For EACH card:
- occasion: a short, clean English occasion label in Title Case (1–3 words, e.g. "Aperitivo", "After Dinner", "Golden Hour Outdoors"). Correct all spelling.
- title: an evocative English title (2–4 words) that names the mood of the moment (e.g. "Golden Hour", "Late Night Character", "Made to Share"). Not a repeat of the occasion label.
- description: one or two short English sentences (max ~120 characters total) that set the scene and, where natural, nod to how it is served. Elegant, confident, never salesy. Example register: "Serve over a large ice cube with an orange twist. The ritual begins."
- emoji: exactly one emoji that best evokes the moment (used as a fallback when the card has no photo).
- translations: natural, idiomatic translations of occasion, title, and description into: ${langsList}.

Rules:
- If the source lists multiple occasions (e.g. "Aperitivo · After Dinner"), give each its own card.
- If the source is a single word, expand it into 2 distinct, credible moments for this specific cocktail.
- Stay faithful to the source intent; use the cocktail's serving details (glass, garnish) only as flavour for the copy, never invent occasions that contradict the source.
- Fix ALL grammar and spelling mistakes from the source.
- Return ONLY the tool call.`;

    const ctx = [
      `Cocktail: ${productName}`,
      spirit && `Main spirit: ${spirit}`,
      flavour && `Flavour profile: ${flavour}`,
      garnish && `Suggested garnish: ${garnish}`,
      glass && `Suggested glass: ${glass}`,
      `Raw occasion pairing note: "${occasion}"`,
      `Target languages: ${langsList}`,
    ].filter(Boolean).join("\n");

    // translations schema — one object per requested language
    const translationLangProps: Record<string, any> = {};
    for (const l of targetLangs) {
      translationLangProps[l] = {
        type: "object",
        properties: {
          occasion: { type: "string", description: `Occasion label in ${langName(l)}` },
          title: { type: "string", description: `Card title in ${langName(l)}` },
          description: { type: "string", description: `Card description in ${langName(l)}` },
        },
        required: ["occasion", "title", "description"],
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
            name: "return_serve_moments",
            description: "Return the structured, translated serve-moment cards",
            parameters: {
              type: "object",
              properties: {
                moments: {
                  type: "array",
                  description: "2 to 3 serve-moment cards",
                  items: {
                    type: "object",
                    properties: {
                      emoji: { type: "string", description: "A single evocative emoji" },
                      occasion: { type: "string", description: "Short occasion label, Title Case" },
                      title: { type: "string", description: "Evocative card title" },
                      description: { type: "string", description: "1–2 short scene-setting sentences" },
                      translations: {
                        type: "object",
                        properties: translationLangProps,
                        required: targetLangs,
                        additionalProperties: false,
                      },
                    },
                    required: ["emoji", "occasion", "title", "description", "translations"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["moments"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_serve_moments" } },
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
      return new Response(JSON.stringify({ error: "Serve-moment generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
    const moments = Array.isArray(args.moments) ? args.moments.slice(0, 3) : [];

    // Normalise: uppercase translation lang keys (consumer reads translations[LANG.toUpperCase()])
    const normalised = moments.map((m: any) => {
      const translations: Record<string, { occasion?: string; title?: string; description?: string }> = {};
      if (m.translations && typeof m.translations === "object") {
        for (const [lang, fields] of Object.entries(m.translations)) {
          translations[lang.toUpperCase()] = fields as { occasion?: string; title?: string; description?: string };
        }
      }
      return {
        emoji: typeof m.emoji === "string" ? m.emoji : "✦",
        occasion: String(m.occasion || "").trim(),
        title: String(m.title || "").trim(),
        description: String(m.description || "").trim(),
        translations,
      };
    }).filter((m: any) => m.occasion && m.title && m.description);

    return new Response(JSON.stringify({ moments: normalised }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-serve-moments error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
