import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useProduct,
  useProducts,
  useProductTranslations,
  useProductTechnicalData,
  useProductEanCodes,
} from '@/hooks/useProduct';
import { useProductImages, useApprovedBrandImages } from '@/hooks/useImages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

function getCompletenessColor(val: number) {
  if (val < 40) return '#a04040';
  if (val < 70) return '#c09040';
  if (val < 85) return '#b8975a';
  return '#4a8c5c';
}

function getLineBadge(line: string) {
  const styles: Record<string, string> = {
    Classic: 'bg-[#b8975a]/15 text-[#b8975a]',
    Sparkling: 'bg-[#4a7cc0]/15 text-[#6a9ce0]',
    'No Regrets': 'bg-[#4a8c5c]/15 text-[#5aac6c]',
  };
  return styles[line] || styles.Classic;
}

function Badge({ type }: { type: 'STICKER' | 'WEBSITE' | 'BOTTLE' }) {
  const colors = {
    STICKER: 'bg-amber-500/20 text-amber-400',
    WEBSITE: 'bg-blue-500/20 text-blue-400',
    BOTTLE: 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[type]}`}>
      {type}
    </span>
  );
}

const ALLERGENS = [
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
] as const;

const MARKETS = ['INT', 'IT', 'DE', 'FR', 'UK'] as const;

// ─── General Info Tab ───
function GeneralTab({ product, onSave }: { product: any; onSave: () => void }) {
  const [form, setForm] = useState({ ...product });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...product }); }, [product]);

  const set = (key: string, val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('products').update({
      line: form.line,
      spirit: form.spirit,
      abv: form.abv,
      serving: form.serving,
      garnish: form.garnish,
      glass: form.glass,
      ice: form.ice,
      flavour: form.flavour,
      food_pairing: form.food_pairing,
      occasion: form.occasion,
      uk_units: form.uk_units,
      allergens_summary: form.allergens_summary,
      hero_bg: form.hero_bg,
      bottle_color: form.bottle_color,
      product_link: form.product_link || null,
    }).eq('id', product.id);
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Product updated');
    onSave();
  };

  const fields: { key: string; label: string; badges: ('STICKER' | 'WEBSITE' | 'BOTTLE')[] }[] = [
    { key: 'spirit', label: 'Spirit', badges: ['STICKER', 'WEBSITE'] },
    { key: 'abv', label: 'ABV (%)', badges: ['STICKER', 'WEBSITE', 'BOTTLE'] },
    { key: 'serving', label: 'Serving', badges: ['STICKER', 'WEBSITE'] },
    { key: 'garnish', label: 'Garnish', badges: ['WEBSITE'] },
    { key: 'glass', label: 'Glass', badges: ['WEBSITE'] },
    { key: 'ice', label: 'Ice', badges: ['WEBSITE'] },
    { key: 'flavour', label: 'Flavour', badges: ['WEBSITE'] },
    { key: 'food_pairing', label: 'Food Pairing', badges: ['WEBSITE'] },
    { key: 'occasion', label: 'Occasion', badges: ['WEBSITE'] },
    { key: 'uk_units', label: 'UK Units', badges: ['STICKER'] },
    { key: 'allergens_summary', label: 'Allergens Summary', badges: ['STICKER', 'WEBSITE'] },
    { key: 'product_link', label: 'Product Link (URL)', badges: ['WEBSITE'] },
  ];

  return (
    <div className="space-y-6">
      {/* Line select */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-xs text-muted-foreground">Line</Label>
          <Badge type="BOTTLE" />
        </div>
        <Select value={form.line} onValueChange={(v) => set('line', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Classic">Classic</SelectItem>
            <SelectItem value="Sparkling">Sparkling</SelectItem>
            <SelectItem value="No Regrets">No Regrets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.badges.map((b) => <Badge key={b} type={b} />)}
            </div>
            <Input
              value={form[f.key] || ''}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Hero Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.hero_bg || '#f5f0ea'}
              onChange={(e) => set('hero_bg', e.target.value)}
              className="w-10 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.hero_bg || ''}
              onChange={(e) => set('hero_bg', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Bottle Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.bottle_color || '#2a2a2a'}
              onChange={(e) => set('bottle_color', e.target.value)}
              className="w-10 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.bottle_color || ''}
              onChange={(e) => set('bottle_color', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save General Info'}
      </Button>
    </div>
  );
}

// ─── Languages Tab ───
function LanguagesTab({ productId }: { productId: string }) {
  const [activeLang, setActiveLang] = useState('EN');
  const { data: translation, refetch } = useProductTranslations(productId, activeLang);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    claim: '',
    sensory_description: '',
    ingredient_list_short: '',
    ingredient_list_full: '',
    allergens_local: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (translation) {
      setForm({
        claim: translation.claim || '',
        sensory_description: translation.sensory_description || '',
        ingredient_list_short: translation.ingredient_list_short || '',
        ingredient_list_full: translation.ingredient_list_full || '',
        allergens_local: translation.allergens_local || '',
      });
    } else {
      setForm({ claim: '', sensory_description: '', ingredient_list_short: '', ingredient_list_full: '', allergens_local: '' });
    }
  }, [translation, activeLang]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('product_translations').upsert({
      ...(translation?.id ? { id: translation.id } : {}),
      product_id: productId,
      language: activeLang,
      ...form,
    }, { onConflict: 'product_id,language' });
    setSaving(false);
    if (error) { toast.error('Failed to save translation'); return; }
    toast.success(`${activeLang} translation saved`);
    queryClient.invalidateQueries({ queryKey: ['product-translations', productId, activeLang] });
  };

  const comingSoon = activeLang === 'DE' || activeLang === 'FR';

  const fields: { key: keyof typeof form; label: string; type: 'input' | 'textarea'; badge: 'STICKER' | 'WEBSITE' }[] = [
    { key: 'claim', label: 'Claim / Sticker Copy', type: 'textarea', badge: 'STICKER' },
    { key: 'sensory_description', label: 'Sensory Description', type: 'textarea', badge: 'WEBSITE' },
    { key: 'ingredient_list_short', label: 'Ingredient List (Short)', type: 'textarea', badge: 'STICKER' },
    { key: 'ingredient_list_full', label: 'Ingredient List (Full with %)', type: 'textarea', badge: 'WEBSITE' },
    { key: 'allergens_local', label: 'Allergens (Local)', type: 'input', badge: 'STICKER' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(['EN', 'IT', 'DE', 'FR'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setActiveLang(l)}
            className={`px-4 py-2 text-xs font-admin tracking-wider rounded-t transition-colors ${
              activeLang === l ? 'bg-card text-primary border border-border border-b-0' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="relative">
        {comingSoon && (
          <div className="absolute inset-0 z-10 bg-card/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-primary font-display text-xl">Coming Soon</p>
              <p className="text-xs text-muted-foreground mt-1">Translations for {activeLang} are in progress</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs text-muted-foreground">{f.label}</Label>
                <Badge type={f.badge} />
              </div>
              {f.type === 'textarea' ? (
                <Textarea
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <Input
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : `Save ${activeLang} Translation`}
      </Button>
    </div>
  );
}

// ─── Technical Data Tab ───
const TECH_SECTIONS = [
  {
    title: 'Document Info',
    fields: ['document_type', 'document_revision', 'document_date', 'batch_number', 'label_date', 'application', 'recommended_dosage'],
  },
  {
    title: 'Nutrition per 100ml',
    fields: ['energy_kj', 'energy_kcal', 'fats', 'saturated_fats', 'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'sodium_mg'],
  },
  {
    title: 'Chemical & Physical',
    fields: ['ph', 'brix', 'total_acidity', 'alcoholic_strength', 'colour', 'microbiological_count'],
  },
  {
    title: 'Organoleptic Profile',
    fields: ['odor', 'appearance', 'taste_profile'],
  },
  {
    title: 'Storage & Shelf Life',
    fields: ['shelf_life', 'storage_conditions', 'storage_after_opening'],
  },
  {
    title: 'Declarations & Compliance',
    fields: ['gmo_declaration', 'ionising_radiation', 'compliance_references', 'compliance_regulation_1', 'compliance_regulation_2', 'compliance_regulation_3', 'additional_information'],
  },
  {
    title: 'Supplier',
    fields: ['supplier_name', 'supplier_address', 'supplier_phone', 'supplier_email', 'supplier_vat'],
  },
  {
    title: 'Laboratory',
    fields: ['laboratory_name', 'laboratory_address', 'test_report_number', 'accreditation_number'],
  },
];

const ALL_TEXT_FIELDS = TECH_SECTIONS.flatMap((s) => s.fields);

function RawDataSection({ raw }: { raw: Record<string, any> }) {
  if (!raw || typeof raw !== 'object') return null;
  const sections = Object.entries(raw).filter(([_, v]) => v && typeof v === 'object' && Object.keys(v).length > 0);
  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-admin font-semibold text-foreground">Extended Analytical Data (raw_analytical_data)</h3>
      {sections.map(([sectionKey, sectionData]) => (
        <div key={sectionKey} className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-admin font-semibold text-primary uppercase tracking-wider mb-3">
            {sectionKey.replace(/_/g, ' ')}
          </h4>
          {typeof sectionData === 'object' && !Array.isArray(sectionData) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(sectionData as Record<string, any>).map(([k, v]) => (
                <div key={k} className="rounded bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground capitalize mb-0.5">{k.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-foreground font-medium">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v || '—')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(sectionData, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

function TechnicalTab({ productId }: { productId: string }) {
  const { data: techData, refetch } = useProductTechnicalData(productId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    if (techData) setForm({ ...techData });
    else setForm({});
  }, [techData]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, any> = { product_id: productId };
    ALL_TEXT_FIELDS.forEach((k) => { payload[k] = form[k] || null; });
    ALLERGENS.forEach((a) => { payload[`allergen_${a}`] = !!form[`allergen_${a}`]; });
    if (form.raw_analytical_data) payload.raw_analytical_data = form.raw_analytical_data;
    if (techData?.id) payload.id = techData.id;

    const { error } = await supabase.from('product_technical_data').upsert(payload, { onConflict: 'product_id' });
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Technical data saved');
    queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
  };

  const handleFlush = async () => {
    if (!confirm('This will permanently delete all technical data and tech sheet upload records for this product. Continue?')) return;
    setFlushing(true);
    try {
      await supabase.from('product_technical_data').delete().eq('product_id', productId);
      await supabase.from('tech_sheet_uploads').delete().eq('product_id', productId);
      setForm({});
      toast.success('Technical data flushed');
      queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch {
      toast.error('Failed to flush data');
    }
    setFlushing(false);
  };

  return (
    <div className="space-y-6">
      {techData ? (
        <div className="rounded-lg bg-[#4a8c5c]/10 border border-[#4a8c5c]/20 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#5aac6c]">✓ Populated via AI Tech Sheet</p>
            {techData.document_type && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Type: {techData.document_type.replace(/_/g, ' ')}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive text-[10px] hover:bg-destructive/10"
            onClick={handleFlush}
            disabled={flushing}
          >
            {flushing ? 'Flushing…' : '⟳ Flush Technical Data'}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-[#c09040]/10 border border-[#c09040]/20 p-3 flex items-center justify-between">
          <p className="text-xs text-[#c09040]">No technical data yet</p>
          <Link to="/admin/ai-upload" className="text-xs text-primary hover:underline">Upload Tech Sheet →</Link>
        </div>
      )}

      {TECH_SECTIONS.map((section) => {
        const hasValues = section.fields.some((k) => form[k]);
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-admin font-semibold text-foreground">{section.title}</h3>
              {hasValues && <span className="w-2 h-2 rounded-full bg-[#4a8c5c]" />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {section.fields.map((key) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground capitalize mb-1.5 block">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    value={form[key] || ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div>
        <h3 className="text-sm font-admin font-semibold text-foreground mb-3">Allergen Matrix</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALLERGENS.map((a) => (
            <div key={a} className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-xs text-foreground capitalize">{a}</Label>
              <Switch
                checked={!!form[`allergen_${a}`]}
                onCheckedChange={(v) => set(`allergen_${a}`, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {form.raw_analytical_data && (
        <RawDataSection raw={form.raw_analytical_data as Record<string, any>} />
      )}

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save Technical Data'}
      </Button>
    </div>
  );
}

// ─── EAN Codes Tab ───
function EanTab({ productId }: { productId: string }) {
  const { data: eanCodes, refetch } = useProductEanCodes(productId);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<{ market: string; ean_cocktail: string; ean_carton: string; id?: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eanCodes && eanCodes.length > 0) {
      setRows(eanCodes.map((e) => ({
        id: e.id,
        market: e.market,
        ean_cocktail: e.ean_cocktail || '',
        ean_carton: e.ean_carton || '',
      })));
    } else {
      setRows(MARKETS.map((m) => ({ market: m, ean_cocktail: '', ean_carton: '' })));
    }
  }, [eanCodes]);

  const updateRow = (idx: number, key: string, val: string) => {
    setRows((r) => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));
  };

  const addRow = () => {
    setRows((r) => [...r, { market: '', ean_cocktail: '', ean_carton: '' }]);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows) {
      if (!row.market) continue;
      await supabase.from('product_ean_codes').upsert({
        ...(row.id ? { id: row.id } : {}),
        product_id: productId,
        market: row.market,
        ean_cocktail: row.ean_cocktail || null,
        ean_carton: row.ean_carton || null,
      }, { onConflict: 'product_id,market' });
    }
    setSaving(false);
    toast.success('EAN codes saved');
    queryClient.invalidateQueries({ queryKey: ['product-ean-codes', productId] });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Market</TableHead>
            <TableHead className="text-xs">EAN Cocktail</TableHead>
            <TableHead className="text-xs">EAN Carton</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input
                  value={row.market}
                  onChange={(e) => updateRow(i, 'market', e.target.value)}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.ean_cocktail}
                  onChange={(e) => updateRow(i, 'ean_cocktail', e.target.value)}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.ean_carton}
                  onChange={(e) => updateRow(i, 'ean_carton', e.target.value)}
                  className="h-8 text-xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={addRow}>+ Add Market</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground" size="sm">
          {saving ? 'Saving…' : 'Save EAN Codes'}
        </Button>
      </div>
    </div>
  );
}

// ─── Images Tab ───
const SECTIONS = ['hero', 'editorial', 'serve_moment', 'pairing', 'gallery'] as const;

function ImagesTab({ productId }: { productId: string }) {
  const { data: productImages, refetch } = useProductImages(productId);
  const { data: allImages } = useApprovedBrandImages();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('hero');

  const handleAttach = async (imageId: string) => {
    const { error } = await supabase.from('product_images').upsert({
      product_id: productId,
      image_id: imageId,
      section: selectedSection,
      sort_order: (productImages?.length || 0),
    }, { onConflict: 'product_id,image_id,section' });
    if (error) { toast.error('Failed to attach image'); return; }
    toast.success('Image attached');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from('product_images').delete().eq('id', id);
    toast.success('Image removed');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
  };

  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s] = productImages?.filter((pi: any) => pi.section === s) || [];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-admin uppercase tracking-wider text-muted-foreground capitalize">{section.replace('_', ' ')}</h4>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[9px]"
              onClick={() => { setSelectedSection(section); setAdding(true); }}
            >
              + Add Image
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {grouped[section].map((pi: any) => (
              <div key={pi.id} className="relative group rounded border border-border overflow-hidden">
                <img
                  src={pi.brand_images?.public_url}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                <button
                  onClick={() => handleRemove(pi.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {grouped[section].length === 0 && (
              <p className="text-[10px] text-muted-foreground col-span-4 py-3">No images for this section</p>
            )}
          </div>
        </div>
      ))}

      {/* Image picker modal */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setAdding(false)}>
          <div className="bg-card rounded-lg border border-border p-4 max-w-2xl w-full max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-admin font-semibold text-foreground">
                Attach to "{selectedSection.replace('_', ' ')}"
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allImages?.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => handleAttach(img.id)}
                  className="rounded border border-border overflow-hidden hover:border-primary transition-colors"
                >
                  <img src={img.public_url} alt="" className="w-full aspect-square object-cover" />
                  <p className="text-[8px] text-muted-foreground p-1 truncate">{img.filename}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function AdminProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: products } = useProducts();
  const queryClient = useQueryClient();

  const invalidateProduct = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
  }, [queryClient, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar */}
      <aside className="w-60 border-r border-border bg-card overflow-y-auto shrink-0">
        <div className="p-3 border-b border-border">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>
        <nav className="py-1">
          {products?.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/product/${p.slug}`)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                p.slug === slug ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getCompletenessColor(p.completeness || 0) }}
              />
              <span className="truncate flex-1">{p.name}</span>
              <span className={`text-[8px] uppercase px-1 py-0.5 rounded ${getLineBadge(p.line)}`}>
                {p.line === 'No Regrets' ? 'NR' : p.line === 'Sparkling' ? 'SP' : 'CL'}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main editor */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-[28px] font-normal text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${product.completeness}%`,
                    backgroundColor: getCompletenessColor(product.completeness || 0),
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{product.completeness}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/bottle/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">Preview ↗</Button>
            </a>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="technical">Technical Data</TabsTrigger>
              <TabsTrigger value="ean">EAN Codes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralTab product={product} onSave={invalidateProduct} />
            </TabsContent>

            <TabsContent value="languages">
              <LanguagesTab productId={product.id} />
            </TabsContent>

            <TabsContent value="technical">
              <TechnicalTab productId={product.id} />
            </TabsContent>

            <TabsContent value="ean">
              <EanTab productId={product.id} />
            </TabsContent>

            <TabsContent value="images">
              <ImagesTab productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
