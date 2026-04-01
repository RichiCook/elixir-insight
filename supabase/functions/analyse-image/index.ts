import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to analysing
    await supabase.from("brand_images").update({ status: "analysing" }).eq("id", image_id);

    const systemPrompt = `You are an expert brand image analyst for Classy Cocktails, a premium ready-to-drink cocktail brand with three lines: Classic (alcoholic cocktails), No Regrets (alcohol-free), and Sparkling (carbonated aperitivo). The 12 products are: negroni, cosmopolitan, espresso-martini, daiquiri, margarita, pornstar-martini, paper-plane, penicillin, spicy-paloma, spritz, no-regrets-negroni, no-regrets-moment. Analyse the provided image thoroughly and extract all attributes using the provided function.`;

    const userPrompt = `Analyse this brand image comprehensively. Extract:
- Alt text in English and Italian (concise, descriptive, accessibility-focused)
- Scene description (natural language, 2-3 sentences)
- Any Classy Cocktails products visible (by slug if recognisable from the list)
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
      await supabase.from("brand_images").update({ status: "error" }).eq("id", image_id);
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
      await supabase.from("brand_images").update({ status: "error" }).eq("id", image_id);
      return new Response(JSON.stringify({ error: "No structured data extracted" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const attrs = JSON.parse(toolCall.function.arguments);

    // Save to image_attributes
    await supabase.from("image_attributes").upsert({
      image_id,
      alt_text_en: attrs.alt_text_en || null,
      alt_text_it: attrs.alt_text_it || null,
      scene_description: attrs.scene_description || null,
      cocktails_present: attrs.cocktails_present || [],
      foods_present: attrs.foods_present || [],
      props_present: attrs.props_present || [],
      people_present: attrs.people_present ?? false,
      people_count: attrs.people_count ?? 0,
      people_setting: attrs.people_setting || null,
      setting: attrs.setting || null,
      time_of_day: attrs.time_of_day || null,
      season: attrs.season || null,
      mood: attrs.mood || [],
      dominant_colors: attrs.dominant_colors || [],
      composition: attrs.composition || null,
      brightness: attrs.brightness || null,
      best_for_sections: attrs.best_for_sections || [],
      suitable_for_lines: attrs.suitable_for_lines || [],
      is_alcoholic_context: attrs.is_alcoholic_context ?? false,
      product_slugs: attrs.product_slugs || [],
    }, { onConflict: "image_id" });

    // Update brand_images status to complete
    await supabase.from("brand_images").update({ status: "complete" }).eq("id", image_id);

    // Auto-link products: match product_slugs to products and create product_images entries
    const productSlugs: string[] = attrs.product_slugs || [];
    const bestSections: string[] = attrs.best_for_sections || [];
    if (productSlugs.length > 0 && bestSections.length > 0) {
      const { data: matchedProducts } = await supabase
        .from("products")
        .select("id, slug")
        .in("slug", productSlugs);

      if (matchedProducts && matchedProducts.length > 0) {
        const links = [];
        for (const product of matchedProducts) {
          for (const section of bestSections) {
            links.push({
              product_id: product.id,
              image_id: image_id,
              section,
              sort_order: 0,
            });
          }
        }
        // Use upsert to avoid duplicates (unique index on product_id, image_id, section)
        await supabase.from("product_images").upsert(links, {
          onConflict: "product_id,image_id,section",
        });
        console.log(`Auto-linked image ${image_id} to ${matchedProducts.length} products across ${bestSections.length} sections`);
      }
    }

    return new Response(JSON.stringify({ data: { image_id, ...attrs } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyse-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
