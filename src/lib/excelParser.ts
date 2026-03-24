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
  'NO REGRETS NEGRONI': 'no-regrets-negroni',
  'NO REGRETS MOMENTS': 'no-regrets-moment',
};

const MARKET_LANG_MAP: Record<string, string> = {
  'INTERNATIONAL': 'EN',
  'INT': 'EN',
  'ITALY': 'IT',
  'GERMANY': 'DE',
  'FRANCE': 'FR',
};

const MARKET_CODE_MAP: Record<string, string> = {
  'INTERNATIONAL': 'INT',
  'INT': 'INT',
  'ITALY': 'IT',
  'GERMANY': 'DE',
  'FRANCE': 'FR',
};

function parseNutritionalValues(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value) return result;

  const lines = value.split(/[•\n\r]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('energy')) {
      const match = line.match(/[\d.,]+\s*kcal/i);
      if (match) result.energy_kcal = match[0].replace(/\s*kcal/i, '').trim();
    } else if (lower.startsWith('total fat')) {
      result.fats = line.replace(/total\s*fats?\s*:?\s*/i, '').trim();
    } else if (lower.startsWith('carbohydrate')) {
      result.carbohydrates = line.replace(/carbohydrates?\s*:?\s*/i, '').trim();
    } else if (lower.startsWith('sugar')) {
      result.sugars = line.replace(/sugars?\s*:?\s*/i, '').trim();
    } else if (lower.startsWith('protein')) {
      result.proteins = line.replace(/proteins?\s*:?\s*/i, '').trim();
    } else if (lower.startsWith('salt')) {
      result.salt = line.replace(/salt\s*:?\s*/i, '').trim();
    }
  }
  return result;
}

export interface ParsedProduct {
  sheetName: string;
  slug: string;
  productFields: Record<string, string | null>;
  translations: Record<string, Record<string, string | null>>; // lang -> fields
  eanCodes: Record<string, { ean_cocktail?: string; ean_carton?: string }>; // market code -> eans
  nutriFields: Record<string, string>;
}

function cleanValue(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'N/A') return null;
  return s;
}

function parseSheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedProduct | null {
  const slug = SHEET_SLUG_MAP[sheetName.toUpperCase().trim()];
  if (!slug) return null;

  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

  const product: ParsedProduct = {
    sheetName,
    slug,
    productFields: {},
    translations: {},
    eanCodes: {},
    nutriFields: {},
  };

  let currentSection = '';

  for (const row of rows) {
    const colA = String(row[0] || '').trim().toUpperCase();
    const colB = String(row[1] || '').trim();
    const colC = String(row[2] || '').trim();
    const colD = String(row[3] || '').trim();

    // Detect section headers
    if (['GENERAL INFORMATION', 'INTERNATIONAL', 'ITALY', 'GERMANY', 'FRANCE'].includes(colA)) {
      currentSection = colA;
      continue;
    }

    // The field name is in column C, value in column D
    const fieldName = colC.toUpperCase();
    const value = cleanValue(colD);

    if (!fieldName || value === null) continue;

    if (currentSection === 'GENERAL INFORMATION') {
      switch (fieldName) {
        case 'LINE': product.productFields.line = value; break;
        case 'MAIN SPIRITS': product.productFields.spirit = value; break;
        case 'ALCOHOL CONTENT (% VOL)': product.productFields.abv = value; break;
        case 'SHELF LIFE': product.productFields.shelf_life = value; break;
        case 'NUTRITIONAL VALUES': product.nutriFields = parseNutritionalValues(colD); break;
        case 'SUGGESTED GARNISH': product.productFields.garnish = value; break;
        case 'LIQUID COLOR / ACCENT': product.productFields.liquid_color = value; break;
        case 'BOTTLE CONTENT': product.productFields.serving = value; break;
        case 'FLAVOUR NOTES': product.productFields.flavour = value; break;
        case 'ACCESSORY 1 (GLASS)': product.productFields.glass = value; break;
        case 'ACCESSORY 2 (ICE TRAY)': product.productFields.ice = value; break;
        case 'FOOD PAIRING': product.productFields.food_pairing = value; break;
        case 'OCCASION PAIRING': product.productFields.occasion = value; break;
        case 'LINK': product.productFields.product_link = value; break;
      }
    } else {
      const lang = MARKET_LANG_MAP[currentSection];
      const marketCode = MARKET_CODE_MAP[currentSection];
      if (!lang || !marketCode) continue;

      if (!product.translations[lang]) product.translations[lang] = {};
      if (!product.eanCodes[marketCode]) product.eanCodes[marketCode] = {};

      switch (fieldName) {
        case 'COCKTAIL EANCODE': product.eanCodes[marketCode].ean_cocktail = value; break;
        case 'CARTON EANCODE': product.eanCodes[marketCode].ean_carton = value; break;
        case 'CLAIM': product.translations[lang].claim = value; break;
        case 'SENSORY DESCRIPTION': product.translations[lang].sensory_description = value; break;
        case 'INGREDIENT LIST': product.translations[lang].ingredient_list_short = value; break;
        case 'INGREDIENT FULL LIST': product.translations[lang].ingredient_list_full = value; break;
        case 'ALLERGENES':
          product.translations[lang].allergens_local = value;
          if (lang === 'EN') product.productFields.allergens_summary = value;
          break;
        case 'UK UNITS':
          if (lang === 'EN') product.productFields.uk_units = value;
          break;
      }
    }
  }

  return product;
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedProduct[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const results: ParsedProduct[] = [];

  for (const name of workbook.SheetNames) {
    const parsed = parseSheet(workbook.Sheets[name], name);
    if (parsed) results.push(parsed);
  }

  return results;
}
