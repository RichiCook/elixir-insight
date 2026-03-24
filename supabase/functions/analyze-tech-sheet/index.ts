import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a data extraction specialist for Italian food and beverage laboratory documents. Extract data and return ONLY a valid JSON object — no markdown, no explanation, no preamble. Use null for any field not found.

STEP 1 — IDENTIFY DOCUMENT TYPE:

- If text contains "Rapporto di prova" OR "Test report n°" OR "UNIONE ITALIANA VINI" OR "Titolo alcolometrico volumico" → document_type = "LABORATORY_TEST_REPORT"

- Otherwise → document_type = "SUPPLIER_TECH_SHEET"

STEP 2 — EXTRACT BASED ON TYPE:

════════════════════════════════════════

IF LABORATORY_TEST_REPORT:

════════════════════════════════════════

This document has THREE nutritional tables. You MUST use the correct one for each field:

TABLE A — "NUTRIENTI (CE) su 100 ml" (marked with asterisk *, unit g/100 ml or KJ/100ml or Kcal/100ml)

This is the EU legal table. Use THIS table for all nutritional fields below.

TABLE B — Anses per-100g section (unit g/100 g, no asterisk, appears BEFORE Table A)

Use ONLY for trans_fats and fibre — these are NOT in Table A.

TABLE C — "NUTRIENTI PER PORZIONE USA" (unit g/serving size or mg/serving size)

IGNORE this table completely for all fields.

MINERAL ANALYSIS section — appears before Table A, contains Sodio/Sodium in mg/l

Use THIS section for sodium_mg only.

EXTRACTION RULES — LABORATORY_TEST_REPORT:

energy_kcal: from TABLE A — "Valore energetico (kcal)" result, unit Kcal/100ml → extract number only. Example: "Kcal/100ml 161" → "161"

energy_kj: from TABLE A — "Valore energetico (kJ)" result, unit KJ/100ml → extract number only. Example: "KJ/100ml 673" → "673"

fats: from TABLE A — "Grassi / Fat" result, unit g/100 ml → extract number only. Example: "g/100 ml 0,00" → "0.00"

saturated_fats: from TABLE A — "Grassi saturi / Saturated Fatty Acids" result, unit g/100 ml → number only

carbohydrates: from TABLE A — "Carboidrati / Carbohydrate" result, unit g/100 ml → number only. Example: "g/100 ml 10,89" → "10.89"

sugars: from TABLE A — "Zuccheri / Sugars" result, unit g/100 ml → number only

proteins: from TABLE A — "Proteine / Proteins" result, unit g/100 ml → number only

salt: from TABLE A — "Sale / Salt" result, unit g/100 ml → number only. Example: "g/100 ml 0,007" → "0.007"

trans_fats: from TABLE B (Anses section) — "Acidi grassi trans / Trans fatty acids" result, unit g/100 g → number only. Example: "g/100 g 0,00" → "0.00". If "< LOQ" → "0.00"

fibre: from TABLE B (Anses section) — "Fibre / Fibres" result, unit g/100 g → number only. Example: "g/100 g 0,00" → "0.00". If "< LOQ" → "0.00"

sodium_mg: from MINERAL ANALYSIS section — "Sodio / Sodium" result, unit mg/l → number only. Example: "mg/l 26,3" → "26.3". If "< LOQ" → null

alcoholic_strength: "Titolo alcolometrico volumico / Alcoholic strength by volume" result, unit ml/100ml → number only. Example: "ml/100ml 21,50" → "21.50". Replace comma with dot.

total_acidity: "Acidità totale in acido acetico / Total acidity as acetic acid" result with unit. Example: result "1,54" unit "g/l" → "1.54 g/l"

allergen_sulphites: Find "Anidride solforosa totale / Total Sulfur dioxide". If result is "< LOQ" → false. If result is a number: check if that number is greater than the LOQ value shown in the same row. If number > LOQ → true. If number ≤ LOQ → false. Default LOQ = 10 mg/l if not shown. Example: result=20, LOQ=10 → true. Result="< LOQ" → false.

test_report_number: number after "Rapporto di prova n° /" or "Test report n°:" — extract only the code like "25VR35093"

document_date: date after "del / dated" — format DD/MM/YYYY. Example: "03/11/2025"

document_revision: build as "[test_report_number] (replaces [old_number])". Find old number after "annulla e sostituisce il RDP n°" (Italian) or "replaces" (English). Example: report=25VR35093, old=25VR33760 → "25VR35093 (replaces 25VR33760)"

batch_number: after "Lotto / Batch:" — Example: "L. 279 25"

label_date: after "Data etichetta / Label data:" — Example: "01/10/2025"

accreditation_number: 5-digit number near top of document, often "00328"

supplier_name: bold company name immediately after "Spett." — Example: "CLASSY COCKTAILS S.R.L."

supplier_address: address lines immediately after supplier_name — Example: "Via Sciascia 28, 41043 FORMIGINE (MO)"

supplier_vat: null — not present in this document type

supplier_phone: null — not present in this document type

supplier_email: null — not present in this document type

laboratory_name: scan full text for "UNIONE ITALIANA VINI SERVIZI" — if found → "Unione Italiana Vini Servizi Soc. Coop.". Also check footer area for lab name.

laboratory_address: scan for "Sede operativa:" followed by address → extract it. Example: "Viale del lavoro, 8 - 37135 Verona"

FALLBACK: if laboratory_name is still null AND test_report_number starts with "25VR" or any "VR" format → set laboratory_name = "Unione Italiana Vini Servizi Soc. Coop." and laboratory_address = "Viale del lavoro, 8 - 37135 Verona"

compliance_regulation_1: first distinct "Reg CE XXXX/XXXX" found in document

compliance_regulation_2: second distinct "Reg CE" or "Reg UE" found

compliance_regulation_3: third distinct one

compliance_references: all unique regulation codes joined with "; "

Fields NOT in lab reports — always null:

ingredient_list_full_en, ingredient_list_full_it, ph, brix, odor, appearance, colour, taste_profile, shelf_life, storage_conditions, storage_after_opening, gmo_declaration, ionising_radiation, additional_information, recommended_dosage, application, allergen_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_peanuts, allergen_soybeans, allergen_milk, allergen_nuts, allergen_celery, allergen_mustard, allergen_sesame, allergen_lupin, allergen_molluscs

All numbers: replace Italian comma decimal separator with dot. "0,00" → "0.00", "10,89" → "10.89", "26,3" → "26.3"

════════════════════════════════════════

IF SUPPLIER_TECH_SHEET:

════════════════════════════════════════

ingredient_list_full_en: complete legal ingredient declaration in English — preserve all sub-ingredients, organic asterisks, additive codes, percentages

ingredient_list_full_it: same in Italian if present in document

ph: single decimal number between 0-14 ONLY. Never include units or descriptions. Example: "3.9" ✓, "3.9 (acidity)" ✗

brix: single decimal number. Example: "8.8"

energy_kcal: number only, no units. Example: "35"

energy_kj: number only. Example: "147"

fats: number only with < if applicable. Example: "<0.1"

saturated_fats: number only

trans_fats: number only

carbohydrates: number only

sugars: number only

fibre: number only

proteins: number only

salt: number only

sodium_mg: number only if present

odor: text description. Example: "Warm, herbal and fruity"

appearance: text description. Example: "Magenta liquid"

colour: text description

taste_profile: text description

allergen_gluten through allergen_molluscs: extract from allergen matrix table. true if document says "Yes" or "Sì" or marks as present. false if "No" or absent.

gmo_declaration: full text of GMO statement

ionising_radiation: full text of radiation statement

shelf_life: Example: "12 months from production batch date"

storage_conditions: Example: "Below 20°C, protected from sunlight"

storage_after_opening: Example: "Close tightly after opening and store at 4°C"

compliance_references: all EU regulation references concatenated

supplier_name: from supplier letterhead

supplier_address: supplier address

supplier_vat: VAT/P.IVA number

supplier_phone: phone number

supplier_email: email address

recommended_dosage: Example: "100 ml per serving"

application: Example: "Cocktail RTD/RTU"

document_revision: revision number. Example: "001"

document_date: document date

laboratory_name: null (not in tech sheets)

laboratory_address: null

test_report_number: null

accreditation_number: null

batch_number: null

label_date: null

alcoholic_strength: null

total_acidity: null

allergen_sulphites: extract from allergen matrix

════════════════════════════════════════

JSON RESPONSE SCHEMA (always return all fields):

════════════════════════════════════════

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
  "accreditation_number": null
}

VERIFICATION — after generating the JSON, check:

- If document_type is LABORATORY_TEST_REPORT: energy_kcal, energy_kj, carbohydrates, sugars, alcoholic_strength should all be non-null numbers. If any are null, re-read the NUTRIENTI CE su 100 ml section and try again.

- trans_fats and fibre must come from the Anses g/100g table, not the serving size table.

- sodium_mg must come from the mg/l mineral analysis, not the serving size mg/serving table.

- All comma decimals must be dots in the output.`;

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

    // --- Post-processing & fallback logic ---
    const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
    const normalizeNumber = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      if (!s || /<\s*LOQ/i.test(s)) return null;
      return s.replace(/,/g, ".");
    };

    if (extracted?.document_type === "LABORATORY_TEST_REPORT") {
      // Force null for fields not in lab reports
      extracted.supplier_vat = null;
      extracted.supplier_phone = null;
      extracted.supplier_email = null;

      // Lab name fallbacks
      const hasUivMarkers = /(UNIONE\s+ITALIANA\s+VINI|LAB\.VERONA@ULV\.IT|ULV\.IT)/i.test(sourceText);
      if (hasUivMarkers && isEmpty(extracted.laboratory_name)) {
        extracted.laboratory_name = "Unione Italiana Vini Servizi Soc. Coop.";
      }

      if (isEmpty(extracted.laboratory_address)) {
        const sedeMatch = sourceText.match(/Sede\s+operativa\s*:\s*([^\n]+)/i);
        if (sedeMatch?.[1]) {
          extracted.laboratory_address = sedeMatch[1].split("T.")[0].replace(/\s+/g, " ").trim();
        }
      }

      // VR report number fallback
      if (/\d{2}VR/i.test(sourceText) && isEmpty(extracted.laboratory_name)) {
        extracted.laboratory_name = "Unione Italiana Vini Servizi Soc. Coop.";
      }
      if (/\d{2}VR/i.test(sourceText) && isEmpty(extracted.laboratory_address)) {
        extracted.laboratory_address = "Viale del lavoro, 8 - 37135 Verona";
      }

      // Energy fallbacks
      if (isEmpty(extracted.energy_kj)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kJ\)[\s\S]{0,80}?([0-9]+(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kj = m[1].replace(/,/g, ".");
      }
      if (isEmpty(extracted.energy_kcal)) {
        const m = sourceText.match(/Valore\s+energetico\s*\(kcal\)[\s\S]{0,80}?([0-9]+(?:[.,][0-9]+)?)/i);
        if (m?.[1]) extracted.energy_kcal = m[1].replace(/,/g, ".");
      }

      // Sodium fallback — mineral analysis mg/l only
      if (isEmpty(extracted.sodium_mg)) {
        const m = sourceText.match(/Sodio\s*\/\s*Sodium[\s\S]{0,180}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)[\s\S]{0,60}?mg\s*\/\s*l/i);
        extracted.sodium_mg = normalizeNumber(m?.[1] ?? null);
      }

      // Trans fats fallback — Anses g/100g section
      if (isEmpty(extracted.trans_fats)) {
        const m = sourceText.match(/(?:Acidi\s+grassi\s+trans|Trans\s+fatty\s+acids|Grassi\s+trans)[\s\S]{0,120}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        const normalized = normalizeNumber(m?.[1] ?? null);
        extracted.trans_fats = normalized ?? "0.00";
      }

      // Fibre fallback — Anses g/100g section
      if (isEmpty(extracted.fibre)) {
        const m = sourceText.match(/Fibre\s*\/\s*Fibres[\s\S]{0,120}?([0-9]+(?:[.,][0-9]+)?|<\s*LOQ)/i);
        if (m?.[1]) {
          extracted.fibre = /<\s*LOQ/i.test(m[1]) ? "0.00" : m[1].replace(/,/g, ".");
        }
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
      const reportMatch = sourceText.match(/(?:Rapporto\s+di\s+prova|Test\s+report)\s*n°?\s*([A-Z0-9]+)/i);
      const oldReportMatch =
        sourceText.match(/annulla\s+e\s+sostituisce\s+il\s+RDP\s*n°?\s*([A-Z0-9]+)/i) ||
        sourceText.match(/replaces?\s*([A-Z0-9]+)/i);
      const reportNumber = extracted.test_report_number || reportMatch?.[1];
      if (reportNumber && oldReportMatch?.[1]) {
        extracted.document_revision = `${reportNumber} (replaces ${oldReportMatch[1]})`;
      }

      // Normalize all numeric fields
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
