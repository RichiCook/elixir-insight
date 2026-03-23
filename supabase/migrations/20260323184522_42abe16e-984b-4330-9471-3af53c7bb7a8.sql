-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  line text NOT NULL,
  abv text NOT NULL,
  ean_int text,
  serving text,
  spirit text,
  garnish text,
  glass text,
  ice text,
  flavour text,
  liquid_color text,
  food_pairing text,
  occasion text,
  uk_units text,
  allergens_summary text,
  bottle_color text,
  label_color text,
  hero_bg text,
  completeness integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_translations table
CREATE TABLE public.product_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  language text NOT NULL,
  claim text,
  sensory_description text,
  ingredient_list_short text,
  ingredient_list_full text,
  allergens_local text,
  UNIQUE(product_id, language)
);

-- Create product_composition table
CREATE TABLE public.product_composition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  percentage numeric NOT NULL,
  color text NOT NULL,
  sort_order integer DEFAULT 0
);

-- Create product_technical_data table
CREATE TABLE public.product_technical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  ph text,
  brix text,
  energy_kj text,
  energy_kcal text,
  fats text,
  saturated_fats text,
  carbohydrates text,
  sugars text,
  fibre text,
  proteins text,
  salt text,
  odor text,
  appearance text,
  taste_profile text,
  shelf_life text,
  storage_conditions text,
  storage_after_opening text,
  microbiological_count text,
  gmo_declaration text,
  ionising_radiation text,
  compliance_references text,
  allergen_gluten boolean DEFAULT false,
  allergen_crustaceans boolean DEFAULT false,
  allergen_eggs boolean DEFAULT false,
  allergen_fish boolean DEFAULT false,
  allergen_peanuts boolean DEFAULT false,
  allergen_soybeans boolean DEFAULT false,
  allergen_milk boolean DEFAULT false,
  allergen_nuts boolean DEFAULT false,
  allergen_celery boolean DEFAULT false,
  allergen_mustard boolean DEFAULT false,
  allergen_sesame boolean DEFAULT false,
  allergen_sulphites boolean DEFAULT false,
  allergen_lupin boolean DEFAULT false,
  allergen_molluscs boolean DEFAULT false
);

-- Create product_ean_codes table
CREATE TABLE public.product_ean_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  market text NOT NULL,
  ean_cocktail text,
  ean_carton text,
  UNIQUE(product_id, market)
);

-- Create product_serve_moments table
CREATE TABLE public.product_serve_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  occasion text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  background_color text DEFAULT '#1a1a1a',
  emoji text DEFAULT '✦',
  sort_order integer DEFAULT 0
);

-- Create product_ai_pairings table
CREATE TABLE public.product_ai_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  subtitle text,
  emoji text DEFAULT '✦',
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- Create tech_sheet_uploads table
CREATE TABLE public.tech_sheet_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending',
  extracted_json jsonb,
  applied_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_composition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_technical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ean_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serve_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ai_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_sheet_uploads ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read translations" ON public.product_translations FOR SELECT USING (true);
CREATE POLICY "Public read composition" ON public.product_composition FOR SELECT USING (true);
CREATE POLICY "Public read technical_data" ON public.product_technical_data FOR SELECT USING (true);
CREATE POLICY "Public read ean_codes" ON public.product_ean_codes FOR SELECT USING (true);
CREATE POLICY "Public read serve_moments" ON public.product_serve_moments FOR SELECT USING (true);
CREATE POLICY "Public read ai_pairings" ON public.product_ai_pairings FOR SELECT USING (true);

-- Authenticated write policies
CREATE POLICY "Auth insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert translations" ON public.product_translations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update translations" ON public.product_translations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete translations" ON public.product_translations FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert composition" ON public.product_composition FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update composition" ON public.product_composition FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete composition" ON public.product_composition FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert technical_data" ON public.product_technical_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update technical_data" ON public.product_technical_data FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete technical_data" ON public.product_technical_data FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert ean_codes" ON public.product_ean_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ean_codes" ON public.product_ean_codes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete ean_codes" ON public.product_ean_codes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert serve_moments" ON public.product_serve_moments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update serve_moments" ON public.product_serve_moments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete serve_moments" ON public.product_serve_moments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert ai_pairings" ON public.product_ai_pairings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ai_pairings" ON public.product_ai_pairings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete ai_pairings" ON public.product_ai_pairings FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert tech_sheets" ON public.tech_sheet_uploads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tech_sheets" ON public.tech_sheet_uploads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete tech_sheets" ON public.tech_sheet_uploads FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth read tech_sheets" ON public.tech_sheet_uploads FOR SELECT TO authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 12 products
INSERT INTO public.products (slug, name, line, abv, ean_int, serving, spirit, garnish, glass, ice, flavour, liquid_color, food_pairing, occasion, uk_units, allergens_summary, bottle_color, label_color, hero_bg, completeness) VALUES
('negroni', 'Negroni', 'Classic', '21.4', '8057461710001', '200ml · 2 × 100ml', 'The Botanist Gin + Mancino Vermouth', 'Orange slice', 'Tumbler Basso', 'Cubo', 'Bitter', 'Red/Ruby', 'Aged Cheese + Salumi', 'Aperitivo', '4.3', 'Contains Sulphites', '#8b1a1a', '#f5f0ea', '#f0e8e0', 88),
('cosmopolitan', 'Cosmopolitan', 'Classic', '28.4', '8057461710049', '200ml · 2 × 100ml', 'Vodka Altamura + Cointreau', 'Orange twist', 'Tumbler Basso', 'Cubo', 'Sweet', 'Pink', 'Dessert Fruttati', 'Aperitivo · After Dinner', '5.7', 'None', '#c06080', '#f5f0ea', '#f0e8ee', 82),
('espresso-martini', 'Espresso Martini', 'Classic', '22.2', '8057461710087', '200ml · 2 × 100ml', 'Vodka Altamura + Fair Coffee Liqueur', '3 coffee beans', 'Tumbler Basso', 'Cubo', 'Sweet · Coffee', 'Dark Brown', 'Chocolate Desserts', 'After Dinner', '4.4', 'None', '#1a1208', '#f5f0ea', '#f0ede8', 70),
('daiquiri', 'Daiquiri', 'Classic', '21.5', '8057461710124', '200ml · 2 × 100ml', 'Mount Gay Rum', 'Lime wheel', 'Tumbler Basso', 'Cubo', 'Sweet · Citrus', 'Light Brown', 'Frutta Tropicale', 'Aperitivo', '4.3', 'None', '#5a3010', '#f5f0ea', '#f5ede0', 85),
('margarita', 'Margarita', 'Classic', '26', '8057461710162', '200ml · 2 × 100ml', 'Tequiero Tequila + Cointreau', 'Lime wheel', 'Tumbler Basso', 'Cubo', 'Sour', 'Transparent', 'Guacamole · Fish Tacos', 'Aperitivo · Party', '5.2', 'None', '#3a5c14', '#f5f0ea', '#e8f0e0', 83),
('pornstar-martini', 'Pornstar Martini', 'Classic', '19.4', '8057461710568', '200ml · 2 × 100ml', 'Belvedere Vodka', 'None', 'Coupe Glass', 'None', 'Sweet · Tropical', 'Yellow', 'Dessert', 'After Dinner', '', 'None', '#c0a020', '#f5f0ea', '#f5f0e0', 55),
('paper-plane', 'Paper Plane', 'Classic', '20', '8057461710209', '200ml · 2 × 100ml', 'Evan Williams Bourbon', 'Lemon twist', 'Tumbler Basso', 'Cubo', 'Bitter · Sour', 'Orange/Amber', 'Cheesecake · Citrus Desserts', 'Aperitivo · After Dinner', '4.0', 'None', '#8b4010', '#f5f0ea', '#f5ece0', 60),
('penicillin', 'Penicillin', 'Classic', '22', '', '200ml · 2 × 100ml', 'Evan Williams Bourbon + Bruichladdich Whisky', 'Candied ginger', 'Tumbler Basso', 'Cubo', 'Smoky · Honey', 'Amber', 'Smoked Salmon Crostini', 'Evening', '4.4', 'None', '#5a3a08', '#f5f0ea', '#f0ebe0', 65),
('spicy-paloma', 'Spicy Paloma', 'Sparkling', '15.2', '8057461710247', '200ml · Single Serving', 'Bes Gin', 'Chilli + lime', 'Collins', 'Listella', 'Sour · Spicy', 'Pink', 'Seafood', 'Aperitif', '3.0', 'None', '#8b2a4a', '#f5f0ea', '#f5e8ee', 72),
('spritz', 'Spritz', 'Sparkling', '10.7', '8057461710285', '200ml · Single Serving', 'Vetz Superior Aperitif', 'Orange slice', 'Collins', 'Listella', 'Bitter · Citrus', 'Orange', 'Salumi e Formaggi', 'Aperitif', '2.1', 'Contains Sulphites', '#c06010', '#f5f0ea', '#f5ede0', 80),
('no-regrets-negroni', 'No Regrets Negroni', 'No Regrets', '0.0', '8057461710360', '200ml · 2 × 100ml', 'Volo Bitter Zero', 'Orange slice', 'Tumbler', 'Cubo XL', 'Bitter', 'Orange', 'Salumi e Formaggi', 'Aperitivo', '', 'Contains Sulphites', '#2a3a1a', '#f5f0ea', '#eaede5', 75),
('no-regrets-moment', 'No Regrets Moment', 'No Regrets', '0.0', '8057461710407', '200ml · 2 × 100ml', 'Shumi Reishi Extract', 'Ginger slice', 'Tumbler', 'Cubo XL', 'Sweet & Sour', 'Magenta', 'Healthy Food · All Occasions', 'All Day', '', 'None', '#2a5c2a', '#f5f0ea', '#e8f0e4', 96);

-- Seed translations for Negroni
INSERT INTO public.product_translations (product_id, language, claim, sensory_description, ingredient_list_short, ingredient_list_full, allergens_local)
SELECT id, 'EN',
  E'AN ADVENTUROUS EARL, FLORENCE, THE VERMOUTH HOUR.\nGENUINELY ITALIAN.',
  'Three ingredients. One perfect balance. The Botanist Gin, Mancino Vermouth and Rinomato Bitter — in equal parts, meeting in perfect harmony. Served over ice with an orange twist, every sip is pure character. The Negroni doesn''t accompany the evening. It dominates it.',
  'THE BOTANIST GIN, MANCINO VERMOUTH, RINOMATO BITTER, ANGOSTURA BITTER',
  'The Botanist Gin 20%, Mancino Vermouth (vino italiano trebbiano IGP, zucchero, alcool, aromi naturali) 25%, Rinomato Bitter Scuro Liquore 35%, Angostura Bitter Aromatico (acqua, alcool, spezie, aromi naturali, zucchero, colorante: caramello E150a) 0.5%, Acqua. Contains Sulphites.',
  'Contains Sulphites'
FROM public.products WHERE slug = 'negroni';

INSERT INTO public.product_translations (product_id, language, claim, sensory_description, ingredient_list_short, ingredient_list_full, allergens_local)
SELECT id, 'IT',
  E'UN CONTE DALLA VITA AVVENTUROSA, FIRENZE, L''ORA DEL VERMOUTH.\nAUTENTICAMENTE ITALIANO.',
  'Il nostro Negroni è una vera e propria icona. Tre ingredienti in parti uguali: Gin The Botanist, Vermouth rosso Mancino, e Mancino Rinomato Bitter. Dolceamaro, aromatico, un equilibrio perfetto che conquista al primo sorso. Che tu sia esperto o alle prime armi, il Negroni non accompagna: domina.',
  'THE BOTANIST GIN, MANCINO VERMOUTH, MANCINO RINOMATO, ANGOSTURA BITTER',
  'The Botanist Gin 20%, Mancino Vermouth (vino italiano trebbiano IGP, zucchero, alcool, aromi naturali) 25%, Rinomato Bitter Scuro Liquore 35%, Angostura Bitter Aromatico (acqua, alcool, spezie, aromi naturali, zucchero, colorante: caramello E150a) 0,5%, Acqua. Contiene Solfiti.',
  'Contiene Solfiti'
FROM public.products WHERE slug = 'negroni';

-- Seed translations for No Regrets Moment
INSERT INTO public.product_translations (product_id, language, claim, sensory_description, ingredient_list_short, ingredient_list_full, allergens_local)
SELECT id, 'EN',
  E'PHILOSOPHER''S STONE, ELIXIR OF LONG LIFE,\nALCHEMISTS SEEKING ETERNAL LIFE.\nGENUINELY HEALTHY.',
  'Crafted for those who take care of themselves. No Regrets Moment reinvents the aperitivo as a genuinely healthy, alcohol-free experience. Fresh, aromatic, uplifting — it accompanies every moment of the day. Made with Shumi Reishi Extract, Aronia, Cranberry and Ginger.',
  'SHUMI REISHI EXTRACT, SUPASAWA, KORO GINGER JUICE, KORO ARONIA JUICE, KORO BLUEBERRY JUICE',
  'Homogenized plant extract (water, microfiltered sea water, sulphurous water, aronia berries*, cranberry fruits*, olive leaves*, currant fruits*, licorice root*, Reishi mushroom*), juices of: date, aronia, cranberry, ginger, lemon, Reishi mushroom extract*°, emulsifiers: sunflower lecithin*, inulin, citrus and psyllium fibres, acidifiers: malic acid, preservatives: natural glycolipids from Dacroyopinax spathularia, potassium sorbate, sodium benzoate. *Organic.',
  'No allergens declared'
FROM public.products WHERE slug = 'no-regrets-moment';

INSERT INTO public.product_translations (product_id, language, claim, sensory_description, ingredient_list_short, ingredient_list_full, allergens_local)
SELECT id, 'IT',
  E'PIETRA FILOSOFALE, ELISIR DI LUNGA VITA;\nALCHIMISTI IN CERCA DELLA VITA ETERNA.\nAUTENTICAMENTE RIGENERANTE.',
  'Pensato per chi ama prendersi cura di sé, No Regrets Moment reinventa l''aperitivo in versione analcolica e healthy. Fresco, aromatico e spensierato, accompagna ogni momento della giornata. Realizzato con Estratto di Reishi Shumi, Aronia, Mirtillo Rosso e Zenzero.',
  'ESTRATTO DI REISHI SHUMI, SUPASAWA, KORO SUCCO DI ZENZERO, KORO SUCCO DI ARONIA, KORO SUCCO DI MIRTILLO',
  'Estratto vegetale omogenizzato (acqua, acqua di mare microfiltrata, acqua solforosa, bacche di aronia*, frutti di mirtillo rosso*, foglie di oliva*, frutti di ribes*, radice di liquorizia*, fungo Reishi*), succhi di: dattero, aronia, mirtillo rosso, zenzero, limone, estratto di fungo Reishi*°. *Biologico.',
  'Nessun allergene dichiarato'
FROM public.products WHERE slug = 'no-regrets-moment';

-- Seed composition for Negroni
INSERT INTO public.product_composition (product_id, ingredient_name, percentage, color, sort_order)
SELECT id, 'The Botanist Gin', 20, '#8b6914', 0 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Mancino Vermouth', 25, '#c04040', 1 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Rinomato Bitter', 35, '#2a2a2a', 2 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Angostura + Acqua', 20, '#d4b97c', 3 FROM public.products WHERE slug = 'negroni';

-- Seed composition for No Regrets Moment
INSERT INTO public.product_composition (product_id, ingredient_name, percentage, color, sort_order)
SELECT id, 'Reishi Extract', 30, '#2a5c2a', 0 FROM public.products WHERE slug = 'no-regrets-moment'
UNION ALL SELECT id, 'Aronia + Cranberry', 28, '#8b2a4a', 1 FROM public.products WHERE slug = 'no-regrets-moment'
UNION ALL SELECT id, 'Ginger Juice', 22, '#b8975a', 2 FROM public.products WHERE slug = 'no-regrets-moment'
UNION ALL SELECT id, 'Blueberry + Acqua', 20, '#4a5c8c', 3 FROM public.products WHERE slug = 'no-regrets-moment';

-- Seed technical data for No Regrets Moment
INSERT INTO public.product_technical_data (product_id, ph, brix, energy_kj, energy_kcal, fats, saturated_fats, carbohydrates, sugars, fibre, proteins, salt, odor, appearance, taste_profile, shelf_life, storage_conditions, storage_after_opening, microbiological_count, gmo_declaration, ionising_radiation, compliance_references)
SELECT id, '3.9', '8.8', '147', '35', '<0.1g', '<0.1g', '9.1g', '9.1g', '0.3g', '<0.1g', '0.16g',
  'Warm, herbal and fruity', 'Magenta liquid', 'Layered sweet and sour, with tart notes and hints of ginger',
  '12 months from production batch date', 'Below 20°C, protected from sunlight',
  'Close tightly after opening and store at 4°C. Shake well before use.',
  '<1 UFC/g', 'GMO-Free — EC No 1829/2003 & 1830/2003',
  'Not treated. No irradiated ingredients.',
  'EU Reg. 231/2012 · EU Reg. 1333/2008/EC · Flavouring Reg. 1334/2008/EC'
FROM public.products WHERE slug = 'no-regrets-moment';

-- Seed serve moments for Negroni
INSERT INTO public.product_serve_moments (product_id, occasion, title, description, background_color, emoji, sort_order)
SELECT id, 'Aperitivo', 'Golden Hour', 'Serve over a large ice cube with an orange twist. The ritual begins.', '#1a0808', '🍊', 0 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'After Dinner', 'Late Night Character', 'Bold enough to close the evening on its own terms.', '#0d0505', '🌙', 1 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Occasions', 'Made to Share', 'Two cocktails per bottle. One for you, one for the moment.', '#2a1010', '✦', 2 FROM public.products WHERE slug = 'negroni';

-- Seed AI pairings for Negroni
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order)
SELECT id, 'Aged Pecorino', 'Sheep milk · DOP', '🧀', true, 0 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Salumi Toscani', 'Charcuterie selection', '🥩', false, 1 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Dark Chocolate', '70% cacao · bitter', '🍫', false, 2 FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'Olive Ascolane', 'Stuffed · crispy', '🫒', false, 3 FROM public.products WHERE slug = 'negroni';

-- Seed EAN codes for Negroni
INSERT INTO public.product_ean_codes (product_id, market, ean_cocktail)
SELECT id, 'INT', '8057461710001' FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'DE', '8057461710025' FROM public.products WHERE slug = 'negroni'
UNION ALL SELECT id, 'FR', '8057461710032' FROM public.products WHERE slug = 'negroni';