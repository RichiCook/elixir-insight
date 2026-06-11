import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface Props {
  url: string;
  /** Small uppercase label on the left of the field. */
  label?: string;
}

/**
 * Read-only public-URL field with copy-to-clipboard + open-in-new-tab.
 * Used to surface the shareable bottle-page link on the product editor and
 * collaboration pages.
 */
export function CopyLink({ url, label = 'Public link' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be blocked (e.g. insecure context) — the field is still
      // selectable so the user can copy manually.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center flex-1 min-w-0 rounded-md border border-border bg-muted/40 overflow-hidden">
        {label && (
          <span className="px-2.5 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground border-r border-border shrink-0">
            {label}
          </span>
        )}
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
        />
      </div>
      <button
        type="button"
        onClick={copy}
        title="Copy link"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open link in a new tab"
        className="shrink-0 inline-flex items-center rounded-md border border-border px-2 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
