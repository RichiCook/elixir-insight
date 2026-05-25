export function Badge({ type }: { type: 'STICKER' | 'WEBSITE' | 'BOTTLE' }) {
  const colors = {
    STICKER: 'bg-amber-500/20 text-amber-400',
    WEBSITE: 'bg-blue-500/20 text-blue-400',
    BOTTLE: 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[type]}`}>
      {type}
    </span>
  );
}
