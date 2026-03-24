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
NUTRITIONAL VALUES PER 100ML (EU Reg 1169/2011):
- Extract from the "NUTRIENTI (CE) su 100 ml" section marked with "Calcolo - Reg. CE 1169/2011"
- energy_kj: "Valore energetico (kJ)" result, KJ/100ml unit → number only (e.g. "673")
- energy_kcal: "Valore energetico (kcal)" result, Kcal/100ml unit → number only (e.g. "161")
- fats: "Grassi / Fat" g/100ml result
- saturated_fats: "Grassi saturi / Saturated Fatty Acids" g/100ml result
- carbohydrates: "Carboidrati / Carbohydrate" g/100ml result
- sugars: "Zuccheri / Sugars" g/100ml result
- proteins: "Proteine / Proteins" g/100ml result
- salt: "Sale / Salt" g/100ml result

TRANS FATS (check multiple sections):
- Look for "Acidi grassi trans / Trans fatty acids" in the Anses per-100g section and extract value as trans_fats
- If missing, also check "NUTRIENTI PER PORZIONE USA" for "Grassi trans"

FIBRE (check multiple sections):
- Look for "Fibre / Fibres" in the Anses per-100g section and extract value as fibre
- If value is "< LOQ", return "0.00"

SODIUM:
- sodium_mg must come from mineral analysis row "Sodio / Sodium" with mg/l unit (not serving-size sodium)
- If sodium result is "< LOQ", return null

ALCOHOLIC STRENGTH:
- "Titolo alcolometrico volumico / Alcoholic strength by volume" result in ml/100ml (e.g. "21,50" → "21.50")

TOTAL ACIDITY:
- "Acidità totale in acido acetico / Total acidity as acetic acid" result in g/l (e.g. "1,54" → "1.54 g/l")

SULPHITES ALLERGEN:
- Find "Anidride solforosa totale / Total Sulfur dioxide"
- If "< LOQ" → allergen_sulphites = false
- If numeric value, compare against LOQ value if shown; if no LOQ shown use default LOQ = 10 mg/l
- Set allergen_sulphites = true only when numeric result > LOQ

DOCUMENT METADATA:
- test_report_number: number after "Rapporto di prova n°" or "Test report n°" (e.g. "25VR35093")
- document_date: date after "del / dated"
- document_revision: "[report_number] (replaces [old_number])" using old number from "annulla e sostituisce il RDP n°" or "replaces"
- batch_number: after "Lotto / Batch:"
- label_date: after "Data etichetta / Label data:"
- accreditation_number: accreditation number near lab logo, often "00328"

LABORATORY FOOTER EXTRACTION:
- Issuing lab details are in the page footer. Scan full text for "UNIONE ITALIANA VINI", "lab.verona@ulv.it", or "ulv.it"
- laboratory_name: if text contains "UNIONE ITALIANA VINI SERVIZI", set "Unione Italiana Vini Servizi Soc. Coop."
- laboratory_address: extract text following "Sede operativa:" (e.g. "Viale del lavoro, 8 - 37135 Verona")
- If lab report structure matches and lab name is missing, infer from top letterhead/footer context
- If document_type is LABORATORY_TEST_REPORT and text contains "25VR" and laboratory_name is still missing, set:
  laboratory_name = "Unione Italiana Vini Servizi Soc. Coop."
  laboratory_address = "Viale del lavoro, 8 - 37135 Verona"

SUPPLIER DETAILS:
- Supplier/client appears after "Spett." on first page
- supplier_name: company name after "Spett."
- supplier_address: address lines after supplier_name
- supplier_vat, supplier_phone, supplier_email: return null for this document type

COMPLIANCE:
- compliance_regulation_1/2/3: first three distinct "Reg CE" or "Reg UE" references
- compliance_references: all unique regulation references concatenated with "; "

NORMALIZATION:
- Replace Italian comma decimals with dots in all extracted numeric values
- Fields typically not present in this document type should be null: odor, appearance, taste_profile, colour, ph, brix, shelf_life, storage_conditions, storage_after_opening, gmo_declaration, ionising_radiation, ingredient_list_full_en, ingredient_list_full_it`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, extracted_text, product_name, filename, product_id } = await req.json();
    const sourceText = extracted_text ?? text ?? "";
    if (!sourceText) throw new Error("No extracted text provided");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Extract all technical data from this product document for "${product_name || 'Unknown Product'}".
Document context: filename=${filename || 'unknown'}, product_id=${product_id || 'unknown'}.

Document text:
${sourceText}`;

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

    const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
    const normalizeNumber = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      if (!s || /<\s*LOQ/i.test(s)) return null;
      return s.replace(/,/g, ".");
    };

    if (extracted?.document_type === "LABORATORY_TEST_REPORT") {
      const textUpper = sourceText.toUpperCase();

      // Supplier VAT/phone/email are not expected in these lab reports.
      extracted.supplier_vat = null;
      extracted.supplier_phone = null;
      extracted.supplier_email = null;

      const hasUivMarkers = /(UNIONE\s+ITALIANA\s+VINI|LAB\.VERONA@ULV\.IT|ULV\.IT)/i.test(sourceText);
      if (hasUivMarkers && isEmpty(extracted.laboratory_name)) {
        extracted.laboratory_name = "Unione Italiana Vini Servizi Soc. Coop.";
      }

      if (isEmpty(extracted.laboratory_address)) {
        const sedeOperativaMatch = sourceText.match(/Sede\s+operativa\s*:\s*([^\n]+)/i);
        if (sedeOperativaMatch?.[1]) {
          extracted.laboratory_address = sedeOperativaMatch[1]
            .split("T.")[0]
            .replace(/\s+/g, " ")
            .trim();
        }
      }

      if (/25VR/i.test(sourceText) && isEmpty(extracted.laboratory_name)) {
        extracted.laboratory_name = "Unione Italiana Vini Servizi Soc. Coop.";
      }
      if (/25VR/i.test(sourceText) && isEmpty(extracted.laboratory_address)) {
        extracted.laboratory_address = "Viale del lavoro, 8 - 37135 Verona";
      }

      if (isEmpty(extracted.energy_kj)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kJ\)[\s\S]{0,80}?([0-9]+(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kj = m[1].replace(/,/g, ".");
      }
      if (isEmpty(extracted.energy_kcal)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kcal\)[\s\S]{0,80}?([0-9]+(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kcal = m[1].replace(/,/g, ".");
      }

      if (isEmpty(extracted.sodium_mg)) {
        const m = sourceText.match(/Sodio\s*\/\s*Sodium[\s\S]{0,180}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)[\s\S]{0,60}?mg\s*\/\s*l/i);
        extracted.sodium_mg = normalizeNumber(m?.[1] ?? null);
      }

      if (isEmpty(extracted.trans_fats)) {
        const m = sourceText.match(/(?:Acidi\s+grassi\s+trans|Trans\s+fatty\s+acids|Grassi\s+trans)[\s\S]{0,120}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        const normalized = normalizeNumber(m?.[1] ?? null);
        if (normalized) extracted.trans_fats = normalized;
      }

      if (isEmpty(extracted.fibre)) {
        const m = sourceText.match(/Fibre\s*\/\s*Fibres[\s\S]{0,120}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        if (m?.[1]) {
          extracted.fibre = /<\s*LOQ/i.test(m[1]) ? "0.00" : m[1].replace(/,/g, ".");
        }
      }

      const sulfurMatch = sourceText.match(/Anidride\s+solforosa\s+totale[\s\S]{0,220}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)[\s\S]{0,160}?(?:LOQ[^0-9]*([0-9]+(?:[.,][0-9]+)?))?/i);
      if (sulfurMatch?.[1]) {
        if (/<\s*LOQ/i.test(sulfurMatch[1])) {
          extracted.allergen_sulphites = false;
        } else {
          const result = Number(sulfurMatch[1].replace(/,/g, "."));
          const loq = sulfurMatch[2] ? Number(sulfurMatch[2].replace(/,/g, ".")) : 10;
          extracted.allergen_sulphites = Number.isFinite(result) && Number.isFinite(loq) ? result > loq : !!extracted.allergen_sulphites;
        }
      }

      const reportMatch = sourceText.match(/(?:Rapporto\s+di\s+prova|Test\s+report)\s*n°?\s*([A-Z0-9]+)/i);
      const oldReportMatch =
        sourceText.match(/annulla\s+e\s+sostituisce\s+il\s+RDP\s*n°?\s*([A-Z0-9]+)/i) ||
        sourceText.match(/replaces?\s*([A-Z0-9]+)/i);
      const reportNumber = extracted.test_report_number || reportMatch?.[1];
      if (reportNumber && oldReportMatch?.[1]) {
        extracted.document_revision = `${reportNumber} (replaces ${oldReportMatch[1]})`;
      }

      // Normalize common numeric fields
      [
        "energy_kj", "energy_kcal", "fats", "saturated_fats", "trans_fats", "carbohydrates",
        "sugars", "fibre", "proteins", "salt", "sodium_mg", "alcoholic_strength",
      ].forEach((k) => {
        if (!isEmpty(extracted[k])) extracted[k] = String(extracted[k]).replace(/,/g, ".");
      });

      if (isEmpty(extracted.ph)) extracted.ph = null;
      if (isEmpty(extracted.brix)) extracted.brix = null;
    }

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
