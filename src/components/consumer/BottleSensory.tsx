import { motion } from 'framer-motion';

interface Props {
  description: string;
}

export function BottleSensory({ description }: Props) {
  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-4">
        The Experience
      </h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="font-sans-consumer text-sm leading-relaxed text-cc-text-md"
      >
        {description}
      </motion.p>
    </section>
  );
}
