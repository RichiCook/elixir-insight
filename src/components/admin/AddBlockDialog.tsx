import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BLOCK_TYPES } from '@/hooks/useSectionConfig';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { Image, X } from 'lucide-react';

interface Props {
  onAdd: (block: {
    section_key: string;
    block_type: string;
    block_config: Record<string, any>;
    custom_content: Record<string, any>;
  }) => void;
  onClose: () => void;
}

export function AddBlockDialog({ onAdd, onClose }: Props) {
  const [step, setStep] = useState<'pick' | 'configure'>('pick');
  const [selectedType, setSelectedType] = useState('');
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'single' | 'carousel'>('single');

  const setConfigField = (k: string, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleAdd = () => {
    if (!label.trim()) return;
    const key = `custom_${Date.now()}`;
    onAdd({
      section_key: key,
      block_type: selectedType,
      block_config: { label: label.trim(), ...config },
      custom_content: {},
    });
    onClose();
  };

  const openImagePicker = (target: 'single' | 'carousel') => {
    setImagePickerTarget(target);
    setShowImagePicker(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-card rounded-lg border border-border p-5 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-foreground">Add Block</h2>

        {step === 'pick' && (
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => {
                  setSelectedType(bt.value);
                  setLabel(bt.label);
                  setStep('configure');
                }}
                className="rounded-lg border border-border p-3 text-left hover:border-primary/50 transition-colors"
              >
                <span className="text-xl">{bt.icon}</span>
                <p className="text-xs text-foreground mt-1">{bt.label}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Block Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs" />
            </div>

            {selectedType === 'text' && (
              <>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Heading (optional)</Label>
                  <Input value={config.heading || ''} onChange={(e) => setConfigField('heading', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Body Text</Label>
                  <Textarea value={config.body || ''} onChange={(e) => setConfigField('body', e.target.value)} rows={3} className="text-xs" />
                </div>
              </>
            )}

            {selectedType === 'image_text' && (
              <>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Image</Label>
                  <div className="flex items-center gap-2">
                    {config.image_url ? (
                      <div className="relative w-16 h-16 rounded border border-border overflow-hidden shrink-0">
                        <img src={config.image_url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setConfigField('image_url', '')} className="absolute top-0 right-0 bg-black/60 p-0.5 rounded-bl">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => openImagePicker('single')} className="text-xs h-8">
                      <Image className="w-3 h-3 mr-1" /> Choose Image
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Heading</Label>
                  <Input value={config.heading || ''} onChange={(e) => setConfigField('heading', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Body Text</Label>
                  <Textarea value={config.body || ''} onChange={(e) => setConfigField('body', e.target.value)} rows={3} className="text-xs" />
                </div>
              </>
            )}

            {selectedType === 'image_carousel' && (
              <>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Images</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(config.images as string[] || []).map((url: string, i: number) => (
                      <div key={i} className="relative w-14 h-14 rounded border border-border overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setConfigField('images', (config.images as string[]).filter((_: string, j: number) => j !== i))}
                          className="absolute top-0 right-0 bg-black/60 p-0.5 rounded-bl"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openImagePicker('carousel')} className="text-xs h-8">
                    <Image className="w-3 h-3 mr-1" /> Add Images
                  </Button>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Heading (optional)</Label>
                  <Input value={config.heading || ''} onChange={(e) => setConfigField('heading', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Auto-play (seconds, 0 = off)</Label>
                  <Input type="number" value={config.autoplay || '0'} onChange={(e) => setConfigField('autoplay', e.target.value)} className="h-8 text-xs" />
                </div>
              </>
            )}

            {selectedType === 'cta' && (
              <>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Button Text</Label>
                  <Input value={config.button_text || ''} onChange={(e) => setConfigField('button_text', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Button URL</Label>
                  <Input value={config.button_url || ''} onChange={(e) => setConfigField('button_url', e.target.value)} className="h-8 text-xs" placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Style</Label>
                  <Input value={config.style || ''} onChange={(e) => setConfigField('style', e.target.value)} className="h-8 text-xs" placeholder="dark / gold / outline" />
                </div>
              </>
            )}

            {selectedType === 'video' && (
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Video URL (YouTube / Vimeo)</Label>
                <Input value={config.video_url || ''} onChange={(e) => setConfigField('video_url', e.target.value)} className="h-8 text-xs" placeholder="https://..." />
              </div>
            )}

            {selectedType === 'spacer' && (
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Height (px)</Label>
                <Input type="number" value={config.height || '32'} onChange={(e) => setConfigField('height', e.target.value)} className="h-8 text-xs" />
              </div>
            )}

            {selectedType === 'custom_html' && (
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">HTML Content</Label>
                <Textarea value={config.html || ''} onChange={(e) => setConfigField('html', e.target.value)} rows={6} className="text-xs font-mono" placeholder="<div>...</div>" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep('pick')} size="sm" className="flex-1">Back</Button>
              <Button onClick={handleAdd} disabled={!label.trim()} size="sm" className="flex-1 bg-primary text-primary-foreground">Add Block</Button>
            </div>
          </div>
        )}

        {step === 'pick' && (
          <Button variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
        )}
      </div>

      {showImagePicker && imagePickerTarget === 'single' && (
        <ImagePickerDialog
          onSelect={(url) => {
            setConfigField('image_url', url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
      {showImagePicker && imagePickerTarget === 'carousel' && (
        <ImagePickerDialog
          multiple
          onSelect={() => {}}
          onSelectMultiple={(urls) => {
            setConfigField('images', [...(config.images || []), ...urls]);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
