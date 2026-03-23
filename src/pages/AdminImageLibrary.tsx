import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, Sparkles, Check, X, Eye } from 'lucide-react';

function useBrandImages() {
  return useQuery({
    queryKey: ['brand-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_images')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useImageAttributes(imageId: string | null) {
  return useQuery({
    queryKey: ['image-attributes', imageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('image_attributes')
        .select('*')
        .eq('image_id', imageId!)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!imageId,
  });
}

const ANALYSIS_MESSAGES = [
  'Examining image composition…',
  'Detecting products and objects…',
  'Analysing mood and setting…',
  'Extracting colour palette…',
  'Generating descriptions…',
  'Analysis complete ✓',
];

export default function AdminImageLibrary() {
  const { data: images, isLoading } = useBrandImages();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState<string | null>(null);
  const [analysingMsg, setAnalysingMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: selectedAttrs } = useImageAttributes(selectedImage);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-images')
        .upload(path, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('brand-images').getPublicUrl(path);

      // Get image dimensions
      const img = new window.Image();
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = URL.createObjectURL(file);
      });

      await supabase.from('brand_images').insert({
        filename: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        file_size: file.size,
        width: dims.w,
        height: dims.h,
        status: 'pending',
      });

      toast.success(`Uploaded ${file.name}`);
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  }, [queryClient]);

  const handleAnalyse = useCallback(async (imageId: string, publicUrl: string) => {
    setAnalysing(imageId);
    let msgIdx = 0;
    setAnalysingMsg(ANALYSIS_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < ANALYSIS_MESSAGES.length) {
        setAnalysingMsg(ANALYSIS_MESSAGES[msgIdx]);
      }
    }, 2000);

    try {
      await supabase.from('brand_images').update({ status: 'analysing' }).eq('id', imageId);

      const { data, error } = await supabase.functions.invoke('analyse-image', {
        body: { image_id: imageId, public_url: publicUrl },
      });

      if (error) throw error;

      const attrs = data.data;

      await supabase.from('image_attributes').upsert({
        image_id: imageId,
        alt_text_en: attrs.alt_text_en,
        alt_text_it: attrs.alt_text_it,
        scene_description: attrs.scene_description,
        cocktails_present: attrs.cocktails_present || [],
        foods_present: attrs.foods_present || [],
        props_present: attrs.props_present || [],
        people_present: attrs.people_present ?? false,
        people_count: attrs.people_count ?? 0,
        people_setting: attrs.people_setting,
        setting: attrs.setting,
        time_of_day: attrs.time_of_day,
        season: attrs.season,
        mood: attrs.mood || [],
        dominant_colors: attrs.dominant_colors || [],
        composition: attrs.composition,
        brightness: attrs.brightness,
        best_for_sections: attrs.best_for_sections || [],
        suitable_for_lines: attrs.suitable_for_lines || [],
        is_alcoholic_context: attrs.is_alcoholic_context ?? false,
        product_slugs: attrs.product_slugs || [],
      }, { onConflict: 'image_id' });

      await supabase.from('brand_images').update({ status: 'complete' }).eq('id', imageId);
      toast.success('Image analysed successfully');
    } catch (e: any) {
      await supabase.from('brand_images').update({ status: 'error' }).eq('id', imageId);
      toast.error(e.message || 'Analysis failed');
    } finally {
      clearInterval(interval);
      setAnalysing(null);
      setAnalysingMsg('');
      queryClient.invalidateQueries({ queryKey: ['brand-images'] });
      queryClient.invalidateQueries({ queryKey: ['image-attributes'] });
    }
  }, [queryClient]);

  const toggleApproval = async (imageId: string, current: boolean) => {
    await supabase.from('image_attributes').update({ is_approved: !current }).eq('image_id', imageId);
    queryClient.invalidateQueries({ queryKey: ['image-attributes', imageId] });
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
    toast.success(!current ? 'Image approved' : 'Approval revoked');
  };

  const statusColor = (s: string) => {
    if (s === 'complete') return 'text-[#4a8c5c]';
    if (s === 'analysing') return 'text-[#b8975a]';
    if (s === 'error') return 'text-[#a04040]';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Image Library</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · Brand Assets</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Upload zone */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-lg p-8 cursor-pointer hover:border-primary/70 transition-colors bg-card/50">
          <Upload className="w-8 h-8 text-primary mb-2" />
          <p className="text-sm text-foreground font-medium">
            {uploading ? 'Uploading…' : 'Drop images here or click to browse'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP · Max 20MB</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>

        {/* Image grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images?.map((img) => (
              <div
                key={img.id}
                className={`group rounded-lg border bg-card overflow-hidden cursor-pointer transition-all ${
                  selectedImage === img.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedImage(selectedImage === img.id ? null : img.id)}
              >
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={img.public_url}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {analysing === img.id && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse mx-auto mb-2" />
                        <p className="text-[10px] text-white">{analysingMsg}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 ${statusColor(img.status || 'pending')}`}>
                      {img.status}
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-foreground truncate">{img.filename}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {img.width}×{img.height} · {img.file_size ? `${(img.file_size / 1024).toFixed(0)}KB` : ''}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {img.status !== 'complete' && img.status !== 'analysing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[9px] px-2"
                        onClick={(e) => { e.stopPropagation(); handleAnalyse(img.id, img.public_url); }}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Analyse
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected image detail panel */}
        {selectedImage && selectedAttrs && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-admin font-semibold text-foreground">AI Analysis</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Approved</Label>
                  <Switch
                    checked={selectedAttrs.is_approved ?? false}
                    onCheckedChange={() => toggleApproval(selectedImage, selectedAttrs.is_approved ?? false)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Alt text */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Alt Text (EN)</Label>
                <p className="text-xs text-foreground mt-1">{selectedAttrs.alt_text_en || '—'}</p>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Alt Text (IT)</Label>
                <p className="text-xs text-foreground mt-1">{selectedAttrs.alt_text_it || '—'}</p>
              </div>
            </div>

            {/* Scene */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Scene Description</Label>
              <p className="text-xs text-foreground mt-1">{selectedAttrs.scene_description || '—'}</p>
            </div>

            {/* Tags grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AttrChips label="Cocktails" items={selectedAttrs.cocktails_present} />
              <AttrChips label="Foods" items={selectedAttrs.foods_present} />
              <AttrChips label="Props" items={selectedAttrs.props_present} />
              <AttrChips label="Mood" items={selectedAttrs.mood} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <AttrBadge label="Setting" value={selectedAttrs.setting} />
              <AttrBadge label="Time" value={selectedAttrs.time_of_day} />
              <AttrBadge label="Season" value={selectedAttrs.season} />
              <AttrBadge label="Composition" value={selectedAttrs.composition} />
              <AttrBadge label="Brightness" value={selectedAttrs.brightness} />
              <AttrBadge label="Alcoholic" value={selectedAttrs.is_alcoholic_context ? 'Yes' : 'No'} />
            </div>

            {/* Colors */}
            {selectedAttrs.dominant_colors && selectedAttrs.dominant_colors.length > 0 && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Dominant Colors</Label>
                <div className="flex gap-2 mt-1">
                  {(selectedAttrs.dominant_colors as string[]).map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: c }} />
                      <span className="text-[9px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best for */}
            <div className="grid grid-cols-2 gap-3">
              <AttrChips label="Best for Sections" items={selectedAttrs.best_for_sections} />
              <AttrChips label="Suitable Lines" items={selectedAttrs.suitable_for_lines} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AttrChips({ label, items }: { label: string; items: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 mt-1">
        {items.map((item, i) => (
          <span key={i} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AttrBadge({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <p className="text-[10px] text-foreground mt-0.5 capitalize">{value || '—'}</p>
    </div>
  );
}
