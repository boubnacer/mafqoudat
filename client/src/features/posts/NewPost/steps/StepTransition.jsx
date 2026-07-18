import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@mui/material";

const OFFSET = 24;

const variants = {
  enter: (dir) => ({ x: dir * OFFSET, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: -dir * OFFSET, opacity: 0 }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

// Wraps a step's content in a short slide+fade transition. `direction` is
// 1 for forward (Next) and -1 for backward (Back / stepper); it gets
// flipped for RTL so "forward" always reads as advancing in the direction
// text flows (S3: forward = slide from left in ar). Respects
// prefers-reduced-motion by dropping the slide and keeping only the fade.
const StepTransition = ({ stepKey, direction, children }) => {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isRtl = theme.direction === 'rtl';
  const effectiveDirection = direction * (isRtl ? -1 : 1);

  return (
    <AnimatePresence mode="wait" initial={false} custom={effectiveDirection}>
      <motion.div
        key={stepKey}
        custom={effectiveDirection}
        variants={prefersReducedMotion ? reducedVariants : variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default StepTransition;
