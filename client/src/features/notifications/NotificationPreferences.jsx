import { useEffect, useState } from "react";
import {
  Box,
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
  const { t } = useTranslation();

  const { data, isLoading, isError } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isError: isSaveError }] = useUpdateNotificationPreferencesMutation();

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
          <Slider
            value={minScore}
            min={50}
            max={90}
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
    </Box>
  );
};

export default NotificationPreferences;
