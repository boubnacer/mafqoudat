import { alpha } from '@mui/material';

/**
 * Every coloured state the panel shows, resolved from `theme.custom` alone.
 *
 * Five tones, no more. The panel has a lot of vocabularies to render - report
 * statuses, listing statuses, promotion statuses, support priorities, database
 * thresholds - and if each one picks its own colours the screen stops meaning
 * anything. So each vocabulary maps onto these five, and the five come from the
 * design tokens:
 *
 *   brand     brandPrimary   in progress / under review / the app's own accent
 *   positive  status.found   done, healthy, active
 *   attention status.pending waiting on a human
 *   critical  status.lost    refused, suspended, over a limit
 *   neutral   ink wash       closed, dismissed, expired - real states that are
 *                            nonetheless nobody's problem any more
 *
 * `bg` is the tint a pill sits on, `main` the solid the label is drawn in - the
 * same tint-plus-solid-text pairing status tokens already use everywhere else.
 * `solid`/`onSolid` are for the rare filled shape (a chart mark, a meter fill).
 */
export const adminTone = (theme, tone = 'neutral') => {
  const { color, status } = theme.custom;

  switch (tone) {
    case 'brand':
      return {
        main: color.brandPrimary,
        bg: alpha(color.brandPrimary, theme.palette.mode === 'dark' ? 0.18 : 0.1),
        solid: color.brandPrimary,
        onSolid: theme.palette.getContrastText(color.brandPrimary),
      };
    case 'positive':
      return {
        main: status.found.main,
        bg: status.found.bg,
        solid: status.found.main,
        onSolid: theme.palette.getContrastText(status.found.main),
      };
    case 'attention':
      return {
        main: status.pending.main,
        bg: status.pending.bg,
        solid: status.pending.main,
        onSolid: theme.palette.getContrastText(status.pending.main),
      };
    case 'critical':
      return {
        main: status.lost.main,
        bg: status.lost.bg,
        solid: status.lost.main,
        onSolid: theme.palette.getContrastText(status.lost.main),
      };
    case 'neutral':
    default:
      return {
        main: theme.palette.text.secondary,
        bg: alpha(color.ink, theme.palette.mode === 'dark' ? 0.1 : 0.05),
        solid: alpha(color.ink, 0.45),
        onSolid: color.surfaceRaised,
      };
  }
};

/**
 * The vocabularies, each mapped onto the five tones above.
 *
 * Kept as data rather than a switch per component, so a status can never read
 * as amber in one table and grey in the next - which is what the old panel did
 * (`getStatusColor` in AdminDashboard.jsx said `dismissed` was an error, its
 * twin in PostsTable.jsx said `suspended` was).
 */
export const TONE_BY_STATE = {
  // Report queue
  pending: 'attention',
  reviewed: 'brand',
  resolved: 'positive',
  dismissed: 'neutral',
  // Listing lifecycle
  active: 'positive',
  expired: 'neutral',
  suspended: 'critical',
  // Promotions + password resets
  requested: 'attention',
  processed: 'positive',
  rejected: 'critical',
  // Support inbox
  new: 'brand',
  in_progress: 'attention',
  closed: 'neutral',
  // Support priority
  low: 'neutral',
  medium: 'brand',
  high: 'attention',
  urgent: 'critical',
  // Accounts
  admin: 'critical',
  moderator: 'attention',
  user: 'neutral',
  // Comments
  removed: 'critical',
};

export const toneFor = (state) => TONE_BY_STATE[state] || 'neutral';
