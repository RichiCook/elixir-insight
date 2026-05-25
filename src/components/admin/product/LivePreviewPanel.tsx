import { useState, useEffect, useCallback, useRef } from 'react';
import { Smartphone, RefreshCw } from 'lucide-react';

export function LivePreviewPanel({ slug }: { slug: string }) {
  const [previewLang, setPreviewLang] = useState('EN');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const refreshPreview = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    (window as any).__refreshPreview = () => { setTimeout(refreshPreview, 2000); };
    return () => { delete (window as any).__refreshPreview; };
  }, [refreshPreview]);

  const previewUrl = `/bottle/${slug}?lang=${previewLang}&preview=true`;

  return (
    <div className="w-[390px] shrink-0 border-l border-border bg-card flex flex-col sticky top-0 h-screen">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] uppercase tracking-[0.15em] text-primary font-mono">Live Preview</span>
        </div>
        <div className="flex items-center gap-1">
          {(['EN', 'IT'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setPreviewLang(l)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider transition-colors ${
                previewLang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-muted'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 overflow-hidden">
        <div className="w-full h-full overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={previewUrl}
            style={{ width: '390px', height: '100%', border: 'none' }}
            title="Live Preview"
          />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border">
        <button
          onClick={refreshPreview}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh Preview
        </button>
      </div>
    </div>
  );
}
