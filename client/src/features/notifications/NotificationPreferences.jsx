import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Slider,
  Switch,
  Typography,
  Alert,
  Skeleton,
  useTheme,
} from "@mui/material";
import { useTranslation } from "../../utils/translations";
import {
  getSubscriptionState,
  isWebPushAvailable,
  requestSubscription,
  unsubscribe as unsubscribeFromWebPush,
} from "../../utils/webPush";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "./notificationsApiSlice";

/**
 * Match-alert settings.
 *
 * Saves per change rather than behind a submit button - there are three
 * controls and no interdependencies, so a save step would only add a way to
 * lose a change. The confidence slider commits on release (`onChangeCommitted`)
 * so dragging it doesn't fire a request per pixel.
 */
const NotificationPreferences = () => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  // Browser notifications are the one setting here that is not the account's:
  // the browser owns the permission, per origin and per profile, so this row
  // reads and writes that rather than a preference on the server. Nothing else
  // on this panel needs local state.
  // 'unsupported' | 'blocked' | 'on' | 'off' - resolved from the permission and
  // the subscription together, since a browser that granted permission and
  // then turned alerts off here is still 'granted' and receiving nothing.
  const [pushState, setPushState] = useState(null);
  const [isChangingPush, setIsChangingPush] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getSubscriptionState(), isWebPushAvailable()]).then(([state, available]) => {
      if (!active) return;
      // A deployment with no VAPID keys configured cannot send at all, so the
      // row says the channel is unavailable rather than offering a button that
      // would fire the browser's prompt and then register nothing.
      setPushState(available ? state : 'unsupported');
    });
    return () => { active = false; };
  }, []);

  const { data, isLoading, isError } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isError: isSaveError }] = useUpdateNotificationPreferencesMutation();

  const handleEnablePush = useCallback(async () => {
    setIsChangingPush(true);
    try {
      const outcome = await requestSubscription(currentLanguage);
      setPushState(await getSubscriptionState());
      // Turning this on while the account-level master is off subscribes a
      // browser the server then refuses to send to, which looks exactly like a
      // broken channel. Someone who just asked for browser alerts means to
      // receive them.
      if (outcome === 'granted' && data?.preferences?.pushAlerts === false) {
        updatePreferences({ pushAlerts: true });
      }
    } finally {
      setIsChangingPush(false);
    }
  }, [currentLanguage, data?.preferences?.pushAlerts, updatePreferences]);

  const handleDisablePush = useCallback(async () => {
    setIsChangingPush(true);
    try {
      await unsubscribeFromWebPush();
      setPushState(await getSubscriptionState());
    } finally {
      setIsChangingPush(false);
    }
  }, []);

  // Local mirror so the slider tracks the thumb while dragging; re-synced
  // whenever the server's value changes.
  const [minScore, setMinScore] = useState(50);
  useEffect(() => {
    if (typeof data?.preferences?.minScore === 'number') {
      setMinScore(data.preferences.minScore);
    }
  }, [data?.preferences?.minScore]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={64} />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">{t('notifPreferencesLoadError')}</Alert>;
  }

  const preferences = data.preferences || {};
  const matchAlerts = preferences.matchAlerts !== false;
  const emailAlerts = preferences.emailAlerts === true;
  const commentAlerts = preferences.commentAlerts !== false;
  const socialAlerts = preferences.socialAlerts !== false;
  // The account-level master over both push transports - the app's devices and
  // this browser alike (server/services/pushNotificationService.js gates every
  // sender on it). It only ever had a control in the mobile app, which left a
  // subscribed browser that receives nothing looking perfectly healthy here:
  // permission granted, the row reading "on", and every send refused upstream.
  const pushAlerts = preferences.pushAlerts !== false;
  const canEmail = !!data.hasEmail;

  const save = (patch) => {
    updatePreferences(patch);
  };

  const rowLabel = (title, description, disabled = false) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.92rem",
          color: disabled ? theme.palette.text.disabled : theme.custom.color.ink,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
        {description}
      </Typography>
    </Box>
  );

  return (
    <Box>
      {isSaveError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}>
          {t('notifPreferencesSaveError')}
        </Alert>
      )}

      <FormControlLabel
        sx={{ display: "flex", marginInlineStart: 0, marginInlineEnd: 0, justifyContent: "space-between", gap: 2 }}
        labelPlacement="start"
        control={(
          <Switch
            checked={matchAlerts}
            onChange={(event) => save({ matchAlerts: event.target.checked })}
          />
        )}
        label={rowLabel(t('notifPrefMatchAlerts'), t('notifPrefMatchAlertsDescription'))}
      />

      <Divider sx={{ my: 1.5 }} />

      <FormControlLabel
        sx={{ display: "flex", marginInlineStart: 0, marginInlineEnd: 0, justifyContent: "space-between", gap: 2 }}
        labelPlacement="start"
        control={(
          <Switch
            checked={emailAlerts && canEmail}
            disabled={!canEmail || !matchAlerts}
            onChange={(event) => save({ emailAlerts: event.target.checked })}
          />
        )}
        label={rowLabel(
          t('notifPrefEmailAlerts'),
          canEmail ? t('notifPrefEmailAlertsDescription') : t('notifPrefEmailAlertsNoEmail'),
          !canEmail || !matchAlerts
        )}
      />

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ opacity: matchAlerts ? 1 : 0.5, pointerEvents: matchAlerts ? "auto" : "none" }}>
        {rowLabel(t('notifPrefMinScore'), t('notifPrefMinScoreDescription'))}
        <Box sx={{ paddingInline: 1, mt: 1 }}>
          {/* Stops at 75, the strong-match boundary: a shared category in the
              same city always scores exactly that, and letting the bar go above
              it would mute the one match the product promises to deliver. */}
          <Slider
            value={minScore}
            min={50}
            max={75}
            step={5}
            marks
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            onChange={(event, value) => setMinScore(value)}
            onChangeCommitted={(event, value) => save({ minScore: value })}
            aria-label={t('notifPrefMinScore')}
          />
        </Box>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {t('notifPrefMinScoreCurrent', { score: minScore })}
        </Typography>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Independent of matchAlerts above - a comment is not a match lead, and
          turning off leads should not silently turn off comment replies too. */}
      <FormControlLabel
        sx={{ display: "flex", marginInlineStart: 0, marginInlineEnd: 0, justifyContent: "space-between", gap: 2 }}
        labelPlacement="start"
        control={(
          <Switch
            checked={commentAlerts}
            onChange={(event) => save({ commentAlerts: event.target.checked })}
          />
        )}
        label={rowLabel(t('notifPrefCommentAlerts'), t('notifPrefCommentAlertsDescription'))}
      />

      <Divider sx={{ my: 1.5 }} />

      {/* Independent of both switches above, for the same reason they are
          independent of each other: this one reports on what the platform did
          with the reader's own listing, not on anyone else's activity. */}
      <FormControlLabel
        sx={{ display: "flex", marginInlineStart: 0, marginInlineEnd: 0, justifyContent: "space-between", gap: 2 }}
        labelPlacement="start"
        control={(
          <Switch
            checked={socialAlerts}
            onChange={(event) => save({ socialAlerts: event.target.checked })}
          />
        )}
        label={rowLabel(t('notifPrefSocialAlerts'), t('notifPrefSocialAlertsDescription'))}
      />

      <Divider sx={{ my: 1.5 }} />

      {/* The master over both push transports. Above the browser row rather
          than beside it because it outranks it: a browser can be subscribed
          and still receive nothing while this is off. */}
      <FormControlLabel
        sx={{ display: "flex", marginInlineStart: 0, marginInlineEnd: 0, justifyContent: "space-between", gap: 2 }}
        labelPlacement="start"
        control={(
          <Switch
            checked={pushAlerts}
            onChange={(event) => save({ pushAlerts: event.target.checked })}
          />
        )}
        label={rowLabel(t('notifPrefPushAlerts'), t('notifPrefPushAlertsDescription'))}
      />

      <Divider sx={{ my: 1.5 }} />

      {/* Browser notifications. Not a switch like the rows above, because this
          one is not the account's setting to hold: the browser owns the
          permission, per profile, and a blocked one cannot be re-asked from a
          page at all - so the row says what this browser's state is and offers
          the only action that state allows. */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        {rowLabel(
          t('notifPrefBrowserAlerts'),
          pushState === 'blocked'
            ? t('notifPrefBrowserAlertsBlocked')
            : pushState === 'unsupported'
              ? t('notifPrefBrowserAlertsUnsupported')
              // A subscribed browser under a muted master is the one state that
              // looks entirely correct and delivers nothing, so it says so.
              : (pushState === 'on' && !pushAlerts)
                ? t('notifPrefBrowserAlertsMuted')
                : t('notifPrefBrowserAlertsDescription'),
          pushState === 'blocked' || pushState === 'unsupported'
        )}

        {pushState === 'on' && (
          <Switch
            checked
            disabled={isChangingPush}
            onChange={handleDisablePush}
            inputProps={{ 'aria-label': t('notifPrefBrowserAlerts') }}
          />
        )}

        {pushState === 'off' && (
          <Button
            size="small"
            variant="contained"
            disableElevation
            disabled={isChangingPush}
            onClick={handleEnablePush}
            sx={{
              flexShrink: 0,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: `${theme.custom.radius.md}px`,
              // primary.main is white in light mode (legacy palette), so the
              // colour is stated rather than inherited - same trap the admin
              // console documents.
              backgroundColor: theme.custom.color.brandPrimary,
              color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
              "&:hover": { backgroundColor: theme.custom.color.brandPrimary },
            }}
          >
            {t('notifPrefBrowserAlertsEnable')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default NotificationPreferences;
