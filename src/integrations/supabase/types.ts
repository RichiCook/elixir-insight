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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          reward_code: string | null
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
          reward_code?: string | null
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
          reward_code?: string | null
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
          brand_id: string | null
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
          brand_id?: string | null
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
          brand_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "brand_images_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_videos: {
        Row: {
          brand_id: string | null
          created_at: string
          file_size: number | null
          filename: string
          id: string
          public_url: string
          status: string
          storage_path: string
          thumbnail_url: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          file_size?: number | null
          filename: string
          id?: string
          public_url: string
          status?: string
          storage_path: string
          thumbnail_url?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          file_size?: number | null
          filename?: string
          id?: string
          public_url?: string
          status?: string
          storage_path?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_videos_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active: boolean
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      catalogues: {
        Row: {
          accent_color: string | null
          activation_id: string | null
          bg_color: string | null
          brand_id: string | null
          created_at: string
          id: string
          intro: string | null
          kicker: string | null
          partner_logo_url: string | null
          partner_name: string | null
          product_ids: string[]
          short_code: string | null
          show_classy: boolean
          slug: string
          status: string
          text_color: string | null
          text_muted: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          activation_id?: string | null
          bg_color?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          kicker?: string | null
          partner_logo_url?: string | null
          partner_name?: string | null
          product_ids?: string[]
          short_code?: string | null
          show_classy?: boolean
          slug: string
          status?: string
          text_color?: string | null
          text_muted?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          activation_id?: string | null
          bg_color?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          kicker?: string | null
          partner_logo_url?: string | null
          partner_name?: string | null
          product_ids?: string[]
          short_code?: string | null
          show_classy?: boolean
          slug?: string
          status?: string
          text_color?: string | null
          text_muted?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogues_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogues_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      change_log: {
        Row: {
          action: string
          after_data: Json | null
          archived_at: string | null
          before_data: Json | null
          changed_at: string
          changed_by: string | null
          changed_by_email: string | null
          entity_label: string | null
          id: string
          product_id: string | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          archived_at?: string | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          entity_label?: string | null
          id?: string
          product_id?: string | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          archived_at?: string | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          entity_label?: string | null
          id?: string
          product_id?: string | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      collaboration_cocktails: {
        Row: {
          cocktail_type: string
          collaboration_id: string
          created_at: string
          id: string
          product_id: string
          public_slug: string | null
          sort_order: number
        }
        Insert: {
          cocktail_type: string
          collaboration_id: string
          created_at?: string
          id?: string
          product_id: string
          public_slug?: string | null
          sort_order?: number
        }
        Update: {
          cocktail_type?: string
          collaboration_id?: string
          created_at?: string
          id?: string
          product_id?: string
          public_slug?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_cocktails_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_cocktails_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_cocktails_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          brand_color: string | null
          brand_id: string
          brand_logo_url: string | null
          brand_name: string
          brand_slug: string
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_id: string
          brand_logo_url?: string | null
          brand_name: string
          brand_slug: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_id?: string
          brand_logo_url?: string | null
          brand_name?: string
          brand_slug?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      default_layout_sections: {
        Row: {
          block_config: Json | null
          block_type: string
          brand_id: string
          custom_content: Json | null
          id: string
          is_visible: boolean
          section_key: string
          sort_order: number
        }
        Insert: {
          block_config?: Json | null
          block_type?: string
          brand_id: string
          custom_content?: Json | null
          id?: string
          is_visible?: boolean
          section_key: string
          sort_order?: number
        }
        Update: {
          block_config?: Json | null
          block_type?: string
          brand_id?: string
          custom_content?: Json | null
          id?: string
          is_visible?: boolean
          section_key?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "default_layout_sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
      line_editorials: {
        Row: {
          body: string | null
          heading: string | null
          heading_accent: string | null
          id: string
          language: string
          line: string
          line_label: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          heading?: string | null
          heading_accent?: string | null
          id?: string
          language?: string
          line: string
          line_label?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          heading?: string | null
          heading_accent?: string | null
          id?: string
          language?: string
          line?: string
          line_label?: string | null
          updated_at?: string
        }
        Relationships: []
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
          translations: Json
        }
        Insert: {
          emoji?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          product_id?: string | null
          sort_order?: number | null
          subtitle?: string | null
          translations?: Json
        }
        Update: {
          emoji?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          product_id?: string | null
          sort_order?: number | null
          subtitle?: string | null
          translations?: Json
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
      product_sections: {
        Row: {
          block_config: Json | null
          block_type: string
          custom_content: Json | null
          id: string
          is_visible: boolean
          product_id: string
          section_key: string
          sort_order: number
        }
        Insert: {
          block_config?: Json | null
          block_type?: string
          custom_content?: Json | null
          id?: string
          is_visible?: boolean
          product_id: string
          section_key: string
          sort_order?: number
        }
        Update: {
          block_config?: Json | null
          block_type?: string
          custom_content?: Json | null
          id?: string
          is_visible?: boolean
          product_id?: string
          section_key?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sections_product_id_fkey"
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
          image_url: string | null
          occasion: string
          product_id: string | null
          sort_order: number | null
          title: string
          translations: Json
        }
        Insert: {
          background_color?: string | null
          description: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          occasion: string
          product_id?: string | null
          sort_order?: number | null
          title: string
          translations?: Json
        }
        Update: {
          background_color?: string | null
          description?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          occasion?: string
          product_id?: string | null
          sort_order?: number | null
          title?: string
          translations?: Json
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
      product_slug_history: {
        Row: {
          created_at: string
          id: string
          old_slug: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          old_slug: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          old_slug?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_slug_history_product_id_fkey"
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
          flavour: string | null
          garnish: string | null
          glass: string | null
          ice: string | null
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
          flavour?: string | null
          garnish?: string | null
          glass?: string | null
          ice?: string | null
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
          flavour?: string | null
          garnish?: string | null
          glass?: string | null
          ice?: string | null
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
          brand_id: string
          collaboration_id: string | null
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
          is_collaboration: boolean | null
          label_color: string | null
          line: string
          liquid_color: string | null
          name: string
          occasion: string | null
          product_link: string | null
          serving: string | null
          slug: string
          source_product_id: string | null
          spirit: string | null
          uk_units: string | null
          updated_at: string | null
        }
        Insert: {
          abv: string
          allergens_summary?: string | null
          bottle_color?: string | null
          brand_id: string
          collaboration_id?: string | null
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
          is_collaboration?: boolean | null
          label_color?: string | null
          line: string
          liquid_color?: string | null
          name: string
          occasion?: string | null
          product_link?: string | null
          serving?: string | null
          slug: string
          source_product_id?: string | null
          spirit?: string | null
          uk_units?: string | null
          updated_at?: string | null
        }
        Update: {
          abv?: string
          allergens_summary?: string | null
          bottle_color?: string | null
          brand_id?: string
          collaboration_id?: string | null
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
          is_collaboration?: boolean | null
          label_color?: string | null
          line?: string
          liquid_color?: string | null
          name?: string
          occasion?: string | null
          product_link?: string | null
          serving?: string | null
          slug?: string
          source_product_id?: string | null
          spirit?: string | null
          uk_units?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          brand_id: string | null
          brand_slug: string | null
          city: string | null
          country: string | null
          ean_code: string | null
          id: string
          language: string | null
          market: string | null
          product_id: string | null
          product_slug: string
          region: string | null
          scanned_at: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          brand_id?: string | null
          brand_slug?: string | null
          city?: string | null
          country?: string | null
          ean_code?: string | null
          id?: string
          language?: string | null
          market?: string | null
          product_id?: string | null
          product_slug: string
          region?: string | null
          scanned_at?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          brand_id?: string | null
          brand_slug?: string | null
          city?: string | null
          country?: string | null
          ean_code?: string | null
          id?: string
          language?: string | null
          market?: string | null
          product_id?: string | null
          product_slug?: string
          region?: string | null
          scanned_at?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      site_settings: {
        Row: {
          brand_logo_light_url: string | null
          brand_logo_url: string | null
          favicon_url: string | null
          id: string
          show_spirit_partner_names: boolean
          site_title: string
          updated_at: string | null
        }
        Insert: {
          brand_logo_light_url?: string | null
          brand_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          show_spirit_partner_names?: boolean
          site_title?: string
          updated_at?: string | null
        }
        Update: {
          brand_logo_light_url?: string | null
          brand_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          show_spirit_partner_names?: boolean
          site_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spirit_partners: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
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
          brand_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          brand_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      collaborations_public: {
        Row: {
          brand_color: string | null
          brand_id: string | null
          brand_logo_url: string | null
          brand_name: string | null
          brand_slug: string | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_id?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_slug?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_id?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_slug?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_nutrition_public: {
        Row: {
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
          brix: string | null
          carbohydrates: string | null
          colour: string | null
          compliance_references: string | null
          document_date: string | null
          document_revision: string | null
          document_type: string | null
          energy_kcal: string | null
          energy_kj: string | null
          fats: string | null
          fibre: string | null
          gmo_declaration: string | null
          id: string | null
          ionising_radiation: string | null
          odor: string | null
          ph: string | null
          product_id: string | null
          proteins: string | null
          recommended_dosage: string | null
          salt: string | null
          saturated_fats: string | null
          shelf_life: string | null
          sodium_mg: string | null
          storage_after_opening: string | null
          storage_conditions: string | null
          sugars: string | null
          taste_profile: string | null
          total_acidity: string | null
          trans_fats: string | null
        }
        Insert: {
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
          brix?: string | null
          carbohydrates?: string | null
          colour?: string | null
          compliance_references?: string | null
          document_date?: string | null
          document_revision?: string | null
          document_type?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string | null
          ionising_radiation?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          recommended_dosage?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          sodium_mg?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          taste_profile?: string | null
          total_acidity?: string | null
          trans_fats?: string | null
        }
        Update: {
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
          brix?: string | null
          carbohydrates?: string | null
          colour?: string | null
          compliance_references?: string | null
          document_date?: string | null
          document_revision?: string | null
          document_type?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string | null
          ionising_radiation?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          recommended_dosage?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          sodium_mg?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          taste_profile?: string | null
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
    }
    Functions: {
      get_bottle_page_data: {
        Args: { p_brand_slug: string; p_lang?: string; p_slug: string }
        Returns: Json
      }
      get_catalogue_data: { Args: { p_slug: string }; Returns: Json }
      get_product_nutrition: { Args: { p_product_id: string }; Returns: Json }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_users_with_roles: {
        Args: never
        Returns: {
          email: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_brand_access: {
        Args: { p_brand_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "editor"
        | "marketing"
        | "supply"
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
  graphql_public: {
    Enums: {},
  },
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
      app_role: ["admin", "moderator", "user", "editor", "marketing", "supply"],
      targeting_mode: ["products", "collections"],
    },
  },
} as const
