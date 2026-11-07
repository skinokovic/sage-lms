import { m } from "framer-motion";
import { EASE, VIEWPORT } from "./motionPresets";

/**
 * Fades an element up into place.
 *
 *   <Reveal>...</Reveal>                  when it scrolls into view (once)
 *   <Reveal immediate delay={0.2}>...</Reveal>   on first render (hero content)
 *
 * Props: className (applied to the wrapper), delay (s), y (px, start offset;
 * use 0 for a pure fade), duration (s).
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  duration = 0.5,
  immediate = false,
}) {
  const hidden = { opacity: 0, y };
  const shown = {
    opacity: 1,
    y: 0,
    transition: { duration, delay, ease: EASE },
  };

  const trigger = immediate
    ? { animate: shown }
    : { whileInView: shown, viewport: VIEWPORT };

  return (
    <m.div className={className} initial={hidden} {...trigger}>
      {children}
    </m.div>
  );
}
