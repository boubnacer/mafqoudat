import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Card,
  TextField,
  FormControl,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  alpha,
  styled,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Language,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { setMode } from "../../app/state";

// Shared visual language for Login / SignUp / CountrySelection.
// Every value is sourced from theme.custom (Phase 1 tokens) — see CLAUDE.md.

export const redirectToGoogleAuth = () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
  window.location.href = `${apiUrl}/auth/google`;
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

export const AuthCardSlot = styled(Box)(({ theme }) => ({
  flex: 1,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(6),
}));

export const AuthCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  borderRadius: theme.custom.radius.xl,
  boxShadow: theme.custom.elevation.e2,
  backgroundColor: theme.custom.color.surfaceRaised,
  border: `1px solid ${alpha(theme.custom.color.ink, 0.06)}`,
}));

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
}));

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

export const AuthHeader = ({ eyebrow, title, subtitle }) => {
  const theme = useTheme();
  return (
    <Box sx={{ textAlign: "center", mb: 4 }}>
      <Box
        component="img"
        src="/maflogoSVG.svg"
        alt="Mafqoudat"
        sx={{
          height: { xs: 44, md: 56 },
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          mb: 3,
          filter: theme.palette.mode === "dark" ? "brightness(1.1)" : "none",
        }}
      />
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
        my: 3,
        "&::before, &::after": { borderColor: alpha(theme.custom.color.ink, 0.12) },
      }}
    >
      <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.5), px: 1.5 }}>
        {t("or")}
      </Typography>
    </Divider>
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
        padding: (t) => t.spacing(2),
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
