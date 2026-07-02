import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { useApiForm } from '@/hooks/useApiForm';

interface SiteSettingsForm {
  site_title: string;
  favicon_url: string;
  brand_logo_url: string;
  brand_logo_light_url: string;
}

type PickTarget = keyof SiteSettingsForm | null;

export default function AdminSiteSettings() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickTarget, setPickTarget] = useState<PickTarget>(null);
  const [initial, setInitial] = useState<SiteSettingsForm | undefined>();

  useEffect(() => {
    supabase.from('site_settings' as any).select('*').limit(1).single().then(({ data }) => {
      if (data) {
        const d = data as any;
        setInitial({
          site_title: d.site_title || '',
          favicon_url: d.favicon_url || '',
          brand_logo_url: d.brand_logo_url || '',
          brand_logo_light_url: d.brand_logo_light_url || '',
        });
        setSettingsId(d.id);
      }
      setLoading(false);
    });
  }, []);

  const { form, set, saving, handleSave } = useApiForm<SiteSettingsForm>(initial, async (data) => {
    if (!settingsId) return;
    const { error } = await supabase.from('site_settings' as any).update({
      site_title: data.site_title,
      favicon_url: data.favicon_url || null,
      brand_logo_url: data.brand_logo_url || null,
      brand_logo_light_url: data.brand_logo_light_url || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', settingsId);
    if (error) toast.error('Failed to save settings');
    else toast.success('Site settings saved');
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const AssetPicker = ({ field, label, hint, preview }: { field: keyof SiteSettingsForm; label: string; hint: string; preview: 'light' | 'dark' | 'square' }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div
          className="h-14 min-w-[112px] px-3 border border-border rounded flex items-center justify-center overflow-hidden"
          style={{ background: preview === 'dark' ? '#0c0b0f' : preview === 'light' ? '#ffffff' : 'hsl(var(--muted))' }}
        >
          {form[field] ? (
            <img src={form[field]} alt={`${label} preview`} className={preview === 'square' ? 'w-9 h-9 object-contain' : 'h-9 w-auto object-contain'} />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPickTarget(field)}>
            <Upload className="w-3 h-3 mr-1" /> Choose Image
          </Button>
          {form[field] && <Button variant="ghost" size="sm" onClick={() => set(field, '')}>Remove</Button>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Site Settings</h1>
          <p className="text-xs text-muted-foreground">Brand assets, favicon &amp; browser tab title</p>
        </div>
      </header>

      <main className="p-6 max-w-xl mx-auto space-y-8">
        {/* Brand assets */}
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Brand Assets</h2>
            <p className="text-xs text-muted-foreground">The logo shown wherever “Classy Cocktails” appears as a heading, co-brand tag, or footer mark.</p>
          </div>
          <AssetPicker
            field="brand_logo_url"
            label="Logo"
            preview="light"
            hint="Your primary logo (used on light surfaces, and auto-inverted to white on dark surfaces)."
          />
          <AssetPicker
            field="brand_logo_light_url"
            label="Logo — on dark (optional)"
            preview="dark"
            hint="A light/white version for dark backgrounds. If left empty, the primary logo is inverted automatically."
          />
        </section>

        {/* Tab + favicon */}
        <section className="space-y-5">
          <h2 className="text-sm font-medium text-foreground">Browser Tab</h2>
          <div className="space-y-2">
            <Label>Tab Title</Label>
            <Input value={form.site_title ?? ''} onChange={(e) => set('site_title', e.target.value)} placeholder="Classy Cocktails" />
            <p className="text-xs text-muted-foreground">Shown in the browser tab on all consumer pages.</p>
          </div>
          <AssetPicker field="favicon_url" label="Favicon" preview="square" hint="Square images (32×32 or 64×64) work best." />
        </section>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </main>

      {pickTarget && (
        <ImagePickerDialog
          onClose={() => setPickTarget(null)}
          onSelect={(url) => { set(pickTarget, url); setPickTarget(null); }}
        />
      )}
    </div>
  );
}
