import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';

export default function AdminSiteSettings() {
  const [siteTitle, setSiteTitle] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setSiteTitle((data as any).site_title || '');
        setFaviconUrl((data as any).favicon_url || '');
        setSettingsId((data as any).id);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase.from('site_settings' as any).update({
      site_title: siteTitle,
      favicon_url: faviconUrl || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Site settings saved');
    }
  };

  const handleFaviconSelected = (url: string) => {
    setFaviconUrl(url);
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
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Classy Cocktails"
          />
          <p className="text-xs text-muted-foreground">Shown in the browser tab on all consumer pages</p>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <Label>Favicon</Label>
          <div className="flex items-center gap-4">
            {faviconUrl ? (
              <div className="w-12 h-12 border border-border rounded flex items-center justify-center bg-muted overflow-hidden">
                <img src={faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain" />
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
              {faviconUrl && (
                <Button variant="ghost" size="sm" onClick={() => setFaviconUrl('')}>Remove</Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Upload or pick from your image library. Square images (32×32 or 64×64) work best.</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </main>

      <ImagePickerDialog
        open={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleFaviconSelected}
        title="Choose Favicon"
      />
    </div>
  );
}
