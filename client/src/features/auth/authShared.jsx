import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  FormControl,
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
  styled,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Language,
  KeyboardArrowDown,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { setMode } from "../../app/state";

// Shared visual language for Login / SignUp / CountrySelection.
// Every value is sourced from theme.custom (Phase 1 tokens) — see CLAUDE.md.

// Below `sm` these screens drop the desktop auth-card look and take the layout
// the Expo app's LoginScreen/SignUpScreen use: flat borderless card on the page
// background, labels above the fields instead of MUI's floating label, no
// leading field icons, a SHOW/HIDE text control on password fields, and the
// switch-to-the-other-page prompt as one inline row under the card. Everything
// that can be expressed as a breakpoint lives in the styled components below;
// this hook covers the cases where the markup itself differs.
export const useAuthCompactLayout = () =>
  useMediaQuery((theme) => theme.breakpoints.down("sm"));

export const redirectToGoogleAuth = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
  window.location.href = `${apiUrl}/auth/google`;
};

export const redirectToFacebookAuth = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
  window.location.href = `${apiUrl}/auth/facebook`;
};

// Server error-message codes that mean "this account uses the other auth method" —
// rendered as a warning notice with an inline Google CTA rather than a plain error.
export const OAUTH_WARNING_MESSAGE_KEYS = {
  OAUTH_EMAIL_EXISTS: "oauthEmailExists",
  OAUTH_LOGIN_ATTEMPT: "oauthLoginAttempt",
};

// ?error= codes OAuthCallback.jsx can redirect back into /login with.
export const OAUTH_CALLBACK_ERROR_KEYS = {
  oauth_failed: "oauthFailed",
  token_generation_failed: "oauthTokenGenerationFailed",
  oauth_error: "oauthGenericError",
  no_token: "oauthNoToken",
  authentication_failed: "oauthAuthenticationFailed",
};

export const AuthPageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.custom.color.surfaceBase,
  display: "flex",
  flexDirection: "column",
}));

// Column, not row: on mobile the "already have an account?" prompt sits under
// the card as a sibling (the way the Expo screens lay it out) instead of inside
// the card body.
export const AuthCardSlot = styled(Box)(({ theme }) => ({
  flex: 1,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2.5),
    paddingBottom: theme.spacing(4),
  },
}));

export const AuthCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  borderRadius: theme.custom.radius.xl,
  boxShadow: theme.custom.elevation.e2,
  backgroundColor: theme.custom.color.surfaceRaised,
  border: `1px solid ${alpha(theme.custom.color.ink, 0.06)}`,
  // Mobile app parity: the card is a flat panel on the page background, with
  // no border and no shadow (mobile Phase 9 — parent containers carry neither).
  [theme.breakpoints.down("sm")]: {
    border: "none",
    boxShadow: "none",
  },
}));

// Card body padding, shared by both pages so the compact value stays in one place.
export const AUTH_CARD_CONTENT_SX = { p: { xs: 2.75, md: 5 } };

// Mobile app input: 52px tall, ink-tinted fill instead of surfaceBase, hairline
// border. Shared by AuthTextField and AuthSelectField so both read identically.
const compactFieldStyles = (theme) => ({
  "& .MuiOutlinedInput-root": {
    minHeight: 52,
    backgroundColor: alpha(theme.custom.color.ink, 0.04),
    fontSize: "1rem",
    "& fieldset": {
      borderColor: alpha(theme.custom.color.ink, 0.08),
    },
  },
});

export const AuthTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.custom.radius.md,
    backgroundColor: theme.custom.color.surfaceBase,
    "& fieldset": {
      borderColor: alpha(theme.custom.color.ink, 0.14),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.custom.color.brandPrimary,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.custom.color.brandPrimary,
  },
  [theme.breakpoints.down("sm")]: compactFieldStyles(theme),
}));

export const AuthSelectField = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.custom.radius.md,
    backgroundColor: theme.custom.color.surfaceBase,
    "& fieldset": {
      borderColor: alpha(theme.custom.color.ink, 0.14),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.custom.color.brandPrimary,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.custom.color.brandPrimary,
  },
  [theme.breakpoints.down("sm")]: compactFieldStyles(theme),
}));

// Field label sitting above the input on mobile, replacing MUI's floating label.
export const AuthFieldLabel = styled(Typography)(({ theme }) => ({
  display: "block",
  fontWeight: 600,
  fontSize: "0.8125rem",
  color: alpha(theme.custom.color.ink, 0.6),
  marginBottom: theme.spacing(1),
}));

export const AuthPrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.custom.radius.md,
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: "none",
  fontSize: "1rem",
  backgroundColor: theme.custom.color.brandPrimary,
  color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
  boxShadow: theme.custom.elevation.e1,
  "&:hover": {
    backgroundColor: theme.custom.color.brandPrimary,
    opacity: 0.92,
    boxShadow: theme.custom.elevation.e2,
  },
  "&:disabled": {
    backgroundColor: alpha(theme.custom.color.ink, 0.12),
    color: alpha(theme.custom.color.ink, 0.4),
  },
  [theme.breakpoints.down("sm")]: {
    minHeight: 52,
    // Brand-tinted lift under the primary action, as on the Expo screens
    // (dropped in dark mode there, where a colored glow reads as haze).
    boxShadow:
      theme.palette.mode === "light"
        ? `0 4px 8px ${alpha(theme.custom.color.brandPrimary, 0.25)}`
        : "none",
  },
}));

// The two OAuth buttons are one shape; mobile fills them with the same ink tint
// the inputs use so they read as a pair above the divider.
const compactSocialButtonStyles = (theme) => ({
  [theme.breakpoints.down("sm")]: {
    minHeight: 52,
    fontWeight: 600,
    fontSize: "0.9375rem",
    backgroundColor: alpha(theme.custom.color.ink, 0.04),
    borderColor: alpha(theme.custom.color.ink, 0.08),
  },
});

export const AuthGoogleButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.custom.radius.md,
  padding: theme.spacing(1.5, 3),
  fontWeight: 500,
  textTransform: "none",
  fontSize: "1rem",
  color: theme.custom.color.ink,
  backgroundColor: theme.custom.color.surfaceRaised,
  borderColor: alpha(theme.custom.color.ink, 0.16),
  "&:hover": {
    borderColor: theme.custom.color.brandPrimary,
    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.05),
  },
  ...compactSocialButtonStyles(theme),
}));

export const AuthFacebookButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.custom.radius.md,
  padding: theme.spacing(1.5, 3),
  fontWeight: 500,
  textTransform: "none",
  fontSize: "1rem",
  color: theme.custom.color.ink,
  backgroundColor: theme.custom.color.surfaceRaised,
  borderColor: alpha(theme.custom.color.ink, 0.16),
  "&:hover": {
    borderColor: theme.custom.color.brandPrimary,
    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.05),
  },
  ...compactSocialButtonStyles(theme),
}));

export const AuthOutlineButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.custom.radius.md,
  textTransform: "none",
  fontWeight: 600,
  borderWidth: 1.5,
  borderColor: theme.custom.color.brandPrimary,
  color: theme.custom.color.brandPrimary,
  "&:hover": {
    borderWidth: 1.5,
    borderColor: theme.custom.color.brandPrimary,
    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
  },
}));

export const AuthNeutralButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.custom.radius.md,
  textTransform: "none",
  fontWeight: 500,
  borderWidth: 1,
  borderColor: alpha(theme.custom.color.ink, 0.2),
  color: alpha(theme.custom.color.ink, 0.75),
  "&:hover": {
    borderColor: alpha(theme.custom.color.ink, 0.4),
    backgroundColor: alpha(theme.custom.color.ink, 0.04),
  },
}));

export const GoogleGlyph = () => (
  <Box
    component="img"
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google"
    sx={{ width: 20, height: 20 }}
  />
);

export const FacebookGlyph = () => (
  <Box component="svg" viewBox="0 0 36 36" sx={{ width: 20, height: 20 }}>
    <path
      fill="#1877F2"
      d="M36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.981 6.581 16.42 15.19 17.771V23.203h-4.57V18h4.57v-3.967c0-4.511 2.687-7.005 6.797-7.005 1.968 0 4.028.352 4.028.352v4.43h-2.269c-2.237 0-2.934 1.389-2.934 2.814V18h4.994l-.798 5.203h-4.196v12.568C29.419 34.42 36 26.981 36 18"
    />
  </Box>
);

// `tagline` is the mobile-only one-liner under the wordmark (the Expo screens'
// `loginToAccount` / `createAccountTagline`); on mobile it replaces the
// title + subtitle pair, which is too much copy above a full form on a phone.
export const AuthHeader = ({ eyebrow, title, subtitle, tagline }) => {
  const theme = useTheme();
  const isCompact = useAuthCompactLayout();

  const wordmark = (
    <Box
      component="img"
      src="/maflogoSVG.svg"
      alt="Mafqoudat"
      sx={{
        height: { xs: 36, md: 56 },
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        mb: { xs: 0.75, md: 3 },
        filter: theme.palette.mode === "dark" ? "brightness(1.1)" : "none",
      }}
    />
  );

  if (isCompact) {
    return (
      <Box sx={{ textAlign: "center", mb: 3.5 }}>
        {wordmark}
        <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.6) }}>
          {tagline || subtitle || title}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center", mb: 4 }}>
      {wordmark}
      {eyebrow && (
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: theme.custom.color.brandPrimary,
            fontWeight: 700,
            letterSpacing: 1,
            mb: 0.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        variant="h5"
        sx={{ color: theme.custom.color.ink, fontWeight: 600, mb: subtitle ? 1 : 0 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" sx={{ color: alpha(theme.custom.color.ink, 0.65) }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export const AuthDivider = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Divider
      sx={{
        my: { xs: 2.25, md: 3 },
        "&::before, &::after": { borderColor: alpha(theme.custom.color.ink, 0.12) },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: alpha(theme.custom.color.ink, 0.5),
          px: 1.5,
          textTransform: { xs: "uppercase", md: "none" },
          fontWeight: { xs: 600, md: 400 },
          fontSize: { xs: "0.75rem", md: "0.875rem" },
          letterSpacing: { xs: "0.5px", md: "normal" },
        }}
      >
        {t("or")}
      </Typography>
    </Divider>
  );
};

// One form field, in whichever of the two shapes the viewport calls for:
// desktop keeps MUI's floating label plus the leading icon adornment, mobile
// puts the label above a placeholder-only input and drops the icon.
export const AuthFormField = ({
  label,
  startIcon,
  password = false,
  showPassword = false,
  onTogglePassword,
  type,
  InputProps,
  sx,
  ...textFieldProps
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isCompact = useAuthCompactLayout();

  const passwordAdornment = password ? (
    <InputAdornment position="end">
      {isCompact ? (
        <Button
          onClick={onTogglePassword}
          size="small"
          sx={{
            color: theme.custom.color.brandPrimary,
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            minWidth: "auto",
          }}
        >
          {showPassword ? t("hidePassword") : t("showPassword")}
        </Button>
      ) : (
        <IconButton
          onClick={onTogglePassword}
          edge="end"
          size="small"
          sx={{ color: alpha(theme.custom.color.ink, 0.5) }}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      )}
    </InputAdornment>
  ) : null;

  const field = (
    <AuthTextField
      fullWidth
      label={isCompact ? undefined : label}
      type={password ? (showPassword ? "text" : "password") : type}
      sx={sx}
      InputProps={{
        ...InputProps,
        startAdornment:
          !isCompact && startIcon ? (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ) : undefined,
        endAdornment: passwordAdornment || InputProps?.endAdornment,
      }}
      {...textFieldProps}
    />
  );

  if (!isCompact) return field;

  return (
    <Box>
      <AuthFieldLabel component="label">{label}</AuthFieldLabel>
      {field}
    </Box>
  );
};

// "Don't have an account? Sign Up" — the inline switch row the Expo screens put
// under the card, used in place of the desktop two-button block.
export const AuthPromptRow = ({ prompt, actionLabel, to }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        mt: 3,
      }}
    >
      <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.6) }}>
        {prompt}
      </Typography>
      <Typography
        component={Link}
        to={to}
        variant="body2"
        sx={{
          color: theme.custom.color.brandPrimary,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {actionLabel}
      </Typography>
    </Box>
  );
};

const LANGUAGE_LABELS = { en: "English", ar: "العربية", fr: "Français" };

const LanguageChip = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.custom.radius.md,
  cursor: "pointer",
  color: theme.custom.color.ink,
  backgroundColor: alpha(theme.custom.color.ink, 0.04),
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.08),
  },
}));

const IconToggleButton = styled(IconButton)(({ theme }) => ({
  color: theme.custom.color.ink,
  backgroundColor: alpha(theme.custom.color.ink, 0.04),
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.08),
  },
}));

// Language + theme controls shared by Login / SignUp / CountrySelection.
// Sits above the card as a normal-flow row (not position:absolute) so
// justify-content:flex-end flips correctly under RTL with no manual math.
export const AuthTopControls = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentLanguage } = useTranslation();
  const { setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleSelect = (lang) => {
    setLanguage(lang);
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 1,
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        // Matches AuthCardSlot's padding so the controls line up with the card edge.
        padding: { xs: 2.5, sm: 2 },
      }}
    >
      <LanguageChip onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Language fontSize="small" />
        <Typography variant="body2" fontWeight={600}>
          {LANGUAGE_LABELS[currentLanguage || "en"]}
        </Typography>
        <KeyboardArrowDown fontSize="small" />
      </LanguageChip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: `${theme.custom.radius.md}px`,
            boxShadow: theme.custom.elevation.e2,
          },
        }}
      >
        {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
          <MenuItem
            key={code}
            selected={currentLanguage === code}
            onClick={() => handleSelect(code)}
          >
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Menu>

      <IconToggleButton onClick={() => dispatch(setMode())} aria-label="toggle theme">
        {theme.palette.mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
      </IconToggleButton>
    </Box>
  );
};
