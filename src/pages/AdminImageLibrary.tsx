import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, Sparkles, X, ChevronUp, ChevronDown, Trash2, RotateCw, Check, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

function useBrandImages() {
  return useQuery({
    queryKey: ['brand-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_images')
        .select('*, image_attributes(*)')
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

const SECTION_OPTIONS = ['hero', 'editorial', 'serve_moment', 'pairing', 'heritage', 'gallery'];
const LINE_OPTIONS = ['Classic', 'No Regrets', 'Sparkling'];
const SETTING_OPTIONS = ['bar', 'home', 'outdoor', 'studio', 'table', 'restaurant', 'undefined'];
const TIME_OPTIONS = ['day', 'golden_hour', 'night', 'undefined'];
const SEASON_OPTIONS = ['summer', 'winter', 'autumn', 'spring', 'undefined'];
const COMPOSITION_OPTIONS = ['portrait', 'landscape', 'square', 'close_up', 'lifestyle', 'flat_lay'];
const BRIGHTNESS_OPTIONS = ['dark', 'medium', 'bright'];

export default function AdminImageLibrary() {
  const { data: images, isLoading } = useBrandImages();
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [analysingIds, setAnalysingIds] = useState<Set<string>>(new Set());
  const [analysingMsg, setAnalysingMsg] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: selectedAttrs } = useImageAttributes(selectedImage);
  const [uploadOpen, setUploadOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map((img: any) => img.id)));
    }
  };

  const bulkApprove = async (approve: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from('image_attributes').update({ is_approved: approve }).eq('image_id', id);
    }
    toast.success(`${ids.length} images ${approve ? 'approved' : 'unapproved'}`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const img = images?.find((i: any) => i.id === id);
      if (img) await supabase.storage.from('brand-images').remove([img.storage_path]);
      await supabase.from('brand_images').delete().eq('id', id);
    }
    toast.success(`${ids.length} images deleted`);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    setSelectedImage(null);
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  };

  const bulkSetFeatured = async (featured: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from('image_attributes').update({ is_featured: featured }).eq('image_id', id);
    }
    toast.success(`${ids.length} images ${featured ? 'featured' : 'unfeatured'}`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  };

  // Filters
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterLine, setFilterLine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterApproved, setFilterApproved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredImages = useMemo(() => {
    if (!images) return [];
    return images.filter((img: any) => {
      const attrs = img.image_attributes?.[0];
      if (filterStatus !== 'all' && img.status !== filterStatus) return false;
      if (filterApproved && (!attrs || !attrs.is_approved)) return false;
      if (filterProduct !== 'all' && (!attrs?.product_slugs || !attrs.product_slugs.includes(filterProduct))) return false;
      if (filterSection !== 'all' && (!attrs?.best_for_sections || !attrs.best_for_sections.includes(filterSection))) return false;
      if (filterLine !== 'all' && (!attrs?.suitable_for_lines || !attrs.suitable_for_lines.includes(filterLine))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchScene = attrs?.scene_description?.toLowerCase().includes(q);
        const matchAlt = attrs?.alt_text_en?.toLowerCase().includes(q);
        const matchFile = img.filename.toLowerCase().includes(q);
        if (!matchScene && !matchAlt && !matchFile) return false;
      }
      return true;
    });
  }, [images, filterProduct, filterSection, filterLine, filterStatus, filterApproved, searchQuery]);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      const fileKey = file.name;
      setUploadProgress(p => ({ ...p, [fileKey]: 'uploading' }));

      const ext = file.name.split('.').pop();
      const ts = Date.now();
      const path = `${ts}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-images')
        .upload(path, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        setUploadProgress(p => ({ ...p, [fileKey]: 'error' }));
        continue;
      }

      const { data: urlData } = supabase.storage.from('brand-images').getPublicUrl(path);

      const img = new window.Image();
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = URL.createObjectURL(file);
      });

      const { data: insertedData } = await supabase.from('brand_images').insert({
        filename: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        file_size: file.size,
        width: dims.w,
        height: dims.h,
        status: 'pending',
      }).select().single();

      setUploadProgress(p => ({ ...p, [fileKey]: 'analysing' }));
      toast.success(`Uploaded ${file.name}`);

      // Auto-analyse
      if (insertedData) {
        handleAnalyse(insertedData.id, urlData.publicUrl, fileKey);
      }
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  }, [queryClient]);

  const handleAnalyse = useCallback(async (imageId: string, publicUrl: string, fileKey?: string) => {
    setAnalysingIds(s => new Set(s).add(imageId));
    let msgIdx = 0;
    setAnalysingMsg(m => ({ ...m, [imageId]: ANALYSIS_MESSAGES[0] }));
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < ANALYSIS_MESSAGES.length) {
        setAnalysingMsg(m => ({ ...m, [imageId]: ANALYSIS_MESSAGES[msgIdx] }));
      }
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke('analyse-image', {
        body: { image_id: imageId, public_url: publicUrl },
      });

      if (error) throw error;
      if (fileKey) setUploadProgress(p => ({ ...p, [fileKey]: 'complete' }));
      toast.success('Image analysed successfully');
    } catch (e: any) {
      if (fileKey) setUploadProgress(p => ({ ...p, [fileKey]: 'error' }));
      toast.error(e.message || 'Analysis failed');
    } finally {
      clearInterval(interval);
      setAnalysingIds(s => { const n = new Set(s); n.delete(imageId); return n; });
      setAnalysingMsg(m => { const n = { ...m }; delete n[imageId]; return n; });
      queryClient.invalidateQueries({ queryKey: ['brand-images'] });
      queryClient.invalidateQueries({ queryKey: ['image-attributes'] });
    }
  }, [queryClient]);

  const handleDelete = async (imageId: string) => {
    const img = images?.find((i: any) => i.id === imageId);
    if (img) {
      await supabase.storage.from('brand-images').remove([img.storage_path]);
    }
    await supabase.from('brand_images').delete().eq('id', imageId);
    toast.success('Image deleted');
    setConfirmDelete(null);
    setSelectedImage(null);
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
  };

  const statusBadge = (s: string) => {
    if (s === 'complete') return <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4a8c5c]/20 text-[#5aac6c]">✓ Analysed</span>;
    if (s === 'analysing') return <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary animate-pulse">Analysing…</span>;
    if (s === 'error') return <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Error</span>;
    return <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pending</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-7 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] font-light text-foreground">Image Library</h1>
          <p className="text-xs text-muted-foreground">Upload, analyse and connect brand images to products and page sections</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
        </div>
      </header>

      <main className="p-7 max-w-7xl mx-auto space-y-6">
        {/* Upload zone — collapsible */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setUploadOpen(!uploadOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Upload Images
            </span>
            {uploadOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {uploadOpen && (
            <div className="px-4 pb-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-lg p-6 cursor-pointer hover:border-primary/70 transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
              >
                <Upload className="w-6 h-6 text-primary mb-2" />
                <p className="text-sm text-foreground font-medium">
                  {uploading ? 'Uploading & Analysing…' : 'Drop images here or click to browse'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP · Max 10MB each · Multiple files</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
              {/* Upload progress */}
              {Object.entries(uploadProgress).length > 0 && (
                <div className="mt-3 space-y-1">
                  {Object.entries(uploadProgress).map(([name, status]) => (
                    <div key={name} className="flex items-center gap-2 text-[10px]">
                      {status === 'uploading' && <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />}
                      {status === 'analysing' && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
                      {status === 'complete' && <Check className="w-3 h-3 text-[#4a8c5c]" />}
                      {status === 'error' && <X className="w-3 h-3 text-destructive" />}
                      <span className="text-muted-foreground truncate">{name}</span>
                      <span className="capitalize text-foreground">{status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products?.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Sections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTION_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLine} onValueChange={setFilterLine}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="All Lines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              {LINE_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Switch checked={filterApproved} onCheckedChange={setFilterApproved} id="approved-filter" />
            <Label htmlFor="approved-filter" className="text-[10px] text-muted-foreground">Approved only</Label>
          </div>
          <Input
            placeholder="Search alt text or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs w-[200px]"
          />
          <span className="text-[10px] text-muted-foreground ml-auto">{filteredImages.length} images</span>
        </div>

        {/* Bulk action toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-xs text-foreground font-medium">{selectedIds.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => bulkApprove(true)}>
                <Check className="w-3 h-3 mr-1 text-[#4a8c5c]" /> Approve
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => bulkApprove(false)}>
                Unapprove
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => bulkSetFeatured(true)}>
                ★ Feature
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => bulkSetFeatured(false)}>
                Unfeature
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => setConfirmBulkDelete(true)}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Image grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center gap-2 pb-1">
              <button onClick={selectAll} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                {selectedIds.size === filteredImages.length && filteredImages.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  : selectedIds.size > 0
                    ? <MinusSquare className="w-3.5 h-3.5 text-primary" />
                    : <Square className="w-3.5 h-3.5" />
                }
                {selectedIds.size === filteredImages.length && filteredImages.length > 0 ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredImages.map((img: any) => {
                const attrs = img.image_attributes?.[0];
                const isSelected = selectedIds.has(img.id);
                return (
                  <div
                    key={img.id}
                    className={`group rounded-lg border bg-card overflow-hidden cursor-pointer transition-all ${
                      selectedImage === img.id ? 'border-primary ring-1 ring-primary' : isSelected ? 'border-primary/60 ring-1 ring-primary/40' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(selectedImage === img.id ? null : img.id)}
                  >
                    <div className="relative overflow-hidden bg-muted" style={{ maxHeight: 200 }}>
                      <img
                        src={img.public_url}
                        alt={attrs?.alt_text_en || img.filename}
                        className="w-full object-cover"
                        style={{ maxHeight: 200 }}
                        loading="lazy"
                      />
                      {/* Checkbox overlay */}
                      <button
                        className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-black/40 border-white/50 text-transparent group-hover:text-white/70'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      {/* Approved badge */}
                      {attrs?.is_approved && (
                        <span className="absolute bottom-1.5 left-1.5 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4a8c5c]/90 text-white">✓ Approved</span>
                      )}
                      {analysingIds.has(img.id) && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="text-center">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse mx-auto mb-2" />
                            <p className="text-[10px] text-white">{analysingMsg[img.id] || 'Analysing…'}</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 flex gap-1">
                        {attrs?.is_featured && (
                          <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/30 text-primary">Featured</span>
                        )}
                        {statusBadge(img.status || 'pending')}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] text-foreground truncate">{img.filename}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attrs?.product_slugs?.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {img.status !== 'complete' && !analysingIds.has(img.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 text-[9px] px-2"
                            onClick={(e) => { e.stopPropagation(); handleAnalyse(img.id, img.public_url); }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> Analyse
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Image detail drawer */}
        {selectedImage && (
          <ImageDetailDrawer
            imageId={selectedImage}
            attrs={selectedAttrs}
            image={images?.find((i: any) => i.id === selectedImage)}
            products={products || []}
            onClose={() => setSelectedImage(null)}
            onReanalyse={(id, url) => handleAnalyse(id, url)}
            onDelete={(id) => setConfirmDelete(id)}
            queryClient={queryClient}
          />
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
            <div className="bg-card rounded-lg border border-border p-6 max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-admin font-semibold text-foreground mb-2">Delete Image?</h3>
              <p className="text-xs text-muted-foreground mb-4">This will permanently remove the image and all its attributes. This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk delete confirmation */}
        {confirmBulkDelete && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center" onClick={() => setConfirmBulkDelete(false)}>
            <div className="bg-card rounded-lg border border-border p-6 max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-admin font-semibold text-foreground mb-2">Delete {selectedIds.size} Images?</h3>
              <p className="text-xs text-muted-foreground mb-4">This will permanently remove all selected images and their attributes. This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={bulkDeleting}>
                  {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size} Images`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Image Detail Drawer ───
function ImageDetailDrawer({
  imageId, attrs, image, products, onClose, onReanalyse, onDelete, queryClient,
}: {
  imageId: string;
  attrs: any;
  image: any;
  products: any[];
  onClose: () => void;
  onReanalyse: (id: string, url: string) => void;
  onDelete: (id: string) => void;
  queryClient: any;
}) {
  const [form, setForm] = useState<Record<string, any>>(attrs || {});
  const [saving, setSaving] = useState(false);

  // Sync form when attrs loads
  useState(() => { if (attrs) setForm({ ...attrs }); });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleArrayItem = (key: string, item: string) => {
    const arr: string[] = form[key] || [];
    set(key, arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('image_attributes').upsert({
      image_id: imageId,
      alt_text_en: form.alt_text_en || null,
      alt_text_it: form.alt_text_it || null,
      scene_description: form.scene_description || null,
      cocktails_present: form.cocktails_present || [],
      foods_present: form.foods_present || [],
      props_present: form.props_present || [],
      people_present: form.people_present ?? false,
      people_count: form.people_count ?? 0,
      people_setting: form.people_setting || null,
      setting: form.setting || null,
      time_of_day: form.time_of_day || null,
      season: form.season || null,
      mood: form.mood || [],
      dominant_colors: form.dominant_colors || [],
      composition: form.composition || null,
      brightness: form.brightness || null,
      best_for_sections: form.best_for_sections || [],
      suitable_for_lines: form.suitable_for_lines || [],
      is_alcoholic_context: form.is_alcoholic_context ?? false,
      product_slugs: form.product_slugs || [],
      is_approved: form.is_approved ?? false,
      is_featured: form.is_featured ?? false,
      internal_notes: form.internal_notes || null,
    }, { onConflict: 'image_id' });

    // Update product_images join table based on product_slugs + best_for_sections
    const slugs: string[] = form.product_slugs || [];
    const sections: string[] = form.best_for_sections || [];
    if (slugs.length > 0 && sections.length > 0) {
      for (const slug of slugs) {
        const product = products.find(p => p.slug === slug);
        if (!product) continue;
        for (const section of sections) {
          await supabase.from('product_images').upsert({
            product_id: product.id,
            image_id: imageId,
            section,
            sort_order: 0,
          }, { onConflict: 'product_id,image_id,section' });
        }
      }
    }

    setSaving(false);
    if (error) { toast.error('Save failed'); return; }
    toast.success('Attributes saved');
    queryClient.invalidateQueries({ queryKey: ['brand-images'] });
    queryClient.invalidateQueries({ queryKey: ['image-attributes', imageId] });
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex" onClick={onClose}>
      <div className="ml-auto bg-card border-l border-border w-full max-w-3xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-admin font-semibold text-foreground">Image Details</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onReanalyse(imageId, image.public_url)}>
              <RotateCw className="w-3 h-3 mr-1" /> Re-analyse
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(imageId)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Image preview */}
          <div className="lg:w-1/2 p-4">
            <img src={image.public_url} alt="" className="w-full rounded-lg object-contain max-h-[400px]" />
            <p className="text-[10px] text-muted-foreground mt-2">{image.filename} · {image.width}×{image.height} · {image.file_size ? `${(image.file_size / 1024).toFixed(0)}KB` : ''}</p>
          </div>

          {/* Right: Editable form */}
          <div className="lg:w-1/2 p-4 space-y-4 border-t lg:border-t-0 lg:border-l border-border">
            {/* Scene description */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Scene Description</Label>
              <Textarea value={form.scene_description || ''} onChange={e => set('scene_description', e.target.value)} rows={3} className="text-xs mt-1" />
            </div>

            {/* Alt text */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Alt Text (EN)</Label>
                <Input value={form.alt_text_en || ''} onChange={e => set('alt_text_en', e.target.value)} className="text-xs mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Alt Text (IT)</Label>
                <Input value={form.alt_text_it || ''} onChange={e => set('alt_text_it', e.target.value)} className="text-xs mt-1" />
              </div>
            </div>

            {/* Product slugs — multi-select */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Products Linked</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {products.map(p => (
                  <button
                    key={p.slug}
                    onClick={() => toggleArrayItem('product_slugs', p.slug)}
                    className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                      (form.product_slugs || []).includes(p.slug)
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Best for sections */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Best for Sections</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {SECTION_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleArrayItem('best_for_sections', s)}
                    className={`text-[9px] px-2 py-1 rounded border capitalize transition-colors ${
                      (form.best_for_sections || []).includes(s)
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Suitable lines */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Suitable Lines</Label>
              <div className="flex gap-1 mt-1">
                {LINE_OPTIONS.map(l => (
                  <button
                    key={l}
                    onClick={() => toggleArrayItem('suitable_for_lines', l)}
                    className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                      (form.suitable_for_lines || []).includes(l)
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags: cocktails, foods, props */}
            <TagInput label="Cocktails Detected" value={form.cocktails_present || []} onChange={v => set('cocktails_present', v)} />
            <TagInput label="Foods Detected" value={form.foods_present || []} onChange={v => set('foods_present', v)} />
            <TagInput label="Props Detected" value={form.props_present || []} onChange={v => set('props_present', v)} />

            {/* Mood chips */}
            <TagInput label="Mood" value={form.mood || []} onChange={v => set('mood', v)} />

            {/* Selects row */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Setting" value={form.setting} options={SETTING_OPTIONS} onChange={v => set('setting', v)} />
              <SelectField label="Time of Day" value={form.time_of_day} options={TIME_OPTIONS} onChange={v => set('time_of_day', v)} />
              <SelectField label="Season" value={form.season} options={SEASON_OPTIONS} onChange={v => set('season', v)} />
              <SelectField label="Composition" value={form.composition} options={COMPOSITION_OPTIONS} onChange={v => set('composition', v)} />
              <SelectField label="Brightness" value={form.brightness} options={BRIGHTNESS_OPTIONS} onChange={v => set('brightness', v)} />
            </div>

            {/* Dominant colors */}
            {(form.dominant_colors || []).length > 0 && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Dominant Colors</Label>
                <div className="flex gap-2 mt-1">
                  {(form.dominant_colors as string[]).map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} />
                      <span className="text-[9px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded border border-border p-2.5">
                <Label className="text-[10px] text-foreground">Alcoholic Context</Label>
                <Switch checked={form.is_alcoholic_context ?? false} onCheckedChange={v => set('is_alcoholic_context', v)} />
              </div>
              <div className="flex items-center justify-between rounded border border-border p-2.5">
                <Label className="text-[10px] text-[#4a8c5c]">Approved</Label>
                <Switch checked={form.is_approved ?? false} onCheckedChange={v => set('is_approved', v)} />
              </div>
              <div className="flex items-center justify-between rounded border border-border p-2.5">
                <Label className="text-[10px] text-primary">Featured</Label>
                <Switch checked={form.is_featured ?? false} onCheckedChange={v => set('is_featured', v)} />
              </div>
            </div>

            {/* Internal notes */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Internal Notes</Label>
              <Textarea value={form.internal_notes || ''} onChange={e => set('internal_notes', e.target.value)} rows={2} className="text-xs mt-1" />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ───
function TagInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((item, i) => (
          <span key={i} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
            {item}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-destructive">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder="Add…"
          className="text-[9px] bg-transparent border-0 outline-none w-16 text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string | null | undefined; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select value={value || 'undefined'} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o} className="text-xs capitalize">{o.replace('_', ' ')}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
