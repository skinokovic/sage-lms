import { m } from "framer-motion";
import { EASE, VIEWPORT, fadeUp } from "./motionPresets";

/**
 * A container that reveals its animated children one after another.
 *
 * Children opt in by using `m.*` elements with variants={fadeUp} (or
 * <StaggerItem>). Use `immediate` for content that is on screen at load.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  immediate = false,
}) {
  const variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: VIEWPORT };

  return (
    <m.div
      className={className}
      variants={variants}
      initial="hidden"
      {...trigger}
    >
      {children}
    </m.div>
  );
}

/**
 * Wrapper for a component you can't add motion props to (e.g. FeatureCard).
 * It stretches the wrapped component to the full grid-cell height so equal
 * height cards stay equal.
 */
export function StaggerItem({ children, className = "" }) {
  return (
    <m.div variants={fadeUp} className={`h-full [&>*]:h-full ${className}`}>
      {children}
    </m.div>
  );
}

export { EASE };
