// Shared timing + variants so every animation on the site feels the same.
// Rules: only opacity and transform, short durations, small distances.

// A calm "ease-out": quick start, soft landing.
export const EASE = [0.22, 1, 0.36, 1];

// For use inside <Stagger>: children inherit the parent's hidden -> show states.
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// A smaller move, for dense UI such as stat tiles or list rows.
export const fadeUpSm = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

// Props for a small floating element that "pops" in (spread onto an m.div).
export const popIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, duration: 0.4, ease: EASE },
});

// Start revealing slightly before an element is fully on screen.
export const VIEWPORT = {
  once: true, // animate the first time only, never replay on scroll back
  amount: "some", // any part visible is enough (safe for very tall sections)
  margin: "0px 0px -40px 0px",
};
