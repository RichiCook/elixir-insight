import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import {
  useProductSections,
  useDefaultLayoutSections,
  getMergedSections,
  SECTION_DEFINITIONS,
  BLOCK_TYPES,
  type SectionConfig,
} from '@/hooks/useSectionConfig';
import { AddBlockDialog } from '@/components/admin/AddBlockDialog';

interface Props {
  productId: string;
  onSave?: () => void;
}

function getBlockLabel(section: SectionConfig) {
  if (section.block_type === 'built_in') {
    const def = SECTION_DEFINITIONS.find(d => d.key === section.section_key);
    return def?.label || section.section_key;
  }
  return section.block_config?.label || section.section_key;
}

function getBlockIcon(section: SectionConfig) {
  if (section.block_type === 'built_in') return '◆';
  const bt = BLOCK_TYPES.find(b => b.value === section.block_type);
  return bt?.icon || '◆';
}

export function LayoutTab({ productId, onSave }: Props) {
  const { data: savedSections, isLoading } = useProductSections(productId);
  const { data: defaultSections } = useDefaultLayoutSections();
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<ReturnType<typeof getMergedSections>>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);

  useEffect(() => {
    setSections(getMergedSections(savedSections, defaultSections));
  }, [savedSections, defaultSections]);

  const getDef = (key: string) => SECTION_DEFINITIONS.find(d => d.key === key);

  const toggleVisibility = (index: number) => {
    setSections(prev => prev.map((s, i) =>
      i === index ? { ...s, is_visible: !s.is_visible } : s
    ));
  };

  const updateContent = (index: number, fieldKey: string, value: string) => {
    setSections(prev => prev.map((s, i) =>
      i === index ? { ...s, custom_content: { ...s.custom_content, [fieldKey]: value } } : s
    ));
  };

  const updateConfig = (index: number, fieldKey: string, value: string) => {
    setSections(prev => prev.map((s, i) =>
      i === index ? { ...s, block_config: { ...s.block_config, [fieldKey]: value } } : s
    ));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
  };

  const removeSection = (index: number) => {
    const sec = sections[index];
    if (sec.block_type === 'built_in') {
      toast.error('Built-in sections cannot be removed — hide them instead');
      return;
    }
    setSections(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort_order: i })));
  };

  const handleAddBlock = (block: { section_key: string; block_type: string; block_config: Record<string, any>; custom_content: Record<string, any> }) => {
    setSections(prev => [
      ...prev,
      {
        section_key: block.section_key,
        sort_order: prev.length,
        is_visible: true,
        custom_content: block.custom_content,
        block_type: block.block_type,
        block_config: block.block_config,
      },
    ]);
  };

  const handleDragStart = (index: number) => setDragIdx(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const newSections = [...sections];
    const [dragged] = newSections.splice(dragIdx, 1);
    newSections.splice(index, 0, dragged);
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
    setDragIdx(index);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('product_sections').delete().eq('product_id', productId);

      const rows = sections.map((s, i) => ({
        product_id: productId,
        section_key: s.section_key,
        sort_order: i,
        is_visible: s.is_visible,
        custom_content: s.custom_content || {},
        block_type: s.block_type || 'built_in',
        block_config: s.block_config || {},
      }));

      const { error } = await supabase.from('product_sections').insert(rows);
      if (error) throw error;

      toast.success('Layout saved');
      queryClient.invalidateQueries({ queryKey: ['product-sections', productId] });
      onSave?.();
    } catch (err: any) {
      toast.error('Failed to save layout');
    }
    setSaving(false);
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground text-xs">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Page Layout & Content</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Drag to reorder, toggle visibility, edit content, or add custom blocks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddBlock(true)} variant="outline" size="sm">
            <Plus className="w-3 h-3 mr-1" /> Add Block
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground" size="sm">
            {saving ? 'Saving…' : 'Save Layout'}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {sections.map((section, index) => {
          const isBuiltIn = section.block_type === 'built_in';
          const def = isBuiltIn ? getDef(section.section_key) : null;
          const hasEditableFields = isBuiltIn && def && def.editableFields.length > 0;
          const isCustom = !isBuiltIn;
          const isExpanded = expandedKey === section.section_key;

          return (
            <div
              key={section.section_key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-colors ${
                dragIdx === index ? 'border-primary bg-primary/5' : 'border-border bg-card'
              } ${!section.is_visible ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab shrink-0" />
                <div className="flex flex-col gap-0 shrink-0">
                  <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[9px] leading-none">▲</button>
                  <button onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[9px] leading-none">▼</button>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground w-5 text-center shrink-0">{index + 1}</span>
                <span className="text-xs mr-1">{getBlockIcon(section)}</span>
                <span className="text-xs text-foreground flex-1 truncate">{getBlockLabel(section)}</span>

                {isCustom && (
                  <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                    {BLOCK_TYPES.find(b => b.value === section.block_type)?.label || section.block_type}
                  </span>
                )}

                {(hasEditableFields || isCustom) && (
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : section.section_key)}
                    className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Edit
                  </button>
                )}

                {isCustom && (
                  <button onClick={() => removeSection(index)} className="shrink-0 p-1 text-destructive/60 hover:text-destructive transition-colors" title="Remove block">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => toggleVisibility(index)}
                  className={`shrink-0 p-1 rounded transition-colors ${
                    section.is_visible ? 'text-foreground hover:text-muted-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Built-in editable fields */}
              {isExpanded && hasEditableFields && def && (
                <div className="px-4 pb-3 pt-1 border-t border-border space-y-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Content overrides — leave blank to use defaults</p>
                  {def.editableFields.map((field) => (
                    <div key={field.key}>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea value={section.custom_content[field.key] || ''} onChange={(e) => updateContent(index, field.key, e.target.value)} placeholder={field.default || 'Default'} rows={2} className="text-xs" />
                      ) : (
                        <Input value={section.custom_content[field.key] || ''} onChange={(e) => updateContent(index, field.key, e.target.value)} placeholder={field.default || 'Default'} className="h-8 text-xs" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom block editor */}
              {isExpanded && isCustom && (
                <div className="px-4 pb-3 pt-1 border-t border-border space-y-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Block configuration</p>
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block">Block Label</Label>
                    <Input value={section.block_config?.label || ''} onChange={(e) => updateConfig(index, 'label', e.target.value)} className="h-8 text-xs" />
                  </div>
                  {section.block_type === 'text' && (
                    <>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Heading</Label><Input value={section.block_config?.heading || ''} onChange={(e) => updateConfig(index, 'heading', e.target.value)} className="h-8 text-xs" /></div>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Body</Label><Textarea value={section.block_config?.body || ''} onChange={(e) => updateConfig(index, 'body', e.target.value)} rows={3} className="text-xs" /></div>
                    </>
                  )}
                  {section.block_type === 'image_text' && (
                    <>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Image URL</Label><Input value={section.block_config?.image_url || ''} onChange={(e) => updateConfig(index, 'image_url', e.target.value)} className="h-8 text-xs" /></div>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Heading</Label><Input value={section.block_config?.heading || ''} onChange={(e) => updateConfig(index, 'heading', e.target.value)} className="h-8 text-xs" /></div>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Body</Label><Textarea value={section.block_config?.body || ''} onChange={(e) => updateConfig(index, 'body', e.target.value)} rows={3} className="text-xs" /></div>
                    </>
                  )}
                  {section.block_type === 'cta' && (
                    <>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Button Text</Label><Input value={section.block_config?.button_text || ''} onChange={(e) => updateConfig(index, 'button_text', e.target.value)} className="h-8 text-xs" /></div>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Button URL</Label><Input value={section.block_config?.button_url || ''} onChange={(e) => updateConfig(index, 'button_url', e.target.value)} className="h-8 text-xs" /></div>
                      <div><Label className="text-[10px] text-muted-foreground mb-1 block">Style</Label><Input value={section.block_config?.style || ''} onChange={(e) => updateConfig(index, 'style', e.target.value)} className="h-8 text-xs" placeholder="dark / gold / outline" /></div>
                    </>
                  )}
                  {section.block_type === 'video' && (
                    <div><Label className="text-[10px] text-muted-foreground mb-1 block">Video URL</Label><Input value={section.block_config?.video_url || ''} onChange={(e) => updateConfig(index, 'video_url', e.target.value)} className="h-8 text-xs" /></div>
                  )}
                  {section.block_type === 'spacer' && (
                    <div><Label className="text-[10px] text-muted-foreground mb-1 block">Height (px)</Label><Input type="number" value={section.block_config?.height || '32'} onChange={(e) => updateConfig(index, 'height', e.target.value)} className="h-8 text-xs" /></div>
                  )}
                  {section.block_type === 'custom_html' && (
                    <div><Label className="text-[10px] text-muted-foreground mb-1 block">HTML</Label><Textarea value={section.block_config?.html || ''} onChange={(e) => updateConfig(index, 'html', e.target.value)} rows={6} className="text-xs font-mono" /></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save Layout'}
      </Button>

      {showAddBlock && <AddBlockDialog onAdd={handleAddBlock} onClose={() => setShowAddBlock(false)} />}
    </div>
  );
}
