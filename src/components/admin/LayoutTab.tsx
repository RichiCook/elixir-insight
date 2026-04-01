import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GripVertical, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import {
  useProductSections,
  getMergedSections,
  SECTION_DEFINITIONS,
  type SectionConfig,
} from '@/hooks/useSectionConfig';

interface Props {
  productId: string;
  onSave?: () => void;
}

export function LayoutTab({ productId, onSave }: Props) {
  const { data: savedSections, isLoading } = useProductSections(productId);
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<ReturnType<typeof getMergedSections>>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    setSections(getMergedSections(savedSections));
  }, [savedSections]);

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

  const moveSection = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
  };

  const handleDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const newSections = [...sections];
    const [dragged] = newSections.splice(dragIdx, 1);
    newSections.splice(index, 0, dragged);
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
    setDragIdx(index);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing and re-insert all
      await supabase.from('product_sections').delete().eq('product_id', productId);

      const rows = sections.map((s, i) => ({
        product_id: productId,
        section_key: s.section_key,
        sort_order: i,
        is_visible: s.is_visible,
        custom_content: s.custom_content || {},
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
            Drag to reorder sections, toggle visibility, and edit content blocks
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground" size="sm">
          {saving ? 'Saving…' : 'Save Layout'}
        </Button>
      </div>

      <div className="space-y-1">
        {sections.map((section, index) => {
          const def = getDef(section.section_key);
          if (!def) return null;
          const hasEditableFields = def.editableFields.length > 0;
          const isExpanded = expandedKey === section.section_key;

          return (
            <div
              key={section.section_key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-colors ${
                dragIdx === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              } ${!section.is_visible ? 'opacity-50' : ''}`}
            >
              {/* Section row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Drag handle */}
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab shrink-0" />

                {/* Reorder buttons */}
                <div className="flex flex-col gap-0 shrink-0">
                  <button
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                  >▲</button>
                  <button
                    onClick={() => moveSection(index, 1)}
                    disabled={index === sections.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                  >▼</button>
                </div>

                {/* Order number */}
                <span className="text-[9px] font-mono text-muted-foreground w-5 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Section name */}
                <span className="text-xs text-foreground flex-1 truncate">{def.label}</span>

                {/* Editable indicator */}
                {hasEditableFields && (
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : section.section_key)}
                    className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Edit
                  </button>
                )}

                {/* Visibility toggle */}
                <button
                  onClick={() => toggleVisibility(index)}
                  className={`shrink-0 p-1 rounded transition-colors ${
                    section.is_visible ? 'text-foreground hover:text-muted-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={section.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}
                >
                  {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded content editor */}
              {isExpanded && hasEditableFields && (
                <div className="px-4 pb-3 pt-1 border-t border-border space-y-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    Content overrides — leave blank to use defaults
                  </p>
                  {def.editableFields.map((field) => (
                    <div key={field.key}>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={section.custom_content[field.key] || ''}
                          onChange={(e) => updateContent(index, field.key, e.target.value)}
                          placeholder={field.default || 'Default'}
                          rows={2}
                          className="text-xs"
                        />
                      ) : (
                        <Input
                          value={section.custom_content[field.key] || ''}
                          onChange={(e) => updateContent(index, field.key, e.target.value)}
                          placeholder={field.default || 'Default'}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save Layout'}
      </Button>
    </div>
  );
}
