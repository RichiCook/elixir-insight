import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_id, public_url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert brand image analyst for Classy Cocktails, a premium ready-to-drink cocktail brand with three lines: Classic (alcoholic cocktails), No Regrets (alcohol-free), and Sparkling (carbonated aperitivo). Analyse the provided image thoroughly and extract all attributes using the provided function.`;

    const userPrompt = `Analyse this brand image comprehensively. Extract:
- Alt text in English and Italian (concise, descriptive, accessibility-focused)
- Scene description (natural language, 2-3 sentences)
- Any Classy Cocktails products visible (by name if recognisable)
- Foods, props, and objects visible
- People: present? how many? setting (solo/couple/group)?
- Setting: bar, home, outdoor, studio, table, restaurant
- Time of day: day, golden_hour, night, undefined
- Season: summer, winter, autumn, spring, undefined
- Mood tags (e.g. aperitivo, celebration, intimate, wellness, casual, luxury)
- Top 3 dominant hex colours
- Composition: portrait, landscape, square, close_up, lifestyle, flat_lay
- Brightness: dark, medium, bright
- Best sections this image suits: hero, editorial, serve_moment, pairing, heritage, gallery
- Which product lines it suits: Classic, No Regrets, Sparkling
- Whether context involves alcohol`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
              name: "extract_image_attributes",
              description: "Extract structured attributes from a brand image",
              parameters: {
                type: "object",
                properties: {
                  alt_text_en: { type: "string" },
                  alt_text_it: { type: "string" },
                  scene_description: { type: "string" },
                  cocktails_present: { type: "array", items: { type: "string" } },
                  foods_present: { type: "array", items: { type: "string" } },
                  props_present: { type: "array", items: { type: "string" } },
                  people_present: { type: "boolean" },
                  people_count: { type: "integer" },
                  people_setting: { type: "string", enum: ["solo", "couple", "group", "none"] },
                  setting: { type: "string", enum: ["bar", "home", "outdoor", "studio", "table", "restaurant", "undefined"] },
                  time_of_day: { type: "string", enum: ["day", "golden_hour", "night", "undefined"] },
                  season: { type: "string", enum: ["summer", "winter", "autumn", "spring", "undefined"] },
                  mood: { type: "array", items: { type: "string" } },
                  dominant_colors: { type: "array", items: { type: "string" }, maxItems: 3 },
                  composition: { type: "string", enum: ["portrait", "landscape", "square", "close_up", "lifestyle", "flat_lay"] },
                  brightness: { type: "string", enum: ["dark", "medium", "bright"] },
                  best_for_sections: { type: "array", items: { type: "string", enum: ["hero", "editorial", "serve_moment", "pairing", "heritage", "gallery"] } },
                  suitable_for_lines: { type: "array", items: { type: "string", enum: ["Classic", "No Regrets", "Sparkling"] } },
                  is_alcoholic_context: { type: "boolean" },
                  product_slugs: { type: "array", items: { type: "string" } },
                },
                required: ["alt_text_en", "scene_description", "composition", "brightness"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_image_attributes" } },
      }),
    });

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
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured data extracted" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: { image_id, ...extracted } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyse-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
