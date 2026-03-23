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
          brix: string | null
          carbohydrates: string | null
          compliance_references: string | null
          energy_kcal: string | null
          energy_kj: string | null
          fats: string | null
          fibre: string | null
          gmo_declaration: string | null
          id: string
          ionising_radiation: string | null
          microbiological_count: string | null
          odor: string | null
          ph: string | null
          product_id: string | null
          proteins: string | null
          salt: string | null
          saturated_fats: string | null
          shelf_life: string | null
          storage_after_opening: string | null
          storage_conditions: string | null
          sugars: string | null
          taste_profile: string | null
        }
        Insert: {
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
          brix?: string | null
          carbohydrates?: string | null
          compliance_references?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string
          ionising_radiation?: string | null
          microbiological_count?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          taste_profile?: string | null
        }
        Update: {
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
          brix?: string | null
          carbohydrates?: string | null
          compliance_references?: string | null
          energy_kcal?: string | null
          energy_kj?: string | null
          fats?: string | null
          fibre?: string | null
          gmo_declaration?: string | null
          id?: string
          ionising_radiation?: string | null
          microbiological_count?: string | null
          odor?: string | null
          ph?: string | null
          product_id?: string | null
          proteins?: string | null
          salt?: string | null
          saturated_fats?: string | null
          shelf_life?: string | null
          storage_after_opening?: string | null
          storage_conditions?: string | null
          sugars?: string | null
          taste_profile?: string | null
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
          serving?: string | null
          slug?: string
          spirit?: string | null
          uk_units?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
