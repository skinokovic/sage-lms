import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * Wrap the app once (in App.jsx).
 *
 * - LazyMotion loads only the small "domAnimation" feature set, and `strict`
 *   makes sure nobody accidentally imports the heavy `motion` component
 *   (always use `m` instead).
 * - reducedMotion="user" respects the visitor's "reduce motion" system
 *   setting: movement is switched off and only gentle fades remain.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
