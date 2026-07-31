// Reveal — wraps a section so it fades/slides in once when it scrolls into
// view, instead of every section re-implementing the same framer-motion
// boilerplate. `once: true` so it doesn't re-trigger on scroll-back, which
// reads as jittery rather than polished. Respects prefers-reduced-motion
// via framer-motion's built-in handling.

import { motion } from "framer-motion";

export function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
