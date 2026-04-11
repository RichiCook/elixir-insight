import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Search, Check, X } from 'lucide-react';

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
  multiple?: boolean;
  onSelectMultiple?: (urls: string[]) => void;
}

export function ImagePickerDialog({ onSelect, onClose, multiple, onSelectMultiple }: Props) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<'library' | 'url'>('library');
  const [manualUrl, setManualUrl] = useState('');

  const { data: images, isLoading } = useQuery({
    queryKey: ['brand-images-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_images')
        .select('id, filename, public_url, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = images?.filter(img =>
    !search || img.filename.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`"${file.name}" is not an allowed image type`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          toast.error(`"${file.name}" exceeds 10 MB limit`);
          continue;
        }
        const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('brand-images').upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('brand-images').getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        await supabase.from('brand_images').insert({
          filename: file.name,
          storage_path: path,
          public_url: publicUrl,
          file_size: file.size,
          status: 'complete',
        });

        if (multiple) {
          setSelected(prev => [...prev, publicUrl]);
        } else {
          onSelect(publicUrl);
          onClose();
          return;
        }
      }
      toast.success('Uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
    setUploading(false);
  }, [multiple, onSelect, onClose]);

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelected(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
    } else {
      onSelect(url);
      onClose();
    }
  };

  const confirmMultiple = () => {
    if (onSelectMultiple && selected.length) {
      onSelectMultiple(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">
            {multiple ? 'Select Images' : 'Select Image'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('library')}
              className={`text-[10px] px-2.5 py-1 rounded ${tab === 'library' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Library
            </button>
            <button
              onClick={() => setTab('url')}
              className={`text-[10px] px-2.5 py-1 rounded ${tab === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              URL
            </button>
          </div>
          {tab === 'library' && (
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search images…"
                className="h-7 text-xs pl-7"
              />
            </div>
          )}
          {tab === 'library' && (
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded border border-border text-foreground hover:bg-accent transition-colors">
                <Upload className="w-3 h-3" />
                {uploading ? 'Uploading…' : 'Upload'}
              </span>
            </label>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'library' && (
            isLoading ? (
              <p className="text-xs text-muted-foreground text-center py-10">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">No images found. Upload one above.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filtered.map(img => {
                  const isSelected = selected.includes(img.public_url);
                  return (
                    <button
                      key={img.id}
                      onClick={() => toggleSelect(img.public_url)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                        isSelected ? 'border-primary' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={img.public_url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">
                        {img.filename}
                      </p>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {tab === 'url' && (
            <div className="space-y-3 py-4">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Image URL</Label>
                <Input
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
              {manualUrl && (
                <div className="rounded-md border border-border overflow-hidden max-w-[200px]">
                  <img src={manualUrl} alt="Preview" className="w-full aspect-square object-cover" />
                </div>
              )}
              <Button
                size="sm"
                disabled={!manualUrl.trim()}
                onClick={() => {
                  if (multiple && onSelectMultiple) {
                    setSelected(prev => [...prev, manualUrl.trim()]);
                  } else {
                    onSelect(manualUrl.trim());
                    onClose();
                  }
                }}
              >
                {multiple ? 'Add Image' : 'Use This Image'}
              </Button>
            </div>
          )}
        </div>

        {/* Footer (multiple mode) */}
        {multiple && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {selected.length} image{selected.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" disabled={!selected.length} onClick={confirmMultiple} className="bg-primary text-primary-foreground">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
