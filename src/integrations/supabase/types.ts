export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activation_leads: {
        Row: {
          activation_id: string
          created_at: string | null
          custom_data: Json | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          product_slug: string | null
          rating: number | null
          session_id: string | null
        }
        Insert: {
          activation_id: string
          created_at?: string | null
          custom_data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          product_slug?: string | null
          rating?: number | null
          session_id?: string | null
        }
        Update: {
          activation_id?: string
          created_at?: string | null
          custom_data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          product_slug?: string | null
          rating?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_leads_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
        ]
      }
      activations: {
        Row: {
          activation_type: Database["public"]["Enums"]["activation_type"]
          brand_id: string
          content: Json
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          placement: string
          priority: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["activation_status"]
          target_collection_ids: string[] | null
          target_product_ids: string[] | null
          targeting_mode: Database["public"]["Enums"]["targeting_mode"]
          updated_at: string | null
        }
        Insert: {
          activation_type: Database["public"]["Enums"]["activation_type"]
          brand_id: string
          content?: Json
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          placement?: string
          priority?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          target_collection_ids?: string[] | null
          target_product_ids?: string[] | null
          targeting_mode?: Database["public"]["Enums"]["targeting_mode"]
          updated_at?: string | null
        }
        Update: {
          activation_type?: Database["public"]["Enums"]["activation_type"]
          brand_id?: string
          content?: Json
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          placement?: string
          priority?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          target_collection_ids?: string[] | null
          target_product_ids?: string[] | null
          targeting_mode?: Database["public"]["Enums"]["targeting_mode"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_images: {
        Row: {
          created_at: string | null
          file_size: number | null
          filename: string
          height: number | null
          id: string
          public_url: string
          status: string | null
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          public_url: string
          status?: string | null
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          public_url?: string
          status?: string | null
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      image_attributes: {
        Row: {
          alt_text_en: string | null
          alt_text_it: string | null
          best_for_sections: string[] | null
          brightness: string | null
          cocktails_present: string[] | null
          composition: string | null
          created_at: string | null
          dominant_colors: string[] | null
          foods_present: string[] | null
          id: string
          image_id: string | null
          internal_notes: string | null
          is_alcoholic_context: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          mood: string[] | null
          people_count: number | null
          people_present: boolean | null
          people_setting: string | null
          product_slugs: string[] | null
          props_present: string[] | null
          scene_description: string | null
          season: string | null
          setting: string | null
          suitable_for_lines: string[] | null
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          alt_text_en?: string | null
          alt_text_it?: string | null
          best_for_sections?: string[] | null
          brightness?: string | null
          cocktails_present?: string[] | null
          composition?: string | null
          created_at?: string | null
          dominant_colors?: string[] | null
          foods_present?: string[] | null
          id?: string
          image_id?: string | null
          internal_notes?: string | null
          is_alcoholic_context?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          mood?: string[] | null
          people_count?: number | null
          people_present?: boolean | null
          people_setting?: string | null
          product_slugs?: string[] | null
          props_present?: string[] | null
          scene_description?: string | null
          season?: string | null
          setting?: string | null
          suitable_for_lines?: string[] | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_text_en?: string | null
          alt_text_it?: string | null
          best_for_sections?: string[] | null
          brightness?: string | null
          cocktails_present?: string[] | null
          composition?: string | null
          created_at?: string | null
          dominant_colors?: string[] | null
          foods_present?: string[] | null
          id?: string
          image_id?: string | null
          internal_notes?: string | null
          is_alcoholic_context?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          mood?: string[] | null
          people_count?: number | null
          people_present?: boolean | null
          people_setting?: string | null
          product_slugs?: string[] | null
          props_present?: string[] | null
          scene_description?: string | null
          season?: string | null
          setting?: string | null
          suitable_for_lines?: string[] | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_attributes_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "brand_images"
            referencedColumns: ["id"]
          },
        ]
      }
      image_views: {
        Row: {
          id: string
          image_id: string | null
          product_slug: string | null
          section: string | null
          session_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          image_id?: string | null
          product_slug?: string | null
          section?: string | null
          session_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          image_id?: string | null
          product_slug?: string | null
          section?: string | null
          session_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_views_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "brand_images"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          city: string | null
          country: string | null
          id: string
          language: string | null
          product_slug: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          id?: string
          language?: string | null
          product_slug: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          id?: string
          language?: string | null
          product_slug?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      product_ai_pairings: {
        Row: {
          emoji: string | null
          id: string
          is_featured: boolean | null
          name: string
          product_id: string | null
          sort_order: number | null
          subtitle: string | null
        }
        Insert: {
          emoji?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          product_id?: string | null
          sort_order?: number | null
          subtitle?: string | null
        }
        Update: {
          emoji?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          product_id?: string | null
          sort_order?: number | null
          subtitle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ai_pairings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_composition: {
        Row: {
          color: string
          id: string
          ingredient_name: string
          percentage: number
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          color: string
          id?: string
          ingredient_name: string
          percentage: number
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string
          id?: string
          ingredient_name?: string
          percentage?: number
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_composition_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ean_codes: {
        Row: {
          ean_carton: string | null
          ean_cocktail: string | null
          id: string
          market: string
          product_id: string | null
        }
        Insert: {
          ean_carton?: string | null
          ean_cocktail?: string | null
          id?: string
          market: string
          product_id?: string | null
        }
        Update: {
          ean_carton?: string | null
          ean_cocktail?: string | null
          id?: string
          market?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ean_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          image_id: string | null
          product_id: string | null
          section: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          image_id?: string | null
          product_id?: string | null
          section: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          image_id?: string | null
          product_id?: string | null
          section?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "brand_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_serve_moments: {
        Row: {
          background_color: string | null
          description: string
          emoji: string | null
          id: string
          occasion: string
          product_id: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          background_color?: string | null
          description: string
          emoji?: string | null
          id?: string
          occasion: string
          product_id?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          background_color?: string | null
          description?: string
          emoji?: string | null
          id?: string
          occasion?: string
          product_id?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_serve_moments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_technical_data: {
        Row: {
          accreditation_number: string | null
          additional_information: string | null
          alcoholic_strength: string | null
          allergen_celery: boolean | null
          allergen_crustaceans: boolean | null
          allergen_eggs: boolean | null
          allergen_fish: boolean | null
          allergen_gluten: boolean | null
          allergen_lupin: boolean | null
          allergen_milk: boolean | null
          allergen_molluscs: boolean | null
          allergen_mustard: boolean | null
          allergen_nuts: boolean | null
          allergen_peanuts: boolean | null
          allergen_sesame: boolean | null
          allergen_soybeans: boolean | null
          allergen_sulphites: boolean | null
          appearance: string | null
          application: string | null
          batch_number: string | null
          brix: string | null
          carbohydrates: string | null
          colour: string | null
          compliance_references: string | null
          compliance_regulation_1: string | null
          compliance_regulation_2: string | null
          compliance_regulation_3: string | null
          document_date: string | null
          document_revision: string | null
          document_type: string | null
          energy_kcal: string | null
          energy_kj: string | null
          fats: string | null
          fibre: string | null
          gmo_declaration: string | null
          id: string
          ionising_radiation: string | null
          label_date: string | null
          laboratory_address: string | null
          laboratory_name: string | null
          microbiological_count: string | null
          odor: string | null
          ph: string | null
          product_id: string | null
          proteins: string | null
          raw_analytical_data: Json | null
          recommended_dosage: string | null
          salt: string | null
          saturated_fats: string | null
          shelf_life: string | null
          sodium_mg: string | null
          storage_after_opening: string | null
          storage_conditions: string | null
          sugars: string | null
          supplier_address: string | null
          supplier_email: string | null
          supplier_name: string | null
          supplier_phone: string | null
          supplier_vat: string | null
          taste_profile: string | null
          test_report_number: string | null
          total_acidity: string | null
          trans_fats: string | null
        }
        Insert: {
          accreditation_number?: string | null
          additional_information?: string | null
          alcoholic_strength?: string | null
          allergen_celery?: boolean | null
          allergen_crustaceans?: boolean | null
          allergen_eggs?: boolean | null
          allergen_fish?: boolean | null
          allergen_gluten?: boolean | null
          allergen_lupin?: boolean | null
          allergen_milk?: boolean | null
          allergen_molluscs?: boolean | null
          allergen_mustard?: boolean | null
          allergen_nuts?: boolean | null
          allergen_peanuts?: boolean | null
          allergen_sesame?: boolean | null
          allergen_soybeans?: boolean | null
          allergen_sulphites?: boolean | null
          appearance?: string | null
          application?: string | null
          batch_number?: string | null
          brix?: string | null
          carbohydrates?: string | null
          colour?: string | null
          compliance_references?: string | null
          compliance_regulation_1?: string | null
          compliance_regulation_2?: string | null
          compliance_regulation_3?: string | null
          document_date?: string | null
          document_revision?: string | null
          document_type?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string
          ionising_radiation?: string | null
          label_date?: string | null
          laboratory_address?: string | null
          laboratory_name?: string | null
          microbiological_count?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          raw_analytical_data?: Json | null
          recommended_dosage?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          sodium_mg?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          supplier_address?: string | null
          supplier_email?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_vat?: string | null
          taste_profile?: string | null
          test_report_number?: string | null
          total_acidity?: string | null
          trans_fats?: string | null
        }
        Update: {
          accreditation_number?: string | null
          additional_information?: string | null
          alcoholic_strength?: string | null
          allergen_celery?: boolean | null
          allergen_crustaceans?: boolean | null
          allergen_eggs?: boolean | null
          allergen_fish?: boolean | null
          allergen_gluten?: boolean | null
          allergen_lupin?: boolean | null
          allergen_milk?: boolean | null
          allergen_molluscs?: boolean | null
          allergen_mustard?: boolean | null
          allergen_nuts?: boolean | null
          allergen_peanuts?: boolean | null
          allergen_sesame?: boolean | null
          allergen_soybeans?: boolean | null
          allergen_sulphites?: boolean | null
          appearance?: string | null
          application?: string | null
          batch_number?: string | null
          brix?: string | null
          carbohydrates?: string | null
          colour?: string | null
          compliance_references?: string | null
          compliance_regulation_1?: string | null
          compliance_regulation_2?: string | null
          compliance_regulation_3?: string | null
          document_date?: string | null
          document_revision?: string | null
          document_type?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string
          ionising_radiation?: string | null
          label_date?: string | null
          laboratory_address?: string | null
          laboratory_name?: string | null
          microbiological_count?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          raw_analytical_data?: Json | null
          recommended_dosage?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          sodium_mg?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          supplier_address?: string | null
          supplier_email?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_vat?: string | null
          taste_profile?: string | null
          test_report_number?: string | null
          total_acidity?: string | null
          trans_fats?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_technical_data_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          allergens_local: string | null
          claim: string | null
          id: string
          ingredient_list_full: string | null
          ingredient_list_short: string | null
          language: string
          product_id: string | null
          sensory_description: string | null
        }
        Insert: {
          allergens_local?: string | null
          claim?: string | null
          id?: string
          ingredient_list_full?: string | null
          ingredient_list_short?: string | null
          language: string
          product_id?: string | null
          sensory_description?: string | null
        }
        Update: {
          allergens_local?: string | null
          claim?: string | null
          id?: string
          ingredient_list_full?: string | null
          ingredient_list_short?: string | null
          language?: string
          product_id?: string | null
          sensory_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          abv: string
          allergens_summary: string | null
          bottle_color: string | null
          completeness: number | null
          created_at: string | null
          ean_int: string | null
          flavour: string | null
          food_pairing: string | null
          garnish: string | null
          glass: string | null
          hero_bg: string | null
          ice: string | null
          id: string
          label_color: string | null
          line: string
          liquid_color: string | null
          name: string
          occasion: string | null
          product_link: string | null
          serving: string | null
          slug: string
          spirit: string | null
          uk_units: string | null
          updated_at: string | null
        }
        Insert: {
          abv: string
          allergens_summary?: string | null
          bottle_color?: string | null
          completeness?: number | null
          created_at?: string | null
          ean_int?: string | null
          flavour?: string | null
          food_pairing?: string | null
          garnish?: string | null
          glass?: string | null
          hero_bg?: string | null
          ice?: string | null
          id?: string
          label_color?: string | null
          line: string
          liquid_color?: string | null
          name: string
          occasion?: string | null
          product_link?: string | null
          serving?: string | null
          slug: string
          spirit?: string | null
          uk_units?: string | null
          updated_at?: string | null
        }
        Update: {
          abv?: string
          allergens_summary?: string | null
          bottle_color?: string | null
          completeness?: number | null
          created_at?: string | null
          ean_int?: string | null
          flavour?: string | null
          food_pairing?: string | null
          garnish?: string | null
          glass?: string | null
          hero_bg?: string | null
          ice?: string | null
          id?: string
          label_color?: string | null
          line?: string
          liquid_color?: string | null
          name?: string
          occasion?: string | null
          product_link?: string | null
          serving?: string | null
          slug?: string
          spirit?: string | null
          uk_units?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      repair_requests: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          damage_type: string
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          id: string
          photos: string[] | null
          product_id: string | null
          status: Database["public"]["Enums"]["repair_request_status"]
          updated_at: string | null
          user_email: string | null
          user_name: string | null
          warranty_status: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          damage_type: string
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          photos?: string[] | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["repair_request_status"]
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          warranty_status?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          damage_type?: string
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          photos?: string[] | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["repair_request_status"]
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_settings: {
        Row: {
          created_at: string | null
          damage_types: Json
          email_template_fields: Json
          enabled: boolean
          estimated_turnaround: string | null
          id: string
          pricing_rules: Json
          repair_centre_address: string | null
          repair_email: string | null
          return_shipping_cost: number
          updated_at: string | null
          warranty_covers_repair: boolean
        }
        Insert: {
          created_at?: string | null
          damage_types?: Json
          email_template_fields?: Json
          enabled?: boolean
          estimated_turnaround?: string | null
          id?: string
          pricing_rules?: Json
          repair_centre_address?: string | null
          repair_email?: string | null
          return_shipping_cost?: number
          updated_at?: string | null
          warranty_covers_repair?: boolean
        }
        Update: {
          created_at?: string | null
          damage_types?: Json
          email_template_fields?: Json
          enabled?: boolean
          estimated_turnaround?: string | null
          id?: string
          pricing_rules?: Json
          repair_centre_address?: string | null
          repair_email?: string | null
          return_shipping_cost?: number
          updated_at?: string | null
          warranty_covers_repair?: boolean
        }
        Relationships: []
      }
      scan_events: {
        Row: {
          ean_code: string | null
          id: string
          language: string | null
          market: string | null
          product_slug: string
          scanned_at: string | null
          session_id: string | null
        }
        Insert: {
          ean_code?: string | null
          id?: string
          language?: string | null
          market?: string | null
          product_slug: string
          scanned_at?: string | null
          session_id?: string | null
        }
        Update: {
          ean_code?: string | null
          id?: string
          language?: string | null
          market?: string | null
          product_slug?: string
          scanned_at?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      section_interactions: {
        Row: {
          id: string
          interacted_at: string | null
          interaction_type: string | null
          metadata: Json | null
          product_slug: string
          section_name: string
          session_id: string | null
        }
        Insert: {
          id?: string
          interacted_at?: string | null
          interaction_type?: string | null
          metadata?: Json | null
          product_slug: string
          section_name: string
          session_id?: string | null
        }
        Update: {
          id?: string
          interacted_at?: string | null
          interaction_type?: string | null
          metadata?: Json | null
          product_slug?: string
          section_name?: string
          session_id?: string | null
        }
        Relationships: []
      }
      tech_sheet_uploads: {
        Row: {
          applied_at: string | null
          created_at: string | null
          error_message: string | null
          extracted_json: Json | null
          filename: string
          id: string
          product_id: string | null
          status: string | null
          storage_path: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_json?: Json | null
          filename: string
          id?: string
          product_id?: string | null
          status?: string | null
          storage_path: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_json?: Json | null
          filename?: string
          id?: string
          product_id?: string | null
          status?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_sheet_uploads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      maybe_assign_admin: { Args: never; Returns: undefined }
    }
    Enums: {
      activation_status:
        | "draft"
        | "scheduled"
        | "active"
        | "paused"
        | "completed"
      activation_type:
        | "text_image"
        | "video"
        | "banner_cta"
        | "custom_html"
        | "lead_capture"
        | "lead_capture_rating"
      app_role: "admin" | "moderator" | "user"
      repair_request_status:
        | "submitted"
        | "reviewing"
        | "approved"
        | "in_repair"
        | "shipped_back"
        | "completed"
        | "cancelled"
      targeting_mode: "products" | "collections"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activation_status: [
        "draft",
        "scheduled",
        "active",
        "paused",
        "completed",
      ],
      activation_type: [
        "text_image",
        "video",
        "banner_cta",
        "custom_html",
        "lead_capture",
        "lead_capture_rating",
      ],
      app_role: ["admin", "moderator", "user"],
      repair_request_status: [
        "submitted",
        "reviewing",
        "approved",
        "in_repair",
        "shipped_back",
        "completed",
        "cancelled",
      ],
      targeting_mode: ["products", "collections"],
    },
  },
} as const
