/** Maps raw database column names to human-readable labels for the Changes Log UI */
export const FIELD_LABELS: Record<string, string> = {
  // Common
  id: 'ID',
  created_at: 'Created',
  updated_at: 'Last updated',

  // Products
  name: 'Name',
  slug: 'URL Slug',
  description: 'Description',
  abv: 'Alcohol %',
  active: 'Active',
  brand_id: 'Brand',
  completeness: 'Completeness',
  bottle_color: 'Bottle Colour',
  label_color: 'Label Colour',

  // Translations
  language: 'Language',
  tagline: 'Tagline',
  body: 'Body Text',
  tasting_notes: 'Tasting Notes',
  serve_intro: 'Serve Introduction',
  heritage_text: 'Heritage Text',

  // Sections / Layout
  title: 'Title',
  subtitle: 'Subtitle',
  section_type: 'Section Type',
  content: 'Content',
  image_url: 'Image URL',
  video_url: 'Video URL',
  sort_order: 'Order',
  visible: 'Visible',

  // Serve moments
  glass_type: 'Glass Type',
  garnish: 'Garnish',
  instructions: 'Instructions',

  // Composition
  ingredient: 'Ingredient',
  quantity: 'Quantity',
  unit: 'Unit',

  // Pairings
  emoji: 'Emoji',

  // Activations
  status: 'Status',
  headline: 'Headline',
  cta_text: 'CTA Text',
  cta_url: 'CTA URL',
  bg_color: 'Background Colour',
  caption: 'Caption',
  autoplay: 'Autoplay',
  expires_at: 'Expiry Date',
  starts_at: 'Start Date',
  targeting_mode: 'Targeting Mode',
  allowed_slugs: 'Allowed Products',
  allowed_langs: 'Allowed Languages',

  // Images
  alt_text_en: 'Alt Text (EN)',
  alt_text_it: 'Alt Text (IT)',
  scene_description: 'Scene Description',
  composition: 'Composition',
  brightness: 'Brightness',
  mood: 'Mood',
  dominant_colors: 'Dominant Colours',
  best_for_sections: 'Best For',
  suitable_for_lines: 'Suitable For Lines',
  is_alcoholic_context: 'Alcoholic Context',
};

/** Fields to hide in the diff view (internal / not meaningful to admins) */
export const HIDDEN_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'brand_id', 'product_id',
  'image_id', 'sort_order',
]);

/** Format a raw value for display */
export function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'string' && (key.endsWith('_at') || key === 'expires_at' || key === 'starts_at')) {
    try { return new Date(value).toLocaleString(); } catch { return value; }
  }
  return String(value);
}
