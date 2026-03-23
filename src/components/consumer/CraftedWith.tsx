import { motion } from 'framer-motion';

interface Props {
  spirit: string;
}

export function CraftedWith({ spirit }: Props) {
  const partners = spirit.split('+').map((s) => s.trim()).filter(Boolean);

  return (
    <section className="px-6 py-6 border-t border-cc-border">
      <p className="font-sans-consumer text-[9px] tracking-[0.16em] uppercase text-cc-gold mb-4">
        ✦ Crafted With
      </p>
      <div className="flex gap-2">
        {partners.map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 rounded-lg border border-cc-border p-3.5 text-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
          >
            <p className="font-display text-lg font-medium text-cc-text leading-tight mb-1">
              {name}
            </p>
            <p className="font-sans-consumer text-[9px] tracking-[0.1em] uppercase text-cc-text-lt">
              Spirit Partner
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
