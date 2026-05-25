import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductTranslations } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, X as XIcon, Languages as LanguagesIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Badge } from './Badge';

const AVAILABLE_LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'IT', name: 'Italian' },
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'ES', name: 'Spanish' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'NL', name: 'Dutch' },
  { code: 'PL', name: 'Polish' },
  { code: 'SV', name: 'Swedish' },
  { code: 'DA', name: 'Danish' },
  { code: 'FI', name: 'Finnish' },
  { code: 'NO', name: 'Norwegian' },
  { code: 'EL', name: 'Greek' },
  { code: 'TR', name: 'Turkish' },
  { code: 'CS', name: 'Czech' },
  { code: 'RO', name: 'Romanian' },
  { code: 'HU', name: 'Hungarian' },
  { code: 'RU', name: 'Russian' },
  { code: 'JA', name: 'Japanese' },
  { code: 'ZH', name: 'Chinese' },
  { code: 'KO', name: 'Korean' },
  { code: 'AR', name: 'Arabic' },
];

const EMPTY_FORM = {
  claim: '',
  sensory_description: '',
  ingredient_list_short: '',
  ingredient_list_full: '',
  allergens_local: '',
};

export function LanguagesTab({ productId, productName }: { productId: string; productName: string }) {
  const queryClient = useQueryClient();
  const [languages, setLanguages] = useState<string[]>(['EN']);
  const [activeLang, setActiveLang] = useState('EN');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [translating, setTranslating] = useState(false);

  const { data: translation } = useProductTranslations(productId, activeLang);
  const { data: enTranslation } = useProductTranslations(productId, 'EN');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('product_translations')
        .select('language')
        .eq('product_id', productId);
      if (cancelled) return;
      const langs = Array.from(new Set([...(data || []).map((r: any) => r.language), 'EN']));
      setLanguages(langs);
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const [form, setForm] = useState(EMPTY_FORM);
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
      setForm(EMPTY_FORM);
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

  const handleAddLanguage = () => {
    const code = newLangCode.trim().toUpperCase();
    if (!code) return;
    if (languages.includes(code)) { toast.error(`${code} already added`); return; }
    setLanguages((prev) => [...prev, code]);
    setActiveLang(code);
    setShowAddDialog(false);
    setNewLangCode('');
  };

  const handleRemoveLanguage = async (code: string) => {
    if (code === 'EN') { toast.error('Cannot remove English (source)'); return; }
    if (!confirm(`Remove ${code} translation? This deletes saved data for this language.`)) return;
    await supabase.from('product_translations').delete().eq('product_id', productId).eq('language', code);
    setLanguages((prev) => prev.filter((l) => l !== code));
    if (activeLang === code) setActiveLang('EN');
    toast.success(`${code} removed`);
  };

  const handleTranslateWithAi = async () => {
    if (activeLang === 'EN') { toast.error('Source language cannot be translated'); return; }
    if (!enTranslation) { toast.error('Save an English translation first'); return; }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-product', {
        body: {
          source: {
            claim: enTranslation.claim,
            sensory_description: enTranslation.sensory_description,
            ingredient_list_short: enTranslation.ingredient_list_short,
            ingredient_list_full: enTranslation.ingredient_list_full,
            allergens_local: enTranslation.allergens_local,
          },
          sourceLang: 'EN',
          targetLang: activeLang,
          productName,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const translations = (data as any)?.translations || {};
      setForm((f) => ({
        claim: translations.claim ?? f.claim,
        sensory_description: translations.sensory_description ?? f.sensory_description,
        ingredient_list_short: translations.ingredient_list_short ?? f.ingredient_list_short,
        ingredient_list_full: translations.ingredient_list_full ?? f.ingredient_list_full,
        allergens_local: translations.allergens_local ?? f.allergens_local,
      }));
      toast.success(`Translated to ${activeLang}. Review and save.`);
    } catch (e: any) {
      toast.error(e?.message || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const fields: { key: keyof typeof EMPTY_FORM; label: string; type: 'input' | 'textarea'; badge: 'STICKER' | 'WEBSITE' }[] = [
    { key: 'claim', label: 'Claim / Sticker Copy', type: 'textarea', badge: 'STICKER' },
    { key: 'sensory_description', label: 'Sensory Description', type: 'textarea', badge: 'WEBSITE' },
    { key: 'ingredient_list_short', label: 'Ingredient List (Short)', type: 'textarea', badge: 'STICKER' },
    { key: 'ingredient_list_full', label: 'Ingredient List (Full with %)', type: 'textarea', badge: 'WEBSITE' },
    { key: 'allergens_local', label: 'Allergens (Local)', type: 'input', badge: 'STICKER' },
  ];

  const availableToAdd = AVAILABLE_LANGUAGES.filter((l) => !languages.includes(l.code));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap items-center">
        {languages.map((l) => (
          <div key={l} className="relative group">
            <button
              onClick={() => setActiveLang(l)}
              className={`px-4 py-2 text-xs font-admin tracking-wider rounded-t transition-colors flex items-center gap-2 ${
                activeLang === l ? 'bg-card text-primary border border-border border-b-0' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l}
              {l === 'EN' && <span className="text-[9px] uppercase opacity-60">source</span>}
            </button>
            {l !== 'EN' && activeLang === l && (
              <button
                onClick={() => handleRemoveLanguage(l)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                title={`Remove ${l}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-3 py-2 text-xs font-admin tracking-wider rounded-t border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add Language
        </button>
      </div>

      {showAddDialog && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Select or type a language code</Label>
            <button onClick={() => setShowAddDialog(false)} className="text-muted-foreground hover:text-foreground">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Select value={newLangCode} onValueChange={setNewLangCode}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pick a language…" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or type code"
              value={newLangCode}
              onChange={(e) => setNewLangCode(e.target.value.toUpperCase())}
              className="w-32"
              maxLength={5}
            />
            <Button onClick={handleAddLanguage} className="bg-primary text-primary-foreground">Add</Button>
          </div>
        </div>
      )}

      {activeLang !== 'EN' && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-xs">
            <LanguagesIcon className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Auto-fill <span className="text-primary font-medium">{activeLang}</span> fields from English using AI.
            </span>
          </div>
          <Button
            onClick={handleTranslateWithAi}
            disabled={translating || !enTranslation}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            <Sparkles className="h-3 w-3 mr-1.5" />
            {translating ? 'Translating…' : 'Translate with AI'}
          </Button>
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
              <Textarea value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={3} />
            ) : (
              <Input value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : `Save ${activeLang} Translation`}
      </Button>
    </div>
  );
}
