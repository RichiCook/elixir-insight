import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a specialist in analysing food and beverage technical documents for an Italian premium cocktail brand called Classy Cocktails. You will receive extracted text from a PDF.
First identify the document type:

If it contains "Rapporto di prova", "Test report", "UNIONE ITALIANA VINI", "laboratorio accreditato", or has a parameter/method/unit/result table structure → LABORATORY_TEST_REPORT
If it contains "Technical Data Sheet", "scheda tecnica", ingredient declarations with sub-ingredients, allergen matrix with Yes/No, organoleptic profile (odor/appearance/taste), storage conditions, GMO declaration → SUPPLIER_TECH_SHEET
Otherwise → SUPPLIER_TECH_SHEET (default)

Return ONLY this exact JSON object, no markdown, no explanation, null for any field not found:
{
"document_type": "SUPPLIER_TECH_SHEET" or "LABORATORY_TEST_REPORT",
"document_date": "",
"document_revision": "",
"batch_number": "",
"label_date": "",
"product_name": "",
"product_version": "",
"application": "",
"recommended_dosage": "",
"ingredient_list_full_en": "",
"ingredient_list_full_it": "",
"main_flavour_components": "",
"energy_kj": "",
"energy_kcal": "",
"fats": "",
"saturated_fats": "",
"trans_fats": "",
"carbohydrates": "",
"sugars": "",
"fibre": "",
"proteins": "",
"salt": "",
"ph": "",
"brix": "",
"total_acidity": "",
"alcoholic_strength": "",
"sodium_mg": "",
"microbiological_count": "",
"odor": "",
"appearance": "",
"colour": "",
"taste_profile": "",
"allergen_gluten": false,
"allergen_crustaceans": false,
"allergen_eggs": false,
"allergen_fish": false,
"allergen_peanuts": false,
"allergen_soybeans": false,
"allergen_milk": false,
"allergen_nuts": false,
"allergen_celery": false,
"allergen_mustard": false,
"allergen_sesame": false,
"allergen_sulphites": false,
"allergen_lupin": false,
"allergen_molluscs": false,
"gmo_declaration": "",
"ionising_radiation": "",
"additional_information": "",
"shelf_life": "",
"storage_conditions": "",
"storage_after_opening": "",
"compliance_regulation_1": "",
"compliance_regulation_2": "",
"compliance_regulation_3": "",
"compliance_references": "",
"supplier_name": "",
"supplier_address": "",
"supplier_vat": "",
"supplier_phone": "",
"supplier_email": "",
"laboratory_name": "",
"laboratory_address": "",
"test_report_number": "",
"accreditation_number": ""
}

RULES FOR SUPPLIER_TECH_SHEET:
- ingredient_list_full_en: full legal ingredient declaration in English, preserving all sub-ingredient details, organic asterisks, and additive codes
- ingredient_list_full_it: same in Italian if present
- allergens: extract from the allergen matrix table — true if the document says Yes/present, false if No/absent
- ph: must be a simple decimal number between 0-14 (e.g. "3.9"). Never include units or descriptions in this field
- brix: simple decimal number (e.g. "8.8")
- energy_kcal, fats, carbohydrates etc: clean numbers only, no units (e.g. "35" not "35 kcal/100ml")
- shelf_life: e.g. "12 months from production batch date"
- supplier_name/address/phone/email: from the supplier's letterhead at the bottom of the document
- compliance_references: concatenate all EU regulation references found
- laboratory_name, laboratory_address, test_report_number, accreditation_number: set to null (not present in tech sheets)

RULES FOR LABORATORY_TEST_REPORT:
- Nutritional values per 100ml come from the "NUTRIENTI (CE) su 100 ml" section. Extract: energy_kj (KJ/100ml value), energy_kcal (Kcal/100ml value), fats (Grassi g/100ml), saturated_fats (Grassi saturi g/100ml), trans_fats (Grassi trans g/100ml), carbohydrates (Carboidrati g/100ml), sugars (Zuccheri g/100ml), proteins (Proteine g/100ml), salt (Sale g/100ml), fibre (Fibre g/100ml). Extract ONLY the number, not the unit. Replace Italian comma decimals (13,79) with dots (13.79).
- ph: set to null — laboratory reports measure "Acidità totale in acido acetico" (total acidity) not pH
- total_acidity: extract the "Acidità totale in acido acetico" result value and unit (e.g. "4.22 g/l")
- alcoholic_strength: from "Titolo alcolometrico volumico" result (e.g. "28.40")
- allergen_sulphites: check "Anidride solforosa totale / Total Sulfur dioxide" — if result is "< LOQ" then false; if result is a numeric value above 0 then true
- supplier_name: the "Spett." addressee (the client who commissioned the test, i.e. Classy Cocktails)
- supplier_address: the address under the Spett. name
- laboratory_name: the laboratory that issued the report (e.g. "Unione Italiana Vini Servizi Soc. Coop.")
- laboratory_address: laboratory's operating address (Sede operativa)
- test_report_number: rapporto di prova number (e.g. "25VR35094")
- document_revision: include replacement note if present (e.g. "25VR35094 (replaces 25VR33761)")
- document_date: the report issue date
- batch_number: Lotto/Batch value
- label_date: Data etichetta/Label data value
- accreditation_number: the accreditation number (e.g. "00328")
- compliance_references: concatenate all "Reg CE" and "Reg UE" references found
- gmo_declaration, ionising_radiation, shelf_life, storage_conditions, odor, appearance, taste_profile: all null (not present in lab reports)
- brix: set to null`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, product_name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Extract all technical data from this product document for "${product_name || 'Unknown Product'}".

Document text:
${text}`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No structured data extracted" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(content);

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
