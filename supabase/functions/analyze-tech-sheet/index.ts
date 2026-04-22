import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a data extraction specialist for Italian food and beverage laboratory documents. Extract data and return ONLY a valid JSON object — no markdown, no explanation, no preamble. Use null for any field not found.

INPUT FORMAT: The document text preserves table structure using tab-separated columns.
Table rows appear as: Parameter\tMethod\tUnit\tResult\tLOQ\tUncertainty
Use the tab structure to correctly match each value to its column (Parameter, Unit, Result, etc.).

STEP 1 — IDENTIFY DOCUMENT TYPE:

- If text contains "Rapporto di prova" OR "Test report n°" OR "UNIONE ITALIANA VINI" OR "Titolo alcolometrico volumico" → document_type = "LABORATORY_TEST_REPORT"

- Otherwise → document_type = "SUPPLIER_TECH_SHEET"

STEP 2 — EXTRACT BASED ON TYPE:

════════════════════════════════════════

IF LABORATORY_TEST_REPORT:

════════════════════════════════════════

This document has THREE nutritional tables plus analytical results. You MUST use the correct table for each field.

TABLE A — "NUTRIENTI (CE) su 100 ml" (marked with asterisk *, unit g/100 ml or KJ/100ml or Kcal/100ml)
This is the EU legal table. Use THIS for: energy_kcal, energy_kj, fats, saturated_fats, carbohydrates, sugars, proteins, salt.

TABLE B — Anses per-100g section (unit g/100 g, appears BEFORE Table A)
Use for: trans_fats, fibre, cholesterol.

TABLE C — "NUTRIENTI PER PORZIONE USA" (unit g/serving, mg/serving, Cal/serving)
Extract ALL per-serving values into per_serving_usa object.

MINERAL ANALYSIS — contains metals in mg/l or μg/l. Extract ALL into minerals object.

CHEMICAL ANALYSIS — congeners, alcohols, aldehydes etc. Extract ALL into chemical_analysis object.

ANALYTICAL RESULTS — alcoholic strength, total sugars, density, acidity, SO2, glycerol. Extract into analytical_results object.

EXTRACTION RULES:

energy_kcal: TABLE A "Valore energetico (kcal)" → Kcal/100ml value only
energy_kj: TABLE A "Valore energetico (kJ)" → KJ/100ml value only
fats: TABLE A "Grassi/Fat" → g/100 ml value
saturated_fats: TABLE A "Grassi saturi/Saturated Fatty Acids" → g/100 ml
carbohydrates: TABLE A "Carboidrati/Carbohydrate" → g/100 ml
sugars: TABLE A "Zuccheri/Sugars" → g/100 ml
proteins: TABLE A "Proteine/Proteins" → g/100 ml
salt: TABLE A "Sale/Salt" → g/100 ml

trans_fats: TABLE B "Acidi grassi trans/Trans fatty acids" → g/100 g. If "< LOQ" → "0.00"
fibre: TABLE B "Fibre/Fibres" → g/100 g. If "< LOQ" → "0.00"

sodium_mg: MINERAL ANALYSIS "Sodio/Sodium" → mg/l value
alcoholic_strength: "Titolo alcolometrico volumico" → ml/100ml value
total_acidity: "Acidità totale" → value with unit e.g. "1.54 g/l"

allergen_sulphites: "Anidride solforosa totale" → if result > LOQ → true, else false

test_report_number: "Rapporto di prova n°" → code e.g. "25VR35093"
document_date: after "del / dated" → DD/MM/YYYY
document_revision: "[report_number] (replaces [old_number])" if old number found after "annulla e sostituisce il RDP n°"
batch_number: after "Lotto / Batch:"
label_date: after "Data etichetta / Label data:"
accreditation_number: 5-digit number near top, often "00328"

supplier_name: company name after "Spett."
supplier_address: address lines after supplier_name
laboratory_name: "UNIONE ITALIANA VINI SERVIZI" → "Unione Italiana Vini Servizi Soc. Coop."
laboratory_address: after "Sede operativa:"

sample_info: extract ALL sample metadata:
- matrix: "Matrice / Matrix:" value
- description: "Descrizione / Sample description:" value
- degree_on_label: "Grado dichiarato in etichetta / Degree on label:" value
- vintage: "Annata / Vintage:" value
- seal: "Suggello / Seal:" value
- sampling_by: "Campionamento a cura di / Sampling by:" value
- laboratory_manager: name of lab manager e.g. "Katia Guardini"

analytical_results: extract ALL wine/spirit analytical parameters:
- alcoholic_strength: "Titolo alcolometrico volumico" → value + unit
- total_sugars: "Zuccheri totali espressi in zucchero invertito" → value + unit
- relative_density: "Densità relativa a 20°C" → value
- total_acidity: "Acidità totale in acido acetico" → value + unit
- volatile_acidity: "Acidità volatile (in acido acetico)" → value + unit
- total_so2: "Anidride solforosa totale" → value + unit
- glycerol: "Glicerina (glicerolo)" → value + unit
- higher_alcohols: "Alcoli superiori totali" → value + unit
- total_aldehydes: "Aldeidi totali" → value + unit
- furfural: "Furfurolo/Furfuraldheyde" → value
- butanol_1: "1-butanolo" → value + unit
- propanol_1: "1-propanolo" → value + unit
- butanol_2: "2-butanolo" → value
- methyl_1_butanol_2: "2-metil-1-butanolo" → value + unit
- methyl_1_propanol_2: "2-metil-1-propanolo" → value + unit
- methyl_1_butanol_3: "3-metil-1-butanolo" → value + unit
- acetaldehyde: "Acetaldeide" → value + unit
- acetal: "Acetale" → value
- ethyl_acetate: "Acetato di etile" → value + unit
- ethyl_lactate: "Lattato di etile" → value + unit
- methanol: "Metanolo" → value + unit
- volatile_impurities: "Sostanze volatili" → value + unit
For each: include result as string, use "< LOQ" if below limit. Include unit.

minerals: extract ALL mineral/metal analysis:
- sodium: { value, unit, uncertainty, loq }
- calcium: { value, unit, uncertainty, loq }
- iron: { value, unit, uncertainty, loq }
- potassium: { value, unit, uncertainty, loq }
- cadmium: { value, unit, uncertainty, loq }
- chromium: { value, unit, uncertainty, loq }
- lead: { value, unit, uncertainty, loq }
- copper: { value, unit, uncertainty, loq }
- aluminium: { value, unit, uncertainty, loq }
- zinc: { value, unit, uncertainty, loq }
For value: use the mg/l or μg/l result. "< LOQ" if below limit.

per_serving_usa: extract ALL USA per-serving values:
- serving_size_ml: serving size in ml
- calories: Cal/serving value
- fats: g/serving
- saturated_fats: g/serving
- trans_fats: g/serving
- cholesterol: mg/serving
- sodium: mg/serving
- carbohydrates: g/serving
- fibre: g/serving
- sugars: g/serving
- added_sugars: g/serving
- proteins: g/serving
- vitamin_d: ug/serving
- calcium: mg/serving
- iron: mg/serving
- potassium: mg/serving

per_100g_anses: extract ALL Anses per-100g values:
- proteins: g/100g
- fats: g/100g
- saturated_fats: g/100g
- trans_fats: g/100g
- cholesterol: mg/100g
- fibre: g/100g
- vitamin_d: ug/100g

compliance_regulation_1: first "Reg CE/UE XXXX/XXXX" found
compliance_regulation_2: second distinct one
compliance_regulation_3: third distinct one
compliance_references: all unique regulation codes joined with "; "

Fields NOT in lab reports — always null:
ingredient_list_full_en, ingredient_list_full_it, ph, brix, odor, appearance, colour, taste_profile, shelf_life, storage_conditions, storage_after_opening, gmo_declaration, ionising_radiation, additional_information, recommended_dosage, application

All numbers: replace Italian comma with dot. "0,00" → "0.00"

════════════════════════════════════════

IF SUPPLIER_TECH_SHEET:

════════════════════════════════════════

Extract all the standard fields plus set these to null:
sample_info: null, analytical_results: null, minerals: null, per_serving_usa: null, per_100g_anses: null

ingredient_list_full_en: complete legal ingredient declaration in English
ingredient_list_full_it: same in Italian if present
ph, brix, energy_kcal, energy_kj, fats, saturated_fats, trans_fats, carbohydrates, sugars, fibre, proteins, salt, sodium_mg
odor, appearance, colour, taste_profile
All allergens (allergen_gluten through allergen_molluscs): true/false from allergen matrix
gmo_declaration, ionising_radiation, shelf_life, storage_conditions, storage_after_opening
compliance_references, supplier_name/address/vat/phone/email
recommended_dosage, application, document_revision, document_date
laboratory_name: null, laboratory_address: null, test_report_number: null, accreditation_number: null, batch_number: null, label_date: null, alcoholic_strength: null, total_acidity: null, allergen_sulphites: from allergen matrix

════════════════════════════════════════

JSON RESPONSE SCHEMA (always return ALL fields):

{
  "document_type": "",
  "document_date": null,
  "document_revision": null,
  "batch_number": null,
  "label_date": null,
  "product_name": null,
  "product_version": null,
  "application": null,
  "recommended_dosage": null,
  "ingredient_list_full_en": null,
  "ingredient_list_full_it": null,
  "main_flavour_components": null,
  "energy_kj": null,
  "energy_kcal": null,
  "fats": null,
  "saturated_fats": null,
  "trans_fats": null,
  "carbohydrates": null,
  "sugars": null,
  "fibre": null,
  "proteins": null,
  "salt": null,
  "ph": null,
  "brix": null,
  "total_acidity": null,
  "alcoholic_strength": null,
  "sodium_mg": null,
  "microbiological_count": null,
  "odor": null,
  "appearance": null,
  "colour": null,
  "taste_profile": null,
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
  "gmo_declaration": null,
  "ionising_radiation": null,
  "additional_information": null,
  "shelf_life": null,
  "storage_conditions": null,
  "storage_after_opening": null,
  "compliance_regulation_1": null,
  "compliance_regulation_2": null,
  "compliance_regulation_3": null,
  "compliance_references": null,
  "supplier_name": null,
  "supplier_address": null,
  "supplier_vat": null,
  "supplier_phone": null,
  "supplier_email": null,
  "laboratory_name": null,
  "laboratory_address": null,
  "test_report_number": null,
  "accreditation_number": null,
  "sample_info": null,
  "analytical_results": null,
  "minerals": null,
  "per_serving_usa": null,
  "per_100g_anses": null
}

VERIFICATION — after generating the JSON, check:
- If LABORATORY_TEST_REPORT: energy_kcal, energy_kj, carbohydrates, sugars, alcoholic_strength should all be non-null.
- trans_fats and fibre must come from the Anses g/100g table, not per-serving.
- sodium_mg must come from the mg/l mineral analysis, not per-serving.
- sample_info, analytical_results, minerals, per_serving_usa, per_100g_anses must be objects (not null) for lab reports.
- All comma decimals must be dots in output.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, extracted_text, product_name, filename, product_id } = await req.json();
    const sourceText = extracted_text ?? text ?? "";
    if (!sourceText) throw new Error("No extracted text provided");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Extract ALL technical data from this product document for "${product_name || 'Unknown Product'}".
Document context: filename=${filename || 'unknown'}, product_id=${product_id || 'unknown'}.

IMPORTANT: Extract EVERY single data point from the document. Do not skip any analytical results, minerals, per-serving values, or sample metadata. If a value shows "< LOQ", include it as "< LOQ".

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
        max_tokens: 8000,
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

    // --- Post-processing & fallback logic ---
    const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
    const normalizeNumber = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      if (!s || /<\s*LOQ/i.test(s)) return null;
      return s.replace(/,/g, ".");
    };
    const normalizeReportCode = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const compact = String(v).toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!compact) return null;
      const vr = compact.match(/\d{2}VR\d{4,}/);
      if (vr?.[0]) return vr[0];
      const generic = compact.match(/[A-Z0-9]{6,}/);
      return generic?.[0] ?? compact;
    };
    const preferLonger = (current: unknown, candidate: string | null) => {
      if (!candidate) return isEmpty(current) ? null : String(current);
      if (isEmpty(current)) return candidate;
      return String(candidate).length > String(current).length ? candidate : String(current);
    };

    if (extracted?.document_type === "LABORATORY_TEST_REPORT") {
      // Force null for fields not in lab reports
      extracted.supplier_vat = null;
      extracted.supplier_phone = null;
      extracted.supplier_email = null;

      // Lab name fallbacks
      const hasUivMarkers = /(UNIONE\s+ITALIANA\s+VINI|lab\.verona@uiv\.it)/i.test(sourceText);
      if (hasUivMarkers) {
        extracted.laboratory_name = preferLonger(extracted.laboratory_name, "Unione Italiana Vini Servizi Soc. Coop.");
      }

      const sedeMatch = sourceText.match(/Sede\s+operativa\s*:\s*([^\n\r]+)/i);
      if (sedeMatch?.[1]) {
        const canonicalAddress = sedeMatch[1].split("T.")[0].replace(/\s+/g, " ").trim();
        extracted.laboratory_address = preferLonger(extracted.laboratory_address, canonicalAddress);
      }

      if (/\d{2}VR/i.test(sourceText) && isEmpty(extracted.laboratory_name)) {
        extracted.laboratory_name = "Unione Italiana Vini Servizi Soc. Coop.";
      }
      if (/\d{2}VR/i.test(sourceText) && isEmpty(extracted.laboratory_address)) {
        extracted.laboratory_address = "Viale del lavoro, 8 - 37135 Verona";
      }

      // Energy fallbacks
      if (isEmpty(extracted.energy_kj)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kJ\)[\s\S]{0,120}?KJ\s*\/\s*100\s*ml[\s\S]{0,40}?([0-9]+(?:[.,][0-9]+)?)/i) ||
          sourceText.match(/Valore\s+energetico\s*\(kJ\)[\s\S]{0,120}?([0-9]{2,4}(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kj = m[1].replace(/,/g, ".");
      }
      if (isEmpty(extracted.energy_kcal)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kcal\)[\s\S]{0,120}?Kcal\s*\/\s*100\s*ml[\s\S]{0,40}?([0-9]+(?:[.,][0-9]+)?)/i) ||
          sourceText.match(/Valore\s+energetico\s*\(kcal\)[\s\S]{0,120}?([0-9]{2,4}(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kcal = m[1].replace(/,/g, ".");
      }

      // Sodium fallback — mineral analysis mg/l only
      if (isEmpty(extracted.sodium_mg)) {
        const m = sourceText.match(/Sodio[\s\S]{0,40}?mg\s*\/\s*l\s*[\t]?\s*([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        extracted.sodium_mg = normalizeNumber(m?.[1] ?? null);
      }

      // Trans fats fallback — Anses g/100g section
      if (isEmpty(extracted.trans_fats)) {
        const m = sourceText.match(/(?:Acidi\s+grassi\s+trans|Trans\s+fatty\s+acids|Grassi\s+trans)[\s\S]{0,160}?g\s*\/\s*100\s*g[\s\S]{0,40}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        const normalized = normalizeNumber(m?.[1] ?? null);
        extracted.trans_fats = normalized ?? "0.00";
      }

      // Fibre fallback
      if (isEmpty(extracted.fibre)) {
        const m = sourceText.match(/Fibre[\s\S]{0,160}?g\s*\/\s*100\s*g[\s\S]{0,40}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        if (m?.[1]) {
          extracted.fibre = /<\s*LOQ/i.test(m[1]) ? "0.00" : m[1].replace(/,/g, ".");
        }
      }

      // Supplier block fallback
      const supplierBlock = sourceText.match(/Spett\.\s*[\r\n]+\s*([^\n\r]+)\s*[\r\n]+\s*([^\n\r]+)(?:\s*[\r\n]+\s*([^\n\r]+))?/i);
      if (supplierBlock) {
        const supplierName = supplierBlock[1]?.replace(/\s+/g, " ").trim() || null;
        const supplierAddress = [supplierBlock[2], supplierBlock[3]]
          .filter(Boolean).map((part) => String(part).replace(/\s+/g, " ").trim()).filter(Boolean).join(", ");
        extracted.supplier_name = preferLonger(extracted.supplier_name, supplierName);
        extracted.supplier_address = preferLonger(extracted.supplier_address, supplierAddress || null);
      }

      // Sulphites detection
      const sulfurMatch = sourceText.match(/Anidride\s+solforosa\s+totale[\s\S]{0,220}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)[\s\S]{0,160}?(?:LOQ[^0-9]*([0-9]+(?:[.,][0-9]+)?))?/i);
      if (sulfurMatch?.[1]) {
        if (/<\s*LOQ/i.test(sulfurMatch[1])) {
          extracted.allergen_sulphites = false;
        } else {
          const val = Number(sulfurMatch[1].replace(/,/g, "."));
          const loq = sulfurMatch[2] ? Number(sulfurMatch[2].replace(/,/g, ".")) : 10;
          extracted.allergen_sulphites = Number.isFinite(val) && Number.isFinite(loq) ? val > loq : !!extracted.allergen_sulphites;
        }
      }

      // Document revision fallback
      const reportMatch = sourceText.match(/(?:Rapporto\s+di\s+prova|Test\s+report)\s*n°?\s*[:\-/]?\s*([A-Z0-9\s-]{6,24})/i);
      const oldReportMatch = sourceText.match(/annulla\s+e\s+sostituisce\s+il\s+RDP\s*n°?\s*([A-Z0-9\s-]{6,24})/i) ||
        sourceText.match(/replaces?\s*(?:test\s+report\s*n°?\s*)?([A-Z0-9\s-]{6,24})/i);
      const reportNumber = normalizeReportCode(extracted.test_report_number) ?? normalizeReportCode(reportMatch?.[1]);
      const oldReportNumber = normalizeReportCode(oldReportMatch?.[1]);

      if (reportNumber) extracted.test_report_number = reportNumber;
      if (reportNumber && oldReportNumber) {
        extracted.document_revision = `${reportNumber} (replaces ${oldReportNumber})`;
      }

      // Compliance references fallback
      const regulations = Array.from(
        new Set(
          (sourceText.match(/\bReg\.?\s*(?:CE|UE)\s*\d+\/\d{4}\b/gi) ?? [])
            .map((r: string) => r.replace(/\./g, "").replace(/\s+/g, " ").trim().replace(/^reg/i, "Reg")),
        ),
      ) as string[];
      if (regulations.length) {
        extracted.compliance_regulation_1 = preferLonger(extracted.compliance_regulation_1 as string | null, regulations[0] ?? null);
        extracted.compliance_regulation_2 = preferLonger(extracted.compliance_regulation_2 as string | null, regulations[1] ?? null);
        extracted.compliance_regulation_3 = preferLonger(extracted.compliance_regulation_3 as string | null, regulations[2] ?? null);
        extracted.compliance_references = preferLonger(extracted.compliance_references as string | null, regulations.join("; "));
      }

      // Normalize all numeric fields
      ["energy_kj", "energy_kcal", "fats", "saturated_fats", "trans_fats", "carbohydrates",
        "sugars", "fibre", "proteins", "salt", "sodium_mg", "alcoholic_strength",
      ].forEach((k) => {
        if (!isEmpty(extracted[k])) extracted[k] = String(extracted[k]).replace(/,/g, ".");
      });

      if (isEmpty(extracted.ph)) extracted.ph = null;
      if (isEmpty(extracted.brix)) extracted.brix = null;

      // Ensure nested objects exist for lab reports
      if (!extracted.sample_info) extracted.sample_info = {};
      if (!extracted.analytical_results) extracted.analytical_results = {};
      if (!extracted.minerals) extracted.minerals = {};
      if (!extracted.per_serving_usa) extracted.per_serving_usa = {};
      if (!extracted.per_100g_anses) extracted.per_100g_anses = {};
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
