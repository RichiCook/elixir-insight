import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LANG_NAMES: Record<string, string> = {
  EN: 'English',
  IT: 'Italiano',
  FR: 'Français',
  DE: 'Deutsch',
  ES: 'Español',
  PT: 'Português',
};

interface Props {
  langs: string[];
  current: string;
  onChange: (lang: string) => void;
}

export function LanguageDropdown({ langs, current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  // Render even for a single language (still shows the current language).
  if (!langs || langs.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans-consumer text-xs tracking-[0.18em] uppercase text-cc-text hover:bg-cc-cream/70 transition-colors"
      >
        {current}
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 min-w-[152px] rounded-xl border border-cc-border bg-cc-white overflow-hidden z-50"
            style={{ boxShadow: '0 14px 44px -14px rgba(0,0,0,0.28)' }}
          >
            {langs.map((l) => {
              const active = l === current;
              return (
                <li key={l} role="option" aria-selected={active}>
                  <button
                    onClick={() => { onChange(l); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-6 px-4 py-2.5 text-left transition-colors ${
                      active ? 'bg-cc-cream/50' : 'hover:bg-cc-cream/60'
                    }`}
                  >
                    <span className={`font-sans-consumer text-[13px] ${active ? 'text-cc-gold font-medium' : 'text-cc-text-md'}`}>
                      {LANG_NAMES[l] || l}
                    </span>
                    <span className={`font-sans-consumer text-[10px] tracking-[0.18em] uppercase ${active ? 'text-cc-gold' : 'text-cc-text-lt'}`}>
                      {l}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
