import * as XLSX from 'xlsx';

const SHEET_SLUG_MAP: Record<string, string> = {
  'NEGRONI': 'negroni',
  'PORNSTAR MARTINI': 'pornstar-martini',
  'COSMOPOLITAN': 'cosmopolitan',
  'ESPRESSO MARTINI': 'espresso-martini',
  'DAIQUIRI': 'daiquiri',
  'MARGARITA': 'margarita',
  'PAPER PLANE': 'paper-plane',
  'PENICILLIN': 'penicillin',
  'SPICY PALOMA': 'spicy-paloma',
  'SPRITZ': 'spritz',
  'GIN TØNIC': 'gin-tonic',
  'NO REGRETS NEGRONI': 'no-regrets-negroni',
  'NO REGRETS MOMENTS': 'no-regrets-moment',
  'NO REGRETS AMARO': 'no-regrets-amaro',
};

const MARKET_LANG_MAP: Record<string, string> = {
  'INT': 'EN',
  'INTERNATIONAL': 'EN',
  'ITALY': 'IT',
  'GERMANY': 'DE',
  'FRANCE': 'FR',
};

const MARKET_CODE_MAP: Record<string, string> = {
  'INT': 'INT',
  'INTERNATIONAL': 'INT',
  'ITALY': 'IT',
  'GERMANY': 'DE',
  'FRANCE': 'FR',
};

function parseNutritional(raw: any): Record<string, string> | null {
  if (!raw) return null;
  const s = String(raw);
  if (s.includes('________')) return null;

  const clean = (v: string | undefined) => v?.replace(',', '.') ?? null;
  const match = (pattern: RegExp) => {
    const m = s.match(pattern);
    return m ? clean(m[1]) : null;
  };

  const result: Record<string, string> = {};
  const energy_kcal = match(/Energy \(kcal\)\s*([0-9.,]+)/i);
  const fats = match(/Total fats \(g\)\s*([0-9.,<]+)/i);
  const saturated_fats = match(/saturated fats \(g\)\s*([0-9.,<]+)/i);
  const carbohydrates = match(/Carbohydrates \(g\)\s*([0-9.,]+)/i);
  const sugars = match(/sugars \(g\)\s*([0-9.,]+)/i);
  const proteins = match(/Protein[s]? \(g\)\s*([0-9.,<]+)/i);
  const salt = match(/Salt \(g\)\s*([0-9.,]+)/i);

  if (energy_kcal) result.energy_kcal = energy_kcal;
  if (fats) result.fats = fats;
  if (saturated_fats) result.saturated_fats = saturated_fats;
  if (carbohydrates) result.carbohydrates = carbohydrates;
  if (sugars) result.sugars = sugars;
  if (proteins) result.proteins = proteins;
  if (salt) result.salt = salt;

  return Object.keys(result).length > 0 ? result : null;
}

export interface ParsedProduct {
  sheetName: string;
  slug: string;
  productFields: Record<string, string | null>;
  translations: Record<string, Record<string, string | null>>;
  eanCodes: Record<string, { ean_cocktail?: string; ean_carton?: string }>;
  nutriFields: Record<string, string> | null;
  hasNutrition: boolean;
  allergenSulphites: boolean;
  warnings: string[];
}

function cleanValue(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'N/A' || s === 'nan' || s === 'NaN') return null;
  return s;
}

function parseAbv(raw: string | null): string | null {
  if (!raw) return null;
  const m = String(raw).match(/([0-9]+[.,][0-9]+|[0-9]+)/);
  if (!m) return null;
  return m[1].replace(',', '.');
}

function parseSheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedProduct | null {
  const slug = SHEET_SLUG_MAP[sheetName.toUpperCase().trim()];
  if (!slug) return null;

  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });

  const product: ParsedProduct = {
    sheetName,
    slug,
    productFields: {},
    translations: {},
    eanCodes: {},
    nutriFields: null,
    hasNutrition: false,
    allergenSulphites: false,
    warnings: [],
  };

  let currentSection = 'GENERAL';

  for (const row of rows) {
    const colA = row[0] !== null && row[0] !== undefined ? String(row[0]).trim().toUpperCase() : '';
    const colC = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : '';
    const colD = row[3];

    const fieldUpper = colC.toUpperCase();

    // Detect section headers
    if (['GENERAL INFORMATION', 'INTERNATIONAL', 'ITALY', 'GERMANY', 'FRANCE'].includes(colA) && !colC) {
      if (colA === 'GENERAL INFORMATION') currentSection = 'GENERAL';
      else currentSection = colA;
      continue;
    }

    // Data rows where colA indicates the market
    if (['INT', 'INTERNATIONAL', 'ITALY', 'GERMANY', 'FRANCE'].includes(colA) && colC) {
      currentSection = colA === 'INT' ? 'INTERNATIONAL' : colA;
    }

    if (!colC) continue;
    const value = cleanValue(colD);

    if (currentSection === 'GENERAL') {
      switch (fieldUpper) {
        case 'LINE': product.productFields.line = value; break;
        case 'MAIN SPIRITS': product.productFields.spirit = value; break;
        case 'ALCOHOL CONTENT (% VOL)': product.productFields.abv = parseAbv(String(colD)); break;
        case 'SHELF LIFE': product.productFields.shelf_life_note = value; break;
        case 'NUTRITIONAL VALUES': {
          const nutri = parseNutritional(colD);
          if (nutri) {
            product.nutriFields = nutri;
            product.hasNutrition = true;
          } else {
            product.warnings.push('No nutritional data (blanks in spreadsheet)');
          }
          break;
        }
        case 'SUGGESTED GARNISH': product.productFields.garnish = value; break;
        case 'LIQUID COLOR / ACCENT':
        case 'LIQUID COLOR': product.productFields.liquid_color = value; break;
        case 'BOTTLE CONTENT': product.productFields.serving = value; break;
        case 'FLAVOUR NOTES': product.productFields.flavour = value; break;
        case 'ACCESSORY 1 (GLASS)': product.productFields.glass = value; break;
        case 'ACCESSORY 2 (ICE TRAY)': product.productFields.ice = value; break;
        case 'FOOD PAIRING': product.productFields.food_pairing = value; break;
        case 'OCCASION PAIRING': product.productFields.occasion = value?.trimEnd() || null; break;
        case 'LINK': product.productFields.product_link = value; break;
      }
    } else {
      const lang = MARKET_LANG_MAP[currentSection];
      const marketCode = MARKET_CODE_MAP[currentSection];
      if (!lang || !marketCode) continue;

      if (!product.translations[lang]) product.translations[lang] = {};
      if (!product.eanCodes[marketCode]) product.eanCodes[marketCode] = {};

      switch (fieldUpper) {
        case 'COCKTAIL EANCODE': product.eanCodes[marketCode].ean_cocktail = value || undefined; break;
        case 'CARTON EANCODE': product.eanCodes[marketCode].ean_carton = value || undefined; break;
        case 'CLAIM': product.translations[lang].claim = value; break;
        case 'SENSORY DESCRIPTION': product.translations[lang].sensory_description = value; break;
        case 'INGREDIENT LIST': product.translations[lang].ingredient_list_short = value; break;
        case 'INGREDIENT FULL LIST': product.translations[lang].ingredient_list_full = value; break;
        case 'ALLERGENES':
          product.translations[lang].allergens_local = value;
          if (lang === 'EN') {
            product.productFields.allergens_summary = value;
            if (value && /sulph?ites/i.test(value)) {
              product.allergenSulphites = true;
            }
          }
          break;
        case 'UK UNITS':
          if (lang === 'EN') product.productFields.uk_units = value;
          break;
      }
    }
  }

  // Check for missing ingredient data
  if (!product.translations['EN']?.ingredient_list_full && !product.translations['EN']?.ingredient_list_short) {
    product.warnings.push('No ingredient data found (sheet incomplete)');
  }

  return product;
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedProduct[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const results: ParsedProduct[] = [];

  for (const name of workbook.SheetNames) {
    if (name.toUpperCase() === 'INGREDIENTS') continue;
    const parsed = parseSheet(workbook.Sheets[name], name);
    if (parsed) results.push(parsed);
  }

  return results;
}
