import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, product_name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a technical data extraction specialist for beverage products. Given the raw text from a technical/specification PDF sheet, extract ALL available data into a structured format.

Rules:
- Extract the COMPLETE ingredient list exactly as written in the document, preserving all sub-ingredient details, asterisks for organic markers, and percentage information. Extract both English and Italian versions if present.
- For the 14 EU allergens, return true if the document says "Yes" or lists it as present/contains, false if it says "No" or is absent or "free from".
- Extract ALL compliance regulation references separately (compliance_regulation_1, _2, _3) and also concatenated into compliance_references.
- Extract supplier contact details completely (name, address, VAT, phone, email).
- Extract document metadata (revision number, date).
- Be precise with numbers and units.
- If a field is not found in the document, return null — never guess or fabricate.`;

    const userPrompt = `Extract all technical data from this product specification sheet for "${product_name || 'Unknown Product'}". Return the data using the extract_technical_data function.

Document text:
${text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_technical_data",
              description: "Extract structured technical data from a beverage spec sheet",
              parameters: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  product_version: { type: "string" },
                  application: { type: "string" },
                  recommended_dosage: { type: "string" },
                  recommended_dosage_disclaimer: { type: "string" },
                  main_flavour_components: { type: "string" },
                  ingredient_list_full_en: { type: "string", description: "Full legal ingredient declaration in English" },
                  ingredient_list_full_it: { type: "string", description: "Full legal ingredient declaration in Italian if present" },
                  limits_of_application: { type: "string" },
                  substances_annexes: { type: "string" },
                  maximum_dosage_note: { type: "string" },
                  ph: { type: "string" },
                  brix: { type: "string" },
                  energy_kj: { type: "string" },
                  energy_kcal: { type: "string" },
                  fats: { type: "string" },
                  saturated_fats: { type: "string" },
                  trans_fats: { type: "string" },
                  carbohydrates: { type: "string" },
                  sugars: { type: "string" },
                  fibre: { type: "string" },
                  proteins: { type: "string" },
                  salt: { type: "string" },
                  microbiological_count: { type: "string" },
                  microbiological_unit: { type: "string" },
                  odor: { type: "string" },
                  appearance: { type: "string" },
                  colour: { type: "string" },
                  taste_profile: { type: "string" },
                  allergen_gluten: { type: "boolean" },
                  allergen_crustaceans: { type: "boolean" },
                  allergen_eggs: { type: "boolean" },
                  allergen_fish: { type: "boolean" },
                  allergen_peanuts: { type: "boolean" },
                  allergen_soybeans: { type: "boolean" },
                  allergen_milk: { type: "boolean" },
                  allergen_nuts: { type: "boolean" },
                  allergen_celery: { type: "boolean" },
                  allergen_mustard: { type: "boolean" },
                  allergen_sesame: { type: "boolean" },
                  allergen_sulphites: { type: "boolean" },
                  allergen_lupin: { type: "boolean" },
                  allergen_molluscs: { type: "boolean" },
                  gmo_declaration: { type: "string" },
                  ionising_radiation: { type: "string" },
                  additional_information: { type: "string" },
                  shelf_life: { type: "string" },
                  storage_conditions: { type: "string" },
                  storage_after_opening: { type: "string" },
                  compliance_regulation_1: { type: "string" },
                  compliance_regulation_2: { type: "string" },
                  compliance_regulation_3: { type: "string" },
                  compliance_references: { type: "string", description: "All compliance refs concatenated" },
                  supplier_name: { type: "string" },
                  supplier_address: { type: "string" },
                  supplier_vat: { type: "string" },
                  supplier_phone: { type: "string" },
                  supplier_email: { type: "string" },
                  document_revision: { type: "string" },
                  document_date: { type: "string" },
                },
                required: ["product_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_technical_data" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
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

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-tech-sheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
