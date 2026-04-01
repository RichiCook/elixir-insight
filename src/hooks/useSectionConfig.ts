import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SectionConfig {
  id?: string;
  product_id: string;
  section_key: string;
  sort_order: number;
  is_visible: boolean;
  custom_content: Record<string, any>;
}

// Default section definitions with display names and which fields are editable
export const SECTION_DEFINITIONS = [
  { key: 'hero', label: 'Hero Image & Title', editableFields: [] },
  { key: 'genuine_card', label: 'Genuine Card', editableFields: [] },
  { key: 'abv_display', label: 'ABV Display', editableFields: [] },
  { key: 'quick_facts', label: 'Quick Facts (How to Serve)', editableFields: [] },
  { key: 'crafted_with', label: 'Crafted With', editableFields: [] },
  { key: 'sensory', label: 'Sensory Description', editableFields: [] },
  { key: 'composition', label: 'Composition Chart', editableFields: [] },
  { key: 'serve_moments', label: 'Serve Moments', editableFields: [] },
  { key: 'pairings', label: 'Perfect Pairings', editableFields: [] },
  { key: 'ingredients', label: 'Ingredients', editableFields: [] },
  { key: 'nutrition', label: 'Nutritional Passport', editableFields: [] },
  { key: 'store_cta', label: 'Store CTA Button', editableFields: [
    { key: 'button_text', label: 'Button Text', type: 'input' as const, default: 'View on our Store ↗' },
    { key: 'button_url', label: 'Button URL', type: 'input' as const, default: '' },
    { key: 'footer_text', label: 'Footer Text', type: 'input' as const, default: 'Powered by Aitems · Product Intelligence' },
  ]},
  { key: 'editorial', label: 'Editorial Block', editableFields: [
    { key: 'line_label', label: 'Line Label (e.g. "Classic Line")', type: 'input' as const, default: '' },
    { key: 'heading', label: 'Heading', type: 'input' as const, default: '' },
    { key: 'heading_accent', label: 'Heading Accent Word (gold italic)', type: 'input' as const, default: '' },
    { key: 'body', label: 'Body Text', type: 'textarea' as const, default: '' },
  ]},
  { key: 'gallery', label: 'Photo Gallery', editableFields: [] },
  { key: 'brand_heritage', label: 'Brand Heritage', editableFields: [
    { key: 'badge_text', label: 'Badge Text', type: 'input' as const, default: 'Since 2020 · Made in Italy' },
    { key: 'heading', label: 'Heading', type: 'input' as const, default: '' },
    { key: 'heading_accent', label: 'Heading Accent (gold italic)', type: 'input' as const, default: '' },
    { key: 'body_en', label: 'Body (EN)', type: 'textarea' as const, default: '' },
    { key: 'body_it', label: 'Body (IT)', type: 'textarea' as const, default: '' },
  ]},
  { key: 'footer', label: 'Footer', editableFields: [
    { key: 'website_text', label: 'Website Text', type: 'input' as const, default: 'classycocktails.com' },
    { key: 'passport_label', label: 'Passport Label', type: 'input' as const, default: 'Digital Nutritional Passport' },
  ]},
] as const;

export const DEFAULT_ORDER: Array<{
  section_key: string;
  sort_order: number;
  is_visible: boolean;
  custom_content: Record<string, any>;
}> = SECTION_DEFINITIONS.map((s, i) => ({
  section_key: s.key,
  sort_order: i,
  is_visible: true,
  custom_content: {} as Record<string, any>,
}));

export function useProductSections(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-sections', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sections')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as SectionConfig[];
    },
    enabled: !!productId,
  });
}

// Merge saved config with defaults — any missing sections get appended at the end
export function getMergedSections(saved: SectionConfig[] | undefined): Array<{
  section_key: string;
  sort_order: number;
  is_visible: boolean;
  custom_content: Record<string, any>;
}> {
  if (!saved || saved.length === 0) return [...DEFAULT_ORDER];

  const savedMap = new Map(saved.map(s => [s.section_key, s]));
  const result: typeof DEFAULT_ORDER = [];
  let maxOrder = Math.max(...saved.map(s => s.sort_order), -1);

  // First add all saved sections in order
  for (const s of saved) {
    result.push({
      section_key: s.section_key,
      sort_order: s.sort_order,
      is_visible: s.is_visible,
      custom_content: (s.custom_content || {}) as Record<string, any>,
    });
  }

  // Then add any missing defaults
  for (const def of DEFAULT_ORDER) {
    if (!savedMap.has(def.section_key)) {
      maxOrder++;
      result.push({ ...def, sort_order: maxOrder });
    }
  }

  return result.sort((a, b) => a.sort_order - b.sort_order);
}
