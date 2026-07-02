-- Populate glass/ice/garnish/flavour on all existing product_translations rows.
-- Mappings are derived from the raw product field values (mix of Italian & English).
-- EN rows get English equivalents; IT rows get clean Italian; FR/DE get local terms.
-- Falls back to initcap(trimmed raw value) for any unrecognised string.
-- Only touches rows where ALL four fields are still NULL (safe to re-run).

UPDATE public.product_translations pt
SET
  -- ── GLASS ─────────────────────────────────────────────────────────────────
  glass = CASE lower(trim(p.glass))
    WHEN 'tumbler basso' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Tumbler Basso'
        WHEN 'FR' THEN 'Verre Bas'
        WHEN 'DE' THEN 'Kurzer Tumbler'
        ELSE 'Low Ball'          -- EN + fallback
      END
    WHEN 'collins' THEN 'Collins'
    WHEN 'tumbler' THEN 'Tumbler'
    WHEN 'coupe glass' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Calice'
        WHEN 'FR' THEN 'Coupe'
        WHEN 'DE' THEN 'Cocktailglas'
        ELSE 'Coupe'
      END
    ELSE initcap(trim(p.glass))
  END,

  -- ── ICE ───────────────────────────────────────────────────────────────────
  ice = CASE lower(trim(p.ice))
    WHEN 'cubo' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Cubo'
        WHEN 'FR' THEN 'Glaçon'
        WHEN 'DE' THEN 'Eiswürfel'
        ELSE 'Cube'
      END
    WHEN 'cubo xl' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Cubo XL'
        WHEN 'FR' THEN 'Grand Glaçon'
        WHEN 'DE' THEN 'Großer Eiswürfel'
        ELSE 'XL Cube'
      END
    WHEN 'xl cube' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Cubo XL'
        WHEN 'FR' THEN 'Grand Glaçon'
        WHEN 'DE' THEN 'Großer Eiswürfel'
        ELSE 'XL Cube'
      END
    WHEN 'stick xl' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Stecca XL'
        WHEN 'FR' THEN 'Bâton XL'
        WHEN 'DE' THEN 'XL-Eisstab'
        ELSE 'XL Stick'
      END
    WHEN 'xl stick' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Stecca XL'
        WHEN 'FR' THEN 'Bâton XL'
        WHEN 'DE' THEN 'XL-Eisstab'
        ELSE 'XL Stick'
      END
    WHEN 'listella' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Listella'
        WHEN 'FR' THEN 'Lance de glace'
        WHEN 'DE' THEN 'Eisstab'
        ELSE 'Ice Spear'
      END
    WHEN 'none' THEN NULL
    ELSE initcap(trim(p.ice))
  END,

  -- ── GARNISH ───────────────────────────────────────────────────────────────
  garnish = CASE lower(trim(p.garnish))
    WHEN 'orange' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Arancia'
        WHEN 'FR' THEN 'Orange'
        WHEN 'DE' THEN 'Orange'
        ELSE 'Orange'
      END
    WHEN 'orange slice' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Fetta d''arancia'
        WHEN 'FR' THEN 'Tranche d''orange'
        WHEN 'DE' THEN 'Orangenscheibe'
        ELSE 'Orange slice'
      END
    WHEN 'orange twist' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Twist d''arancia'
        WHEN 'FR' THEN 'Zeste d''orange'
        WHEN 'DE' THEN 'Orangenzeste'
        ELSE 'Orange twist'
      END
    WHEN 'orange peel' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Scorza d''arancia'
        WHEN 'FR' THEN 'Zeste d''orange'
        WHEN 'DE' THEN 'Orangenschale'
        ELSE 'Orange peel'
      END
    WHEN 'lime' THEN 'Lime'
    WHEN 'lime wheel' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Rotella di lime'
        WHEN 'FR' THEN 'Rondelle de citron vert'
        WHEN 'DE' THEN 'Limettenscheibe'
        ELSE 'Lime wheel'
      END
    WHEN '3 coffee beans' THEN
      CASE pt.language
        WHEN 'IT' THEN '3 chicchi di caffè'
        WHEN 'FR' THEN '3 grains de café'
        WHEN 'DE' THEN '3 Kaffeebohnen'
        ELSE '3 coffee beans'
      END
    WHEN 'red chilli pepper' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Peperoncino rosso'
        WHEN 'FR' THEN 'Piment rouge'
        WHEN 'DE' THEN 'Rote Chilischote'
        ELSE 'Red chilli pepper'
      END
    WHEN 'ginger slice' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Fetta di zenzero'
        WHEN 'FR' THEN 'Tranche de gingembre'
        WHEN 'DE' THEN 'Ingwerscheibe'
        ELSE 'Ginger slice'
      END
    WHEN 'lemon twist' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Twist di limone'
        WHEN 'FR' THEN 'Zeste de citron'
        WHEN 'DE' THEN 'Zitronenzeste'
        ELSE 'Lemon twist'
      END
    WHEN 'candied ginger' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Zenzero candito'
        WHEN 'FR' THEN 'Gingembre confit'
        WHEN 'DE' THEN 'Kandierter Ingwer'
        ELSE 'Candied ginger'
      END
    WHEN 'chilli + lime' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Peperoncino + lime'
        WHEN 'FR' THEN 'Piment + citron vert'
        WHEN 'DE' THEN 'Chili + Limette'
        ELSE 'Chilli + lime'
      END
    WHEN 'none' THEN NULL
    ELSE initcap(trim(p.garnish))
  END,

  -- ── FLAVOUR ───────────────────────────────────────────────────────────────
  flavour = CASE lower(trim(p.flavour))
    WHEN 'bitter' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Amaro'
        WHEN 'FR' THEN 'Amer'
        WHEN 'DE' THEN 'Bitter'
        ELSE 'Bitter'
      END
    WHEN 'sweet' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Dolce'
        WHEN 'FR' THEN 'Sucré'
        WHEN 'DE' THEN 'Süß'
        ELSE 'Sweet'
      END
    WHEN 'sweet · citrus' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Dolce · Agrumato'
        WHEN 'FR' THEN 'Sucré · Agrumes'
        WHEN 'DE' THEN 'Süß · Zitrus'
        ELSE 'Sweet · Citrus'
      END
    WHEN 'sweet · coffee' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Dolce · Caffè'
        WHEN 'FR' THEN 'Sucré · Café'
        WHEN 'DE' THEN 'Süß · Kaffee'
        ELSE 'Sweet · Coffee'
      END
    WHEN 'sweet · tropical' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Dolce · Tropicale'
        WHEN 'FR' THEN 'Sucré · Tropical'
        WHEN 'DE' THEN 'Süß · Tropisch'
        ELSE 'Sweet · Tropical'
      END
    WHEN 'sweet & sour' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Dolce & Acido'
        WHEN 'FR' THEN 'Sucré & Aigre'
        WHEN 'DE' THEN 'Süß & Sauer'
        ELSE 'Sweet & Sour'
      END
    WHEN 'sour' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Acido'
        WHEN 'FR' THEN 'Aigre'
        WHEN 'DE' THEN 'Sauer'
        ELSE 'Sour'
      END
    WHEN 'sour & sweet' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Acido & Dolce'
        WHEN 'FR' THEN 'Aigre & Sucré'
        WHEN 'DE' THEN 'Sauer & Süß'
        ELSE 'Sour & Sweet'
      END
    WHEN 'sour · spicy' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Acido · Piccante'
        WHEN 'FR' THEN 'Aigre · Épicé'
        WHEN 'DE' THEN 'Sauer · Scharf'
        ELSE 'Sour · Spicy'
      END
    WHEN 'spicy' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Piccante'
        WHEN 'FR' THEN 'Épicé'
        WHEN 'DE' THEN 'Scharf'
        ELSE 'Spicy'
      END
    WHEN 'fresh, citrus, bitter' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Fresco, Agrumato, Amaro'
        WHEN 'FR' THEN 'Frais, Agrumes, Amer'
        WHEN 'DE' THEN 'Frisch, Zitrus, Bitter'
        ELSE 'Fresh, Citrus, Bitter'
      END
    WHEN 'bitter · sour' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Amaro · Acido'
        WHEN 'FR' THEN 'Amer · Aigre'
        WHEN 'DE' THEN 'Bitter · Sauer'
        ELSE 'Bitter · Sour'
      END
    WHEN 'bitter · citrus' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Amaro · Agrumato'
        WHEN 'FR' THEN 'Amer · Agrumes'
        WHEN 'DE' THEN 'Bitter · Zitrus'
        ELSE 'Bitter · Citrus'
      END
    WHEN 'smoky · honey' THEN
      CASE pt.language
        WHEN 'IT' THEN 'Affumicato · Miele'
        WHEN 'FR' THEN 'Fumé · Miel'
        WHEN 'DE' THEN 'Rauchig · Honig'
        ELSE 'Smoky · Honey'
      END
    WHEN 'none' THEN NULL
    ELSE initcap(trim(p.flavour))
  END

FROM public.products p
WHERE pt.product_id = p.id
  AND (p.glass IS NOT NULL OR p.ice IS NOT NULL OR p.garnish IS NOT NULL OR p.flavour IS NOT NULL)
  AND (pt.glass IS NULL AND pt.ice IS NULL AND pt.garnish IS NULL AND pt.flavour IS NULL);
