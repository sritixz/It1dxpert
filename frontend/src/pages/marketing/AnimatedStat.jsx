// AnimatedStat — counts up from 0 to a numeric target once it scrolls into
// view. For non-numeric stats (e.g. "70–180"), pass `value` as a plain
// string instead of `target` and it just reveals without counting —
// counting up something that isn't actually a count would read as a
// gimmick, not a signal.

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

export function AnimatedStat({ target, value, suffix = "", prefix = "", label }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView || target == null) return;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center sm:text-left"
    >
      <p className="numeral text-3xl font-semibold text-ink lg:text-4xl">
        {prefix}
        {target != null ? display : value}
        {suffix}
      </p>
      <p className="mt-1 font-body text-sm text-muted">{label}</p>
    </motion.div>
  );
}
