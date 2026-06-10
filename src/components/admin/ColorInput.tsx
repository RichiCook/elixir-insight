/**
 * ColorInput — styled brand color picker.
 * Shows a hex text field + color swatch + a row of preset colors.
 * No external library required.
 */
import { useRef } from 'react';
import { Input } from '@/components/ui/input';

const PRESETS = [
  '#000000', '#ffffff', '#1a1a2e', '#16213e',
  '#0f3460', '#533483', '#e94560', '#f5a623',
  '#f7c948', '#2ecc71', '#1abc9c', '#3498db',
  '#e74c3c', '#95a5a6', '#c0392b', '#8e44ad',
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorInput({ value, onChange }: Props) {
  const nativeRef = useRef<HTMLInputElement>(null);

  // Normalize: ensure value is a valid 6-char hex before passing to native input
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

  return (
    <div className="space-y-2">
      {/* Swatch + hex field row */}
      <div className="flex gap-2 items-center">
        {/* Clickable swatch — opens hidden native picker as fallback for precise picking */}
        <button
          type="button"
          onClick={() => nativeRef.current?.click()}
          title="Pick a colour"
          className="relative w-10 h-10 rounded-md border border-border flex-shrink-0 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform active:scale-95"
          style={{ backgroundColor: safeHex }}
        >
          <input
            ref={nativeRef}
            type="color"
            value={safeHex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        </button>

        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v.startsWith('#') ? v : '#' + v);
          }}
          placeholder="#000000"
          className="flex-1 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => onChange(hex)}
            className="w-6 h-6 rounded border transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{
              backgroundColor: hex,
              borderColor: value.toLowerCase() === hex.toLowerCase()
                ? 'rgba(202,168,80,0.8)'
                : hex === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'transparent',
              boxShadow: value.toLowerCase() === hex.toLowerCase()
                ? '0 0 0 2px rgba(202,168,80,0.4)'
                : 'none',
              transform: value.toLowerCase() === hex.toLowerCase() ? 'scale(1.15)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
