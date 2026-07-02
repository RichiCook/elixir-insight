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
}

export default function AdminSiteSettings() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [initial, setInitial] = useState<SiteSettingsForm | undefined>();
  // Classy brand logo (stored on the brands table, shown on consumer pages)
  const [brandId, setBrandId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPicker, setLogoPicker] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  useEffect(() => {
    supabase.from('site_settings' as any).select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setInitial({ site_title: (data as any).site_title || '', favicon_url: (data as any).favicon_url || '' });
        setSettingsId((data as any).id);
      }
      setLoading(false);
    });
    supabase.from('brands' as any).select('id, logo_url').eq('slug', 'classy').maybeSingle().then(({ data }) => {
      if (data) { setBrandId((data as any).id); setLogoUrl((data as any).logo_url || ''); }
    });
  }, []);

  const saveLogo = async (url: string | null) => {
    if (!brandId) { toast.error('Brand not found'); return; }
    setSavingLogo(true);
    const { error } = await supabase.from('brands' as any).update({ logo_url: url || null }).eq('id', brandId);
    setSavingLogo(false);
    if (error) { toast.error('Failed to save logo'); return; }
    setLogoUrl(url || '');
    toast.success(url ? 'Brand logo saved' : 'Brand logo removed');
  };
  const handleLogoSelected = (url: string) => { setLogoPicker(false); saveLogo(url); };

  const { form, set, saving, handleSave } = useApiForm<SiteSettingsForm>(initial, async (data) => {
    if (!settingsId) return;
    const { error } = await supabase.from('site_settings' as any).update({
      site_title: data.site_title,
      favicon_url: data.favicon_url || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', settingsId);
    if (error) toast.error('Failed to save settings');
    else toast.success('Site settings saved');
  });

  const handleFaviconSelected = (url: string) => {
    set('favicon_url', url);
    setShowImagePicker(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Site Settings</h1>
          <p className="text-xs text-muted-foreground">Global favicon &amp; browser tab title</p>
        </div>
      </header>

      <main className="p-6 max-w-xl mx-auto space-y-6">
        {/* Site Title */}
        <div className="space-y-2">
          <Label>Browser Tab Title</Label>
          <Input
            value={form.site_title ?? ''}
            onChange={(e) => set('site_title', e.target.value)}
            placeholder="Classy Cocktails"
          />
          <p className="text-xs text-muted-foreground">Shown in the browser tab on all consumer pages</p>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <Label>Favicon</Label>
          <div className="flex items-center gap-4">
            {form.favicon_url ? (
              <div className="w-12 h-12 border border-border rounded flex items-center justify-center bg-muted overflow-hidden">
                <img src={form.favicon_url} alt="Favicon preview" className="w-8 h-8 object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 border border-border rounded flex items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">None</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
                <Upload className="w-3 h-3 mr-1" /> Choose Image
              </Button>
              {form.favicon_url && (
                <Button variant="ghost" size="sm" onClick={() => set('favicon_url', '')}>Remove</Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Upload or pick from your image library. Square images (32×32 or 64×64) work best.</p>
        </div>

        {/* Brand Logo (Classy) — saved immediately */}
        <div className="space-y-2">
          <Label>Brand Logo — Classy</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="h-12 px-2 border border-border rounded flex items-center bg-muted overflow-hidden">
                <img src={logoUrl} alt="Brand logo" className="h-8 w-auto object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 border border-border rounded flex items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">None</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLogoPicker(true)} disabled={!brandId || savingLogo}>
                <Upload className="w-3 h-3 mr-1" /> {savingLogo ? 'Saving…' : 'Upload Logo'}
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="sm" onClick={() => saveLogo(null)} disabled={savingLogo}>Remove</Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Shown on the consumer bottle pages. PNG with a transparent background works best. Saved as soon as you pick it.</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </main>

      {showImagePicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg border border-border max-w-3xl w-full max-h-[80vh] overflow-auto p-4">
            <ImagePickerDialog
              onClose={() => setShowImagePicker(false)}
              onSelect={handleFaviconSelected}
            />
          </div>
        </div>
      )}

      {logoPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg border border-border max-w-3xl w-full max-h-[80vh] overflow-auto p-4">
            <ImagePickerDialog
              onClose={() => setLogoPicker(false)}
              onSelect={handleLogoSelected}
            />
          </div>
        </div>
      )}
    </div>
  );
}
