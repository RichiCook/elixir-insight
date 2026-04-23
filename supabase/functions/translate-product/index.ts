import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LANG_NAMES: Record<string, string> = {
  EN: "English", IT: "Italian", DE: "German", FR: "French", ES: "Spanish",
  PT: "Portuguese", NL: "Dutch", JA: "Japanese", ZH: "Chinese (Simplified)",
  KO: "Korean", PL: "Polish", SV: "Swedish", DA: "Danish", FI: "Finnish",
  NO: "Norwegian", EL: "Greek", TR: "Turkish", RU: "Russian", AR: "Arabic",
  CS: "Czech", RO: "Romanian", HU: "Hungarian",
};

function langName(code: string) {
  return LANG_NAMES[code.toUpperCase()] || code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const source = body.source as Record<string, string | null>;
    const sourceLang = String(body.sourceLang || "EN");
    const targetLang = String(body.targetLang || "");
    const productName = String(body.productName || "");

    if (!targetLang || !source) {
      return new Response(JSON.stringify({ error: "Missing source or targetLang" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const fields = ["claim", "sensory_description", "ingredient_list_short", "ingredient_list_full", "allergens_local"];
    const payload: Record<string, string> = {};
    for (const f of fields) {
      const v = source[f];
      if (typeof v === "string" && v.trim()) payload[f] = v;
    }

    if (Object.keys(payload).length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional translator specialised in premium spirits, cocktails and food labelling.
Translate the provided product copy from ${langName(sourceLang)} to ${langName(targetLang)}.
Rules:
- Preserve brand names, ingredient trade names, and proper nouns.
- Keep formatting (line breaks, punctuation, percentages, units like ml, %vol).
- For ingredient lists: keep the same order and structure (commas, colons, percentages in parentheses).
- For allergens: use the local regulatory wording typical for ${langName(targetLang)} food labelling (e.g. "Contiene solfiti" in Italian).
- Be concise, idiomatic, and natural — not literal.
- Return ONLY the translation tool call. Never add commentary.`;

    const userPrompt = `Product: ${productName}\n\nFields to translate (JSON):\n${JSON.stringify(payload, null, 2)}`;

    const properties: Record<string, any> = {};
    for (const f of Object.keys(payload)) {
      properties[f] = { type: "string", description: `${f} translated to ${langName(targetLang)}` };
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_translations",
            description: "Return translated fields",
            parameters: { type: "object", properties, required: Object.keys(payload), additionalProperties: false },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_translations" } },
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
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};

    return new Response(JSON.stringify({ translations: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});