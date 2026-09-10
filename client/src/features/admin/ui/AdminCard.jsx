import React from 'react';
import { Box } from '@mui/material';

/**
 * The panel's one container.
 *
 * Post card DNA, as the house style requires: `surfaceRaised`, `radius.lg` on
 * small screens and `radius.xl` from `sm` up, `elevation.e1`, and no border -
 * separation from the page comes from the shadow alone (Phase 8, which the
 * admin panel predated and never got). `interactive` adds the e1 -> e2 hover
 * lift for a card that is itself a link or a button.
 */
const AdminCard = React.forwardRef(
  ({ children, interactive = false, padding = true, accent, sx = {}, ...rest }, ref) => (
    <Box
      ref={ref}
      sx={(theme) => ({
        backgroundColor: theme.custom.color.surfaceRaised,
        borderRadius: {
          xs: `${theme.custom.radius.lg}px`,
          sm: `${theme.custom.radius.xl}px`,
        },
        boxShadow: theme.custom.elevation.e1,
        p: padding ? { xs: 2, sm: 2.5 } : 0,
        // The 6px accent bar is the post card's, reused for a card that
        // belongs to a lost/found side or carries a queue's tone.
        ...(accent
          ? { borderInlineStart: `6px solid ${accent}` }
          : null),
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(interactive
          ? {
              cursor: 'pointer',
              '&:hover': {
                boxShadow: theme.custom.elevation.e2,
                transform: 'translateY(-3px)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.custom.color.brandPrimary}`,
                outlineOffset: 2,
              },
            }
          : null),
        ...(typeof sx === 'function' ? sx(theme) : sx),
      })}
      {...rest}
    >
      {children}
    </Box>
  )
);

AdminCard.displayName = 'AdminCard';

export default AdminCard;
