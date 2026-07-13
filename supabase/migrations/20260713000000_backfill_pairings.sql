-- Backfill product_ai_pairings from products.food_pairing for products
-- that have a pairing note but no cards yet. Grammar-cleaned, split into
-- cards, with IT/FR/DE translations. Idempotent: each product's INSERT is
-- skipped entirely if that product already has any pairing card, so curated
-- cards (Negroni, Cosmopolitan, Daiquiri, Doge's Tipple, etc.) are never touched.

-- americano (3 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🫓', 'Warm Focaccia', 'Soft · fragrant', true, 0, '{"IT": {"name": "Focaccia Calda", "subtitle": "Morbida · fragrante"}, "FR": {"name": "Focaccia Chaude", "subtitle": "Moelleuse · parfumée"}, "DE": {"name": "Warme Focaccia", "subtitle": "Weich · aromatisch"}}'::jsonb),
    ('🥩', 'Mortadella', 'Silky · classic', false, 1, '{"IT": {"name": "Mortadella", "subtitle": "Vellutata · classica"}, "FR": {"name": "Mortadelle", "subtitle": "Onctueuse · classique"}, "DE": {"name": "Mortadella", "subtitle": "Zart · klassisch"}}'::jsonb),
    ('🥓', 'Italian Cured Meats', 'Salumi · selection', false, 2, '{"IT": {"name": "Salumi Italiani", "subtitle": "Salumi · selezione"}, "FR": {"name": "Charcuterie Italienne", "subtitle": "Charcuterie · sélection"}, "DE": {"name": "Italienische Aufschnitte", "subtitle": "Salumi · Auswahl"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'americano'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- diciotto-buche (4 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🦪', 'Oysters', 'Briny · fresh', true, 0, '{"IT": {"name": "Ostriche", "subtitle": "Sapide · fresche"}, "FR": {"name": "Huîtres", "subtitle": "Iodées · fraîches"}, "DE": {"name": "Austern", "subtitle": "Salzig · frisch"}}'::jsonb),
    ('🐟', 'Seafood Crudo', 'Raw · delicate', false, 1, '{"IT": {"name": "Crudo di Mare", "subtitle": "Crudo · delicato"}, "FR": {"name": "Crudo de Mer", "subtitle": "Cru · délicat"}, "DE": {"name": "Meeresfrüchte-Crudo", "subtitle": "Roh · zart"}}'::jsonb),
    ('🍣', 'Tuna Tartare', 'Fresh · citrus', false, 2, '{"IT": {"name": "Tartare di Tonno", "subtitle": "Fresca · agrumata"}, "FR": {"name": "Tartare de Thon", "subtitle": "Frais · agrumes"}, "DE": {"name": "Thunfisch-Tatar", "subtitle": "Frisch · Zitrus"}}'::jsonb),
    ('🦐', 'Grilled Prawns', 'Charred · sweet', false, 3, '{"IT": {"name": "Gamberi alla Griglia", "subtitle": "Grigliati · dolci"}, "FR": {"name": "Gambas Grillées", "subtitle": "Grillées · douces"}, "DE": {"name": "Gegrillte Garnelen", "subtitle": "Gegrillt · süß"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'diciotto-buche'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- espresso-martini (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🍫', 'Chocolate Desserts', 'Rich · decadent', true, 0, '{"IT": {"name": "Dolci al Cioccolato", "subtitle": "Ricchi · golosi"}, "FR": {"name": "Desserts au Chocolat", "subtitle": "Riches · gourmands"}, "DE": {"name": "Schokoladendesserts", "subtitle": "Reichhaltig · dekadent"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'espresso-martini'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- lobster-coaster (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🦞', 'Lobster Roll', 'Buttery · coastal', true, 0, '{"IT": {"name": "Panino all''Aragosta", "subtitle": "Burroso · marino"}, "FR": {"name": "Roll de Homard", "subtitle": "Beurré · iodé"}, "DE": {"name": "Hummer-Roll", "subtitle": "Buttrig · maritim"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'lobster-coaster'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- lost-in-venice (4 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🦐', 'Citrus-Marinated Prawns', 'Zesty · fresh', true, 0, '{"IT": {"name": "Gamberi Marinati agli Agrumi", "subtitle": "Agrumati · freschi"}, "FR": {"name": "Gambas Marinées aux Agrumes", "subtitle": "Acidulées · fraîches"}, "DE": {"name": "Zitrus-Marinierte Garnelen", "subtitle": "Zitrus · frisch"}}'::jsonb),
    ('🍢', 'Venetian Cicchetti', 'Assorted · small bites', false, 1, '{"IT": {"name": "Cicchetti Veneziani", "subtitle": "Assortiti · stuzzichini"}, "FR": {"name": "Cicchetti Vénitiens", "subtitle": "Assortis · bouchées"}, "DE": {"name": "Venezianische Cicchetti", "subtitle": "Sortiert · Häppchen"}}'::jsonb),
    ('🍣', 'Tuna Tartare', 'Fresh · citrus', false, 2, '{"IT": {"name": "Tartare di Tonno", "subtitle": "Fresca · agrumata"}, "FR": {"name": "Tartare de Thon", "subtitle": "Frais · agrumes"}, "DE": {"name": "Thunfisch-Tatar", "subtitle": "Frisch · Zitrus"}}'::jsonb),
    ('🦞', 'Lobster Roll', 'Buttery · coastal', false, 3, '{"IT": {"name": "Panino all''Aragosta", "subtitle": "Burroso · marino"}, "FR": {"name": "Roll de Homard", "subtitle": "Beurré · iodé"}, "DE": {"name": "Hummer-Roll", "subtitle": "Buttrig · maritim"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'lost-in-venice'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- margarita (2 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🥑', 'Guacamole', 'Creamy · zesty', true, 0, '{"IT": {"name": "Guacamole", "subtitle": "Cremoso · agrumato"}, "FR": {"name": "Guacamole", "subtitle": "Crémeux · relevé"}, "DE": {"name": "Guacamole", "subtitle": "Cremig · würzig"}}'::jsonb),
    ('🌮', 'Fish Tacos', 'Fresh · zesty', false, 1, '{"IT": {"name": "Tacos di Pesce", "subtitle": "Freschi · sfiziosi"}, "FR": {"name": "Tacos de Poisson", "subtitle": "Frais · relevés"}, "DE": {"name": "Fisch-Tacos", "subtitle": "Frisch · würzig"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'margarita'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- milano-modena (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🧀', 'Aged Cheese', 'Mature · savoury', true, 0, '{"IT": {"name": "Formaggi Stagionati", "subtitle": "Stagionati · saporiti"}, "FR": {"name": "Fromages Affinés", "subtitle": "Affinés · savoureux"}, "DE": {"name": "Gereifter Käse", "subtitle": "Gereift · herzhaft"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'milano-modena'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- negroni-1605 (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🧀', 'Aged Cheeses', 'Mature · complex', true, 0, '{"IT": {"name": "Formaggi Stagionati", "subtitle": "Stagionati · complessi"}, "FR": {"name": "Fromages Affinés", "subtitle": "Affinés · complexes"}, "DE": {"name": "Gereifter Käse", "subtitle": "Gereift · komplex"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'negroni-1605'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- no-regrets-moment (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🥗', 'Healthy Bites', 'Light · wholesome', true, 0, '{"IT": {"name": "Piatti Leggeri", "subtitle": "Leggeri · sani"}, "FR": {"name": "Plats Sains", "subtitle": "Légers · sains"}, "DE": {"name": "Gesunde Häppchen", "subtitle": "Leicht · vollwertig"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'no-regrets-moment'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- no-regrets-negroni (2 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🥓', 'Cured Meats', 'Salumi · selection', true, 0, '{"IT": {"name": "Salumi", "subtitle": "Salumi · selezione"}, "FR": {"name": "Charcuterie", "subtitle": "Charcuterie · sélection"}, "DE": {"name": "Aufschnitt", "subtitle": "Salumi · Auswahl"}}'::jsonb),
    ('🧀', 'Cheeses', 'Aged · savoury', false, 1, '{"IT": {"name": "Formaggi", "subtitle": "Stagionati · saporiti"}, "FR": {"name": "Fromages", "subtitle": "Affinés · savoureux"}, "DE": {"name": "Käse", "subtitle": "Gereift · herzhaft"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'no-regrets-negroni'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- paper-plane (2 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🍰', 'Cheesecake', 'Creamy · sweet', true, 0, '{"IT": {"name": "Cheesecake", "subtitle": "Cremosa · dolce"}, "FR": {"name": "Cheesecake", "subtitle": "Crémeux · sucré"}, "DE": {"name": "Käsekuchen", "subtitle": "Cremig · süß"}}'::jsonb),
    ('🍋', 'Citrus Desserts', 'Zesty · bright', false, 1, '{"IT": {"name": "Dolci agli Agrumi", "subtitle": "Agrumati · freschi"}, "FR": {"name": "Desserts aux Agrumes", "subtitle": "Acidulés · frais"}, "DE": {"name": "Zitrusdesserts", "subtitle": "Zitrus · frisch"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'paper-plane'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- penicillin (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🐟', 'Smoked Salmon Crostini', 'Smoky · delicate', true, 0, '{"IT": {"name": "Crostini al Salmone Affumicato", "subtitle": "Affumicati · delicati"}, "FR": {"name": "Crostini au Saumon Fumé", "subtitle": "Fumés · délicats"}, "DE": {"name": "Räucherlachs-Crostini", "subtitle": "Rauchig · zart"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'penicillin'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- pornstar-martini (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🍮', 'Desserts', 'Sweet · indulgent', true, 0, '{"IT": {"name": "Dolci", "subtitle": "Dolci · golosi"}, "FR": {"name": "Desserts", "subtitle": "Sucrés · gourmands"}, "DE": {"name": "Desserts", "subtitle": "Süß · verführerisch"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'pornstar-martini'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- spicy-paloma (1 card)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🦐', 'Seafood', 'Fresh · grilled', true, 0, '{"IT": {"name": "Frutti di Mare", "subtitle": "Freschi · grigliati"}, "FR": {"name": "Fruits de Mer", "subtitle": "Frais · grillés"}, "DE": {"name": "Meeresfrüchte", "subtitle": "Frisch · gegrillt"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'spicy-paloma'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);

-- spritz (2 cards)
INSERT INTO public.product_ai_pairings (product_id, name, subtitle, emoji, is_featured, sort_order, translations)
SELECT p.id, v.name, v.subtitle, v.emoji, v.is_featured, v.sort_order, v.translations
FROM public.products p
CROSS JOIN (VALUES
    ('🥓', 'Cured Meats', 'Salumi · selection', true, 0, '{"IT": {"name": "Salumi", "subtitle": "Salumi · selezione"}, "FR": {"name": "Charcuterie", "subtitle": "Charcuterie · sélection"}, "DE": {"name": "Aufschnitt", "subtitle": "Salumi · Auswahl"}}'::jsonb),
    ('🧀', 'Cheeses', 'Aged · savoury', false, 1, '{"IT": {"name": "Formaggi", "subtitle": "Stagionati · saporiti"}, "FR": {"name": "Fromages", "subtitle": "Affinés · savoureux"}, "DE": {"name": "Käse", "subtitle": "Gereift · herzhaft"}}'::jsonb)
) AS v(emoji, name, subtitle, is_featured, sort_order, translations)
WHERE p.slug = 'spritz'
  AND NOT EXISTS (SELECT 1 FROM public.product_ai_pairings x WHERE x.product_id = p.id);
