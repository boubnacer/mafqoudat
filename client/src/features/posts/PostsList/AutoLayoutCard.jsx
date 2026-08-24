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
 * One entry per step. Everything here is layout - direction, span, size - and
 * nothing here is color: the card's surface, radius and elevation are the same
 * at every step, because a step is the same card at another density, not
 * another card.
 */
export const stepStyles = {
  1: {
    gridColumn: "span 1",
    contentDirection: "column",
    mediaBasis: "100%",
    mediaHeight: { xs: 260, sm: 200 },
    metaDirection: "column",
    metaAlign: "flex-start",
    metaJustify: "flex-start",
    metaWidth: "100%",
    showDetails: false,
  },
  2: {
    gridColumn: { xs: "span 1", sm: "span 2" },
    contentDirection: "column",
    mediaBasis: "100%",
    mediaHeight: { xs: 260, sm: 240 },
    metaDirection: { xs: "column", sm: "row" },
    metaAlign: { xs: "flex-start", sm: "center" },
    metaJustify: "space-between",
    metaWidth: "100%",
    showDetails: false,
  },
  3: {
    gridColumn: { xs: "span 1", sm: "1 / -1" },
    contentDirection: { xs: "column", md: "row" },
    mediaBasis: { xs: "100%", md: "40%" },
    mediaHeight: { xs: 260, md: 340 },
    metaDirection: { xs: "column", sm: "row" },
    metaAlign: { xs: "flex-start", sm: "center" },
    metaJustify: "space-between",
    metaWidth: "100%",
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
          flexDirection: currentStyle.contentDirection,
          backgroundColor: theme.custom.color.surfaceRaised,
          borderRadius: `${theme.custom.radius.lg}px`,
          boxShadow: theme.custom.elevation.e1,
          overflow: "hidden",
          cursor: "pointer",
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: theme.custom.elevation.e2 },
          ...sx,
        }}
      >
        {children}
      </Card>
    </MotionBox>
  );
};

/**
 * The step control. Uses the same translucent-surface badge language as the
 * card's date badge rather than introducing a new pill.
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
          position: "absolute",
          bottom: 12,
          insetInlineStart: 12,
          zIndex: 11,
          padding: 0.5,
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
          color: theme.custom.color.ink,
          "&:hover": { backgroundColor: theme.custom.color.surfaceRaised },
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
};
