import { motion } from 'framer-motion';
import { useSpiritPartners, findSpiritPartner } from '@/hooks/useSpiritPartners';

interface Props {
  spirit: string;
}

export function CraftedWith({ spirit }: Props) {
  const { data: partners } = useSpiritPartners();
  const names = spirit.split('+').map((s) => s.trim()).filter(Boolean);

  return (
    <section className="px-6 py-6 border-t border-cc-border">
      <p className="font-sans-consumer text-[9px] tracking-[0.16em] uppercase text-cc-gold mb-4">
        ✦ Crafted With
      </p>
      <div className="flex gap-2">
        {names.map((name, i) => {
          const partner = findSpiritPartner(partners, name);
          const safeSite = partner?.website_url && /^https?:\/\//i.test(partner.website_url)
            ? partner.website_url
            : undefined;
          const card = (
            <div className="flex flex-col items-center justify-center gap-1.5 h-full">
              {partner?.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={name}
                  className="h-10 w-auto max-w-full object-contain"
                />
              ) : (
                <p className="font-display text-lg font-medium text-cc-text leading-tight">
                  {name}
                </p>
              )}
              <p className="font-sans-consumer text-[9px] tracking-[0.1em] uppercase text-cc-text-lt">
                Spirit Partner
              </p>
            </div>
          );
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 rounded-lg border border-cc-border p-3.5 text-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
            >
              {safeSite ? (
                <a href={safeSite} target="_blank" rel="noopener noreferrer" className="block">
                  {card}
                </a>
              ) : (
                card
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
