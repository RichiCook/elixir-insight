import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Search, Check, X, Play, Link as LinkIcon } from 'lucide-react';

interface BrandVideo {
  id: string;
  filename: string;
  public_url: string;
  thumbnail_url: string | null;
  file_size: number | null;
  created_at: string;
}

interface Props {
  /** Called when user selects or pastes a URL — returns the URL string */
  onSelect: (url: string) => void;
  onClose: () => void;
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/** Infer an embed-safe URL from a YouTube / Vimeo share link */
function normaliseVideoUrl(raw: string): string {
  const trimmed = raw.trim();

  // YouTube: youtu.be/ID or youtube.com/watch?v=ID → embed
  const ytShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  const ytWatch = trimmed.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // Vimeo: vimeo.com/ID → embed
  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Already an embed or direct URL — pass through
  return trimmed;
}

export function VideoPickerDialog({ onSelect, onClose }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'library' | 'upload' | 'url'>('library');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [externalUrl, setExternalUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['brand-videos-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_videos')
        .select('id, filename, public_url, thumbnail_url, file_size, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrandVideo[];
    },
  });

  const filtered = videos?.filter(v =>
    !search || v.filename.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setTab('library');

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported video format`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds 500 MB limit`);
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      try {
        setUploadProgress(0);
        const { error: upErr } = await supabase.storage
          .from('brand-videos')
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        setUploadProgress(100);

        const { data: urlData } = supabase.storage.from('brand-videos').getPublicUrl(path);

        await supabase.from('brand_videos').insert({
          filename: file.name,
          storage_path: path,
          public_url: urlData.publicUrl,
          file_size: file.size,
        });

        toast.success(`"${file.name}" uploaded`);
        queryClient.invalidateQueries({ queryKey: ['brand-videos-picker'] });
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      }
    }

    setUploading(false);
    setUploadProgress(0);
  }, [queryClient]);

  const handleSelectVideo = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleExternalUrl = () => {
    const normalised = normaliseVideoUrl(externalUrl);
    if (!normalised) { toast.error('Enter a valid URL'); return; }
    onSelect(normalised);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[82vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Select Video</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          {(['library', 'upload', 'url'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] px-2.5 py-1 rounded capitalize transition-colors ${
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'url' ? 'External URL' : t}
            </button>
          ))}
          {tab === 'library' && (
            <div className="flex-1 relative ml-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search videos…"
                className="h-7 text-xs pl-7"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* LIBRARY TAB */}
          {tab === 'library' && (
            <>
              {isLoading ? (
                <p className="text-xs text-muted-foreground text-center py-10">Loading…</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Play className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    No videos uploaded yet.{' '}
                    <button onClick={() => setTab('upload')} className="text-primary hover:underline">
                      Upload one
                    </button>
                    {' '}or paste an{' '}
                    <button onClick={() => setTab('url')} className="text-primary hover:underline">
                      external URL
                    </button>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filtered.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVideo(v.public_url)}
                      className="group relative rounded-lg overflow-hidden border border-border hover:border-primary transition-colors bg-black aspect-video"
                    >
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.filename} className="w-full h-full object-cover" />
                      ) : (
                        <video
                          src={v.public_url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <p className="text-[9px] text-white truncate">{v.filename}</p>
                        {v.file_size && (
                          <p className="text-[8px] text-white/60">{formatBytes(v.file_size)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* UPLOAD TAB */}
          {tab === 'upload' && (
            <div className="py-4 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                multiple
                className="hidden"
                onChange={e => handleUpload(e.target.files)}
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">Drop video here or click to browse</p>
                <p className="text-[10px] text-muted-foreground mt-1">MP4, WebM, MOV, AVI — up to 500 MB</p>
              </div>
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXTERNAL URL TAB */}
          {tab === 'url' && (
            <div className="py-4 space-y-4">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1.5 block">
                  YouTube, Vimeo, or direct video URL
                </Label>
                <Input
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleExternalUrl()}
                  placeholder="https://youtube.com/watch?v=... or https://..."
                  className="h-8 text-xs"
                  autoFocus
                />
                <p className="text-[9px] text-muted-foreground mt-1">
                  YouTube and Vimeo share links are automatically converted to embed format.
                </p>
              </div>
              {externalUrl && (
                <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                  <LinkIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[10px] text-muted-foreground truncate">
                    {normaliseVideoUrl(externalUrl)}
                  </p>
                </div>
              )}
              <Button
                size="sm"
                disabled={!externalUrl.trim()}
                onClick={handleExternalUrl}
                className="bg-primary text-primary-foreground"
              >
                Use This URL
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
