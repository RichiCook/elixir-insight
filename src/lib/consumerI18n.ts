/**
 * Consumer-facing i18n strings and helpers.
 *
 * Usage:
 *   import { t, getLocalizedContent } from '@/lib/consumerI18n';
 *   t(lang, 'how_to_serve')          // → "How to Serve" | "Come Servirlo"
 *   getLocalizedContent(content, 'body', lang)   // multilingual custom_content lookup
 */

// ---------------------------------------------------------------------------
// UI string dictionary
// ---------------------------------------------------------------------------

type StringKey =
  | 'how_to_serve'
  | 'spirit' | 'serving' | 'glass' | 'ice' | 'garnish' | 'flavour'
  | 'composition'
  | 'ingredients'
  | 'view_full_ingredients'
  | 'hide_full_ingredients'
  | 'perfect_pairings'
  | 'ai_curated'
  | 'featured'
  | 'perfect_occasion'
  | 'any_moment'
  | 'made_for_aperitivo'
  | 'view_on_store'
  | 'digital_product_passport'
  | 'digital_nutritional_passport'
  | 'drink_responsibly'
  | 'privacy_policy'
  | 'data_requests'
  | 'nutritional_info'
  | 'per_100ml'
  | 'energy' | 'fat' | 'saturated_fat' | 'carbohydrates' | 'sugars' | 'protein' | 'salt' | 'alcohol';

const STRINGS: Record<string, Partial<Record<StringKey, string>>> = {
  EN: {
    how_to_serve: 'How to Serve',
    spirit: 'Spirit',
    serving: 'Serving',
    glass: 'Glass',
    ice: 'Ice',
    garnish: 'Garnish',
    flavour: 'Flavour',
    composition: 'Composition',
    ingredients: 'Ingredients',
    view_full_ingredients: 'View full ingredient list',
    hide_full_ingredients: 'Hide full list',
    perfect_pairings: 'Perfect Pairings',
    ai_curated: 'AI-curated suggestions',
    featured: 'Featured',
    perfect_occasion: 'The Perfect Occasion',
    any_moment: 'Any Moment, No Regrets',
    made_for_aperitivo: 'Made for the Aperitivo',
    view_on_store: 'View on our Store ↗',
    digital_product_passport: 'Digital Product Passport',
    digital_nutritional_passport: 'Digital Nutritional Passport',
    drink_responsibly: 'Drink responsibly. Not for sale to persons under 18.',
    privacy_policy: 'Privacy Policy',
    data_requests: 'Data Requests',
    nutritional_info: 'Nutritional Information',
    per_100ml: 'per 100 ml',
    energy: 'Energy', fat: 'Fat', saturated_fat: 'Saturated Fat',
    carbohydrates: 'Carbohydrates', sugars: 'Sugars',
    protein: 'Protein', salt: 'Salt', alcohol: 'Alcohol',
  },
  IT: {
    how_to_serve: 'Come Servirlo',
    spirit: 'Distillato',
    serving: 'Servizio',
    glass: 'Bicchiere',
    ice: 'Ghiaccio',
    garnish: 'Guarnizione',
    flavour: 'Sapore',
    composition: 'Composizione',
    ingredients: 'Ingredienti',
    view_full_ingredients: 'Vedi la lista completa degli ingredienti',
    hide_full_ingredients: 'Nascondi la lista',
    perfect_pairings: 'Abbinamenti Perfetti',
    ai_curated: 'Suggerimenti selezionati con AI',
    featured: 'In evidenza',
    perfect_occasion: "L'Occasione Perfetta",
    any_moment: 'Ogni Momento, Senza Rimpianti',
    made_for_aperitivo: "Fatto per l'Aperitivo",
    view_on_store: 'Vedi nel nostro Shop ↗',
    digital_product_passport: 'Passaporto Digitale del Prodotto',
    digital_nutritional_passport: 'Passaporto Nutrizionale Digitale',
    drink_responsibly: 'Bevi responsabilmente. Vietato ai minori di 18 anni.',
    privacy_policy: 'Privacy Policy',
    data_requests: 'Richieste sui Dati',
    nutritional_info: 'Informazioni Nutrizionali',
    per_100ml: 'per 100 ml',
    energy: 'Energia', fat: 'Grassi', saturated_fat: 'Grassi saturi',
    carbohydrates: 'Carboidrati', sugars: 'Zuccheri',
    protein: 'Proteine', salt: 'Sale', alcohol: 'Alcol',
  },
  DE: {
    how_to_serve: 'Serviervorschlag',
    spirit: 'Spirituose',
    serving: 'Portion',
    glass: 'Glas',
    ice: 'Eis',
    garnish: 'Garnitur',
    flavour: 'Geschmack',
    composition: 'Zusammensetzung',
    ingredients: 'Zutaten',
    view_full_ingredients: 'Vollständige Zutatenliste anzeigen',
    hide_full_ingredients: 'Liste ausblenden',
    perfect_pairings: 'Perfekte Kombinationen',
    ai_curated: 'KI-kuratierte Vorschläge',
    featured: 'Empfohlen',
    perfect_occasion: 'Der Perfekte Anlass',
    any_moment: 'Jeder Moment, Keine Reue',
    made_for_aperitivo: 'Gemacht für den Aperitivo',
    view_on_store: 'Im Shop ansehen ↗',
    digital_product_passport: 'Digitaler Produktpass',
    digital_nutritional_passport: 'Digitaler Ernährungspass',
    drink_responsibly: 'Trinke verantwortungsvoll. Nicht für Personen unter 18 Jahren.',
    privacy_policy: 'Datenschutz',
    data_requests: 'Datenanfragen',
    nutritional_info: 'Nährwertinformationen',
    per_100ml: 'pro 100 ml',
    energy: 'Energie', fat: 'Fett', saturated_fat: 'Gesättigte Fettsäuren',
    carbohydrates: 'Kohlenhydrate', sugars: 'Zucker',
    protein: 'Eiweiß', salt: 'Salz', alcohol: 'Alkohol',
  },
  FR: {
    how_to_serve: 'Comment Servir',
    spirit: 'Spiritueux',
    serving: 'Service',
    glass: 'Verre',
    ice: 'Glace',
    garnish: 'Garniture',
    flavour: 'Goût',
    composition: 'Composition',
    ingredients: 'Ingrédients',
    view_full_ingredients: 'Voir la liste complète',
    hide_full_ingredients: 'Masquer la liste',
    perfect_pairings: 'Accords Parfaits',
    ai_curated: 'Suggestions assistées par IA',
    featured: 'Vedette',
    perfect_occasion: "L'Occasion Parfaite",
    any_moment: 'Chaque Instant, Sans Regrets',
    made_for_aperitivo: "Fait pour l'Apéritif",
    view_on_store: 'Voir dans notre boutique ↗',
    digital_product_passport: 'Passeport Numérique du Produit',
    digital_nutritional_passport: 'Passeport Nutritionnel Numérique',
    drink_responsibly: 'Consommez avec modération. Interdit aux moins de 18 ans.',
    privacy_policy: 'Politique de confidentialité',
    data_requests: 'Demandes de données',
    nutritional_info: 'Informations nutritionnelles',
    per_100ml: 'pour 100 ml',
    energy: 'Énergie', fat: 'Matières grasses', saturated_fat: 'Acides gras saturés',
    carbohydrates: 'Glucides', sugars: 'Sucres',
    protein: 'Protéines', salt: 'Sel', alcohol: 'Alcool',
  },
  ES: {
    how_to_serve: 'Cómo Servir',
    spirit: 'Destilado',
    serving: 'Servicio',
    glass: 'Copa',
    ice: 'Hielo',
    garnish: 'Guarnición',
    flavour: 'Sabor',
    composition: 'Composición',
    ingredients: 'Ingredientes',
    view_full_ingredients: 'Ver lista completa de ingredientes',
    hide_full_ingredients: 'Ocultar lista',
    perfect_pairings: 'Maridajes Perfectos',
    ai_curated: 'Sugerencias de IA',
    featured: 'Destacado',
    perfect_occasion: 'La Ocasión Perfecta',
    any_moment: 'Cada Momento, Sin Arrepentimientos',
    made_for_aperitivo: 'Hecho para el Aperitivo',
    view_on_store: 'Ver en nuestra tienda ↗',
    digital_product_passport: 'Pasaporte Digital del Producto',
    digital_nutritional_passport: 'Pasaporte Nutricional Digital',
    drink_responsibly: 'Consume con responsabilidad. Prohibido para menores de 18 años.',
    privacy_policy: 'Política de privacidad',
    data_requests: 'Solicitudes de datos',
    nutritional_info: 'Información nutricional',
    per_100ml: 'por 100 ml',
    energy: 'Energía', fat: 'Grasas', saturated_fat: 'Grasas saturadas',
    carbohydrates: 'Carbohidratos', sugars: 'Azúcares',
    protein: 'Proteínas', salt: 'Sal', alcohol: 'Alcohol',
  },
};

/**
 * Translate a UI string key for the given language.
 * Falls back to English if the lang or key is not found.
 */
export function t(lang: string, key: StringKey): string {
  const langStrings = STRINGS[lang.toUpperCase()] ?? {};
  return langStrings[key] ?? STRINGS['EN'][key] ?? key;
}

// ---------------------------------------------------------------------------
// Section custom_content multilingual helper
// ---------------------------------------------------------------------------

/**
 * Look up a localized value from a section's custom_content JSON.
 *
 * Lookup order:
 *   1. `content[${key}_${lang.toLowerCase()}]`  e.g. body_it
 *   2. `content[${key}_en]`                      e.g. body_en
 *   3. `content[${key}]`                          e.g. body  (legacy single-lang)
 *   4. `fallback` (if provided)
 *   5. ''
 */
export function getLocalizedContent(
  content: Record<string, unknown> | null | undefined,
  key: string,
  lang: string,
  fallback = '',
): string {
  if (!content) return fallback;
  const langKey = `${key}_${lang.toLowerCase()}`;
  const enKey = `${key}_en`;
  return (
    (content[langKey] as string | undefined) ||
    (content[enKey] as string | undefined) ||
    (content[key] as string | undefined) ||
    fallback
  );
}

/**
 * Get the localized text from a DB row that carries a
 * `translations` JSONB column (serve_moments, pairings, etc.).
 *
 * Shape of `translations`:
 *   { "IT": { "title": "...", "description": "..." }, "FR": { ... } }
 */
export function getRowTranslation<T extends Record<string, unknown>>(
  row: T & { translations?: Record<string, Record<string, string>> | null },
  lang: string,
): Partial<T> {
  const t = row.translations?.[lang.toUpperCase()];
  if (!t) return {};
  return t as Partial<T>;
}
