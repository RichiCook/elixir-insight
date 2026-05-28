import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Type definitions matching the get_bottle_page_data RPC response shape
// ---------------------------------------------------------------------------

export interface BottleProduct {
  id: string;
  slug: string;
  name: string;
  line: string | null;
  abv: string | null;
  spirit_type: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  completeness: number | null;
  active: boolean;
  collaboration_id: string | null;
  [key: string]: unknown;
}

export interface BottleTranslation {
  id: string;
  product_id: string;
  language: string;
  tagline: string | null;
  description: string | null;
  tasting_notes: string | null;
  serve_suggestion: string | null;
  brand_story: string | null;
  [key: string]: unknown;
}

export interface BottleCompositionItem {
  id: string;
  product_id: string;
  ingredient_name: string;
  percentage: number | null;
  color: string | null;
  sort_order: number;
}

export interface BottleServeMoment {
  id: string;
  product_id: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  [key: string]: unknown;
}

export interface BottleSection {
  id: string;
  product_id: string;
  section_key: string;
  sort_order: number;
  is_visible: boolean;
  custom_content: Record<string, unknown>;
}

export interface BottleImageAttribute {
  id: string;
  image_id: string;
  is_approved: boolean;
  alt_text_en: string | null;
  alt_text_it: string | null;
  scene_description: string | null;
  [key: string]: unknown;
}

export interface BottleImage {
  id: string;
  product_id: string;
  image_id: string;
  section: string;
  sort_order: number;
  brand_images: {
    id: string;
    filename: string;
    public_url: string;
    status: string;
    image_attributes: BottleImageAttribute[];
  };
}

export interface BottlePairing {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface BottleActivation {
  id: string;
  title: string;
  type: string;
  status: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BottleNutrition {
  [key: string]: unknown;
}

export interface BottleCollaboration {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface BottleBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  description: string | null;
  website_url: string | null;
}

export interface BottlePageData {
  product: BottleProduct;
  brand: BottleBrand;
  translation: BottleTranslation | null;
  composition: BottleCompositionItem[];
  serve_moments: BottleServeMoment[];
  sections: BottleSection[];
  pairings: BottlePairing[];
  images: BottleImage[];
  activations: BottleActivation[];
  nutrition: BottleNutrition | null;
  collaboration: BottleCollaboration | null;
  available_languages: string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBottlePageData(
  brandSlug: string | undefined,
  productSlug: string | undefined,
  lang: string,
) {
  return useQuery({
    queryKey: ['bottle-page', brandSlug, productSlug, lang],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bottle_page_data', {
        p_brand_slug: brandSlug!,
        p_slug:       productSlug!,
        p_lang:       lang,
      });
      if (error) throw error;
      return data as BottlePageData | null;
    },
    enabled: !!brandSlug && !!productSlug,
    staleTime: 60_000,
  });
}
