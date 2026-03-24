import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useActivation, useCreateActivation, useUpdateActivation, useBrands, useCreateBrand, useActivationLeads, type ActivationType, type ActivationStatus, type TargetingMode } from '@/hooks/useActivations';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const STEPS = ['Define', 'Content', 'Targeting', 'Schedule', 'Review'];

const TYPE_OPTIONS: { value: ActivationType; label: string; desc: string }[] = [
  { value: 'text_image', label: 'Text / Image', desc: 'Simple visual content with optional CTA' },
  { value: 'video', label: 'Video', desc: 'Embedded video player with autoplay toggle' },
  { value: 'banner_cta', label: 'Banner with CTA', desc: 'Text + button linking to an action' },
  { value: 'custom_html', label: 'Custom HTML', desc: 'Raw embed with sandboxed rendering' },
  { value: 'lead_capture', label: 'Lead Capture', desc: 'Form to collect name, email, etc.' },
  { value: 'lead_capture_rating', label: 'Lead + Rating', desc: 'Rating step followed by form submission' },
];

const PLACEMENT_OPTIONS = [
  { value: 'after_hero', label: 'After Hero' },
  { value: 'after_serve', label: 'After How to Serve' },
  { value: 'after_sensory', label: 'After Sensory' },
  { value: 'after_composition', label: 'After Composition' },
  { value: 'after_moments', label: 'After Serve Moments' },
  { value: 'after_pairings', label: 'After Pairings' },
  { value: 'after_ingredients', label: 'After Ingredients' },
  { value: 'after_nutrition', label: 'After Nutritional Passport' },
  { value: 'before_cta', label: 'Before Store CTA' },
  { value: 'after_editorial', label: 'After Editorial' },
  { value: 'overlay_modal', label: 'Overlay / Modal' },
];

interface ActivationDraft {
  name: string;
  brand_id: string;
  activation_type: ActivationType;
  content: Record<string, any>;
  targeting_mode: TargetingMode;
  target_product_ids: string[];
  target_collection_ids: string[];
  placement: string;
  start_date: string | null;
  end_date: string | null;
  status: ActivationStatus;
  priority: number;
}

const DEFAULT_DRAFT: ActivationDraft = {
  name: '',
  brand_id: '',
  activation_type: 'text_image',
  content: {},
  targeting_mode: 'products',
  target_product_ids: [],
  target_collection_ids: [],
  placement: 'after_hero',
  start_date: null,
  end_date: null,
  status: 'draft',
  priority: 0,
};

export default function AdminActivationEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const { data: existing } = useActivation(isNew ? duplicateId || undefined : id);
  const { data: brands } = useBrands();
  const { data: products } = useProducts();
  const { data: leads } = useActivationLeads(isNew ? undefined : id);
  const createMutation = useCreateActivation();
  const updateMutation = useUpdateActivation();
  const createBrandMutation = useCreateBrand();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ActivationDraft>(DEFAULT_DRAFT);
  const [productSearch, setProductSearch] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    if (existing) {
      setDraft({
        name: isNew && duplicateId ? `${existing.name} (Copy)` : existing.name,
        brand_id: existing.brand_id,
        activation_type: existing.activation_type,
        content: existing.content || {},
        targeting_mode: existing.targeting_mode,
        target_product_ids: existing.target_product_ids || [],
        target_collection_ids: existing.target_collection_ids || [],
        placement: existing.placement,
        start_date: existing.start_date,
        end_date: existing.end_date,
        status: isNew ? 'draft' : existing.status,
        priority: existing.priority,
      });
    }
  }, [existing, isNew, duplicateId]);

  const update = (patch: Partial<ActivationDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = async (publish = false) => {
    if (!draft.name || !draft.brand_id) {
      toast.error('Name and brand are required');
      return;
    }
    const payload = {
      ...draft,
      status: publish ? 'active' as ActivationStatus : draft.status,
    };
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync(payload);
        toast.success('Activation created');
        navigate(`/admin/activations/${(result as any).id}`);
      } else {
        await updateMutation.mutateAsync({ id: id!, ...payload });
        toast.success('Activation updated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName) return;
    try {
      const brand = await createBrandMutation.mutateAsync({
        name: newBrandName,
        slug: newBrandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      });
      update({ brand_id: brand.id });
      setShowNewBrand(false);
      setNewBrandName('');
      toast.success('Brand created');
    } catch {
      toast.error('Failed to create brand');
    }
  };

  const toggleProduct = (productId: string) => {
    update({
      target_product_ids: draft.target_product_ids.includes(productId)
        ? draft.target_product_ids.filter((id) => id !== productId)
        : [...draft.target_product_ids, productId],
    });
  };

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">
            {isNew ? 'New Activation' : `Edit: ${draft.name}`}
          </h1>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/activations">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => handleSave(false)}>Save Draft</Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => handleSave(true)}>Publish</Button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex gap-1 max-w-3xl mx-auto">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={cn(
                'flex-1 text-center py-2 text-[10px] uppercase tracking-[0.12em] rounded transition-colors',
                i === step ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* STEP 0: Define */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Activation Name *</Label>
              <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Summer Campaign 2026" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand *</Label>
              {showNewBrand ? (
                <div className="flex gap-2">
                  <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Brand name" className="flex-1" />
                  <Button size="sm" onClick={handleCreateBrand}>Create</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewBrand(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={draft.brand_id} onValueChange={(v) => update({ brand_id: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {brands?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => setShowNewBrand(true)}>+ New</Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => update({ activation_type: t.value, content: {} })}
                    className={cn(
                      'text-left p-3 rounded-lg border transition-colors',
                      draft.activation_type === t.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Placement</Label>
              <Select value={draft.placement} onValueChange={(v) => update({ placement: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} className="bg-primary text-primary-foreground">Next →</Button>
            </div>
          </div>
        )}

        {/* STEP 1: Content */}
        {step === 1 && (
          <div className="space-y-5">
            <ContentEditor type={draft.activation_type} content={draft.content} onChange={(c) => update({ content: c })} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>← Back</Button>
              <Button onClick={() => setStep(2)} className="bg-primary text-primary-foreground">Next →</Button>
            </div>
          </div>
        )}

        {/* STEP 2: Targeting */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Targeting Mode</Label>
              <Select value={draft.targeting_mode} onValueChange={(v) => update({ targeting_mode: v as TargetingMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">By Products</SelectItem>
                  <SelectItem value="collections">By Collections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {draft.targeting_mode === 'products' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Select Products ({draft.target_product_ids.length} selected)
                </Label>
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                  {filteredProducts?.map((p) => {
                    const selected = draft.target_product_ids.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors text-sm',
                          selected ? 'bg-primary/15 text-foreground' : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <span>{p.name} <span className="text-[10px] opacity-50">({p.line})</span></span>
                        {selected && <span className="text-primary">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} className="bg-primary text-primary-foreground">Next →</Button>
            </div>
          </div>
        )}

        {/* STEP 3: Scheduling */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Start Date</Label>
                <DatePickerField
                  value={draft.start_date ? new Date(draft.start_date) : undefined}
                  onChange={(d) => update({ start_date: d?.toISOString() || null })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">End Date</Label>
                <DatePickerField
                  value={draft.end_date ? new Date(draft.end_date) : undefined}
                  onChange={(d) => update({ end_date: d?.toISOString() || null })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Priority (higher = shown first)</Label>
              <Input type="number" value={draft.priority} onChange={(e) => update({ priority: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)} className="bg-primary text-primary-foreground">Next →</Button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h3 className="font-display text-lg text-foreground">Review Activation</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                  <p className="text-foreground">{draft.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                  <p className="text-foreground">{TYPE_OPTIONS.find((t) => t.value === draft.activation_type)?.label}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Brand</p>
                  <p className="text-foreground">{brands?.find((b) => b.id === draft.brand_id)?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Placement</p>
                  <p className="text-foreground">{PLACEMENT_OPTIONS.find((p) => p.value === draft.placement)?.label}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Products</p>
                  <p className="text-foreground">{draft.target_product_ids.length} selected</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Schedule</p>
                  <p className="text-foreground">
                    {draft.start_date ? format(new Date(draft.start_date), 'PP') : 'No start'} → {draft.end_date ? format(new Date(draft.end_date), 'PP') : 'Ongoing'}
                  </p>
                </div>
              </div>

              {/* Content preview */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Content Preview</p>
                <pre className="text-[11px] text-muted-foreground bg-muted/30 rounded p-3 overflow-auto max-h-40">
                  {JSON.stringify(draft.content, null, 2)}
                </pre>
              </div>
            </div>

            {/* Leads table (edit mode only) */}
            {!isNew && leads && leads.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-display text-lg text-foreground mb-3">Captured Leads ({leads.length})</h3>
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Rating</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l: any) => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 text-foreground">{l.name || '—'}</td>
                          <td className="py-2 text-muted-foreground">{l.email || '—'}</td>
                          <td className="py-2 text-primary">{l.rating ? `${'★'.repeat(l.rating)}${'☆'.repeat(5 - l.rating)}` : '—'}</td>
                          <td className="py-2 text-muted-foreground">{l.created_at ? format(new Date(l.created_at), 'PP') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>← Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave(false)}>Save as Draft</Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => handleSave(true)}>Publish Activation</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// -- Content Editor per type --
function ContentEditor({ type, content, onChange }: { type: ActivationType; content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const set = (key: string, value: any) => onChange({ ...content, [key]: value });

  switch (type) {
    case 'text_image':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Headline</Label>
            <Input value={content.headline || ''} onChange={(e) => set('headline', e.target.value)} placeholder="Campaign headline" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Body Text</Label>
            <Textarea value={content.body || ''} onChange={(e) => set('body', e.target.value)} placeholder="Body copy..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Image URL</Label>
            <Input value={content.image_url || ''} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">CTA Text (optional)</Label>
            <Input value={content.cta_text || ''} onChange={(e) => set('cta_text', e.target.value)} placeholder="Learn More" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">CTA URL</Label>
            <Input value={content.cta_url || ''} onChange={(e) => set('cta_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Background Color</Label>
            <Input value={content.bg_color || '#1a1a1a'} onChange={(e) => set('bg_color', e.target.value)} />
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Video URL (YouTube/Vimeo embed)</Label>
            <Input value={content.video_url || ''} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtube.com/embed/..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Caption</Label>
            <Input value={content.caption || ''} onChange={(e) => set('caption', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={content.autoplay || false} onCheckedChange={(v) => set('autoplay', v)} />
            <Label className="text-xs text-muted-foreground">Autoplay</Label>
          </div>
        </div>
      );

    case 'banner_cta':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Banner Text</Label>
            <Input value={content.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="Limited time offer!" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">CTA Button Text</Label>
            <Input value={content.cta_text || ''} onChange={(e) => set('cta_text', e.target.value)} placeholder="Shop Now" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">CTA URL</Label>
            <Input value={content.cta_url || ''} onChange={(e) => set('cta_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Background Color</Label>
            <Input value={content.bg_color || '#b8975a'} onChange={(e) => set('bg_color', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Text Color</Label>
            <Input value={content.text_color || '#ffffff'} onChange={(e) => set('text_color', e.target.value)} />
          </div>
        </div>
      );

    case 'custom_html':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">HTML Content</Label>
            <Textarea
              value={content.html || ''}
              onChange={(e) => set('html', e.target.value)}
              placeholder="<div>...</div>"
              className="font-mono text-xs min-h-[200px]"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">⚠ HTML will be rendered in a sandboxed iframe for security.</p>
        </div>
      );

    case 'lead_capture':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Form Title</Label>
            <Input value={content.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Sign up for updates" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
            <Textarea value={content.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Get exclusive offers..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fields to collect</Label>
            <div className="flex gap-3 flex-wrap">
              {['name', 'email', 'phone'].map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={(content.fields || ['name', 'email']).includes(field)}
                    onCheckedChange={(v) => {
                      const fields = content.fields || ['name', 'email'];
                      set('fields', v ? [...fields, field] : fields.filter((f: string) => f !== field));
                    }}
                  />
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Submit Button Text</Label>
            <Input value={content.submit_text || 'Submit'} onChange={(e) => set('submit_text', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Success Message</Label>
            <Input value={content.success_message || 'Thank you!'} onChange={(e) => set('success_message', e.target.value)} />
          </div>
        </div>
      );

    case 'lead_capture_rating':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Rating Question</Label>
            <Input value={content.rating_question || ''} onChange={(e) => set('rating_question', e.target.value)} placeholder="How would you rate this product?" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Max Rating</Label>
            <Select value={String(content.max_rating || 5)} onValueChange={(v) => set('max_rating', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="10">10 Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Form Title (after rating)</Label>
            <Input value={content.form_title || ''} onChange={(e) => set('form_title', e.target.value)} placeholder="Tell us more..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fields</Label>
            <div className="flex gap-3 flex-wrap">
              {['name', 'email', 'phone'].map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={(content.fields || ['name', 'email']).includes(field)}
                    onCheckedChange={(v) => {
                      const fields = content.fields || ['name', 'email'];
                      set('fields', v ? [...fields, field] : fields.filter((f: string) => f !== field));
                    }}
                  />
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Reward Code (optional)</Label>
            <Input value={content.reward_code || ''} onChange={(e) => set('reward_code', e.target.value)} placeholder="SUMMER10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Success Message</Label>
            <Input value={content.success_message || 'Thank you!'} onChange={(e) => set('success_message', e.target.value)} />
          </div>
        </div>
      );
  }
}

// -- Date picker --
function DatePickerField({ value, onChange }: { value?: Date; onChange: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          {value ? format(value, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}
