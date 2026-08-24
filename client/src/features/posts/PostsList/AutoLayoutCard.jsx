import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Box,
  Card,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { UnfoldMore, UnfoldLess } from "@mui/icons-material";
import { useTranslation } from "../../../utils/translations";

/**
 * Auto-layout post card: the posts-list card reflows through three densities
 * instead of being one fixed shape.
 *
 * The reference implementation this is a port of was a Tailwind/shadcn
 * component that cycled a fixed pixel width (400 -> 550 -> 700) on click.
 * Neither of those survives contact with this app, deliberately:
 *
 *  - This is MUI + Emotion, and every color/radius/elevation here has to come
 *    off `theme.custom` (see CLAUDE.md), so the step table below describes the
 *    layout only and the card itself keeps the Phase 3 post card DNA.
 *  - A card in a responsive CSS grid cannot own its own width. A step widens
 *    the card by spanning more grid columns, so the grid stays the grid; the
 *    step table maps each step to a `gridColumn` per breakpoint rather than to
 *    a pixel width.
 *  - Clicking the card still opens the listing. This is a classifieds list -
 *    the click that reaches a post is the one thing on the card that cannot
 *    become a layout toggle - so the step control is its own button.
 *
 * Motion is framer-motion's `layout`, which measures the before/after boxes and
 * tweens between them. That is also what makes this RTL-safe with no mirrored
 * variant: nothing is animated along a hardcoded axis, the boxes are simply
 * measured after the browser has laid them out in whichever direction applies.
 */

export const AUTO_LAYOUT_STEP_COUNT = 3;

/**
 * One entry per step. Everything here is size and span, and nothing here is
 * color: the card's surface, radius and elevation are the same at every step,
 * because a step is the same card at another density, not another card. The
 * stack itself (badge row, title, media, copy) never reorders either - a step
 * gives it more room and more to say, it does not rearrange it.
 */
export const stepStyles = {
  1: {
    gridColumn: "span 1",
    mediaHeight: { xs: 200, sm: 190 },
    contentMaxWidth: "none",
    titleSize: { xs: "2rem", sm: "1.9rem" },
    descriptionLines: 2,
    showDetails: false,
  },
  2: {
    gridColumn: { xs: "span 1", sm: "span 2" },
    mediaHeight: { xs: 220, sm: 280 },
    contentMaxWidth: "none",
    titleSize: { xs: "2.2rem", sm: "2.6rem" },
    descriptionLines: 3,
    showDetails: false,
  },
  3: {
    gridColumn: { xs: "span 1", sm: "1 / -1" },
    mediaHeight: { xs: 240, sm: 340 },
    // The card takes the whole row at this step, but a line of copy running the
    // full width of a four-column grid is unreadable, so the stack inside it
    // stays a column and centres.
    contentMaxWidth: 860,
    titleSize: { xs: "2.4rem", sm: "3.2rem" },
    descriptionLines: 4,
    showDetails: true,
  },
};

/** Cycles 1 -> 2 -> 3 -> 1, the same cycle the reference component used. */
export const useAutoLayoutStep = () => {
  const [step, setStep] = useState(1);

  const nextStep = useCallback((event) => {
    // The card underneath opens the listing; the toggle must not.
    event?.stopPropagation();
    setStep((previous) => ((previous % AUTO_LAYOUT_STEP_COUNT) + 1));
  }, []);

  return { step, stepStyle: stepStyles[step], nextStep };
};

/**
 * Layout tweens are opt-out, not conditional: a visitor who asked for reduced
 * motion gets the same steps with no tween created at all (same rule as the
 * dashboard's GSAP work in useDashboardMotion.js).
 */
export const useAutoLayoutMotion = () => {
  const prefersReducedMotion = useReducedMotion();
  return {
    animateLayout: !prefersReducedMotion,
    layoutTransition: prefersReducedMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  };
};

/** A `motion.div` that still takes `sx`, so steps can be responsive. */
export const MotionBox = (props) => <Box component={motion.div} {...props} />;

/**
 * Grid cell + card. The cell is what changes span, the card is what holds the
 * post card DNA: surfaceRaised, radius.lg, elevation e1 -> e2 on hover with a
 * -4px lift. The lift is a framer `whileHover` rather than a CSS transition
 * because framer writes `transform` inline while animating layout, and an
 * inline transform beats a stylesheet one - as a CSS hover lift it simply
 * stopped working the moment the card became a motion element.
 */
export const AutoLayoutCardShell = ({ step, onClick, children, sx }) => {
  const theme = useTheme();
  const { animateLayout, layoutTransition } = useAutoLayoutMotion();
  const currentStyle = stepStyles[step];

  return (
    <MotionBox
      layout={animateLayout}
      transition={layoutTransition}
      whileHover={animateLayout ? { y: -4 } : undefined}
      sx={{ gridColumn: currentStyle.gridColumn, minWidth: 0 }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.custom.color.surfaceRaised,
          borderRadius: `${theme.custom.radius.xl}px`,
          boxShadow: theme.custom.elevation.e1,
          overflow: "hidden",
          cursor: "pointer",
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: theme.custom.elevation.e2 },
          ...sx,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            width: "100%",
            maxWidth: currentStyle.contentMaxWidth,
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Card>
    </MotionBox>
  );
};

/**
 * The step control, sitting in the card's header row beside the open action.
 * Quiet on purpose: it changes how much of a listing you see, which should
 * never compete with the action that opens the listing itself.
 */
export const StepToggle = ({ step, onClick }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isLastStep = step === AUTO_LAYOUT_STEP_COUNT;
  const label = isLastStep ? t("collapsePreview") : t("expandPreview");
  const Icon = isLastStep ? UnfoldLess : UnfoldMore;

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={onClick}
        aria-label={label}
        aria-expanded={step > 1}
        size="small"
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: alpha(theme.custom.color.ink, 0.06),
          color: alpha(theme.custom.color.ink, 0.7),
          "&:hover": { backgroundColor: alpha(theme.custom.color.ink, 0.12) },
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
};
