import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { lighten } from "@mui/material/styles";
import {
  Close as CloseIcon,
  CalendarMonth as CalendarMonthIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import { useTranslation } from "../utils/translations";

// Locales used only for generating month names / formatting the final string.
// Arabic uses 'ar-MA' for the Maghrebi Gregorian month names (ماي/يوليوز/غشت/
// شتنبر/نونبر/دجنبر) our users actually say. 'ar-SA' is deliberately avoided:
// modern browsers resolve it to the Islamic calendar, which would print Hijri
// month names for a Gregorian date.
const DATE_LOCALES = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA' };

// Month names already stored in posts created before the switch to 'ar-MA'
// (Mashriqi set: يوليو/أغسطس/سبتمبر...). Only used when reading a value back,
// never when writing one.
const LEGACY_PARSE_LOCALES = ['ar'];

const MIN_YEAR = 1900;

// Gregorian month names in a given site language (or, for parsing only, in a
// raw BCP 47 locale), with Latin digits so the stored string stays readable in
// every language.
export const getMonthNames = (language) => {
  const formatter = new Intl.DateTimeFormat(DATE_LOCALES[language] || language || DATE_LOCALES.en, {
    month: 'long',
    calendar: 'gregory',
    numberingSystem: 'latn',
  });
  return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(2020, month, 1)));
};

// The value saved into Formik's `exactDate` (stored server-side as mainDate,
// a free-text string). Spelled-out month names on purpose - the whole point of
// this dialog is that "03/04/2026" is ambiguous across dd/mm and mm/dd users.
export const formatDateValue = ({ day, month, year }, language) => {
  const monthName = getMonthNames(language)[month];
  if (!day) return `${monthName} ${year}`;
  if (language === 'en') return `${monthName} ${day}, ${year}`;
  return `${day} ${monthName} ${year}`;
};

// Best-effort read of a string previously produced by formatDateValue, so
// reopening the dialog starts from what the user already picked. Month names
// are matched across all three languages (the user may have switched language
// since). Anything unrecognised falls back to today's date.
const parseDateValue = (value) => {
  if (!value || typeof value !== 'string') return null;

  const yearMatch = value.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);

  let month = null;
  ['en', 'fr', 'ar', ...LEGACY_PARSE_LOCALES].forEach((language) => {
    if (month !== null) return;
    const names = getMonthNames(language);
    const index = names.findIndex((name) => value.toLowerCase().includes(name.toLowerCase()));
    if (index !== -1) month = index;
  });
  if (month === null) return null;

  // Any 1-2 digit standalone number left over is the day (the year is 4 digits).
  const dayMatch = value.replace(yearMatch[0], '').match(/\b(\d{1,2})\b/);
  const day = dayMatch ? Number(dayMatch[1]) : null;

  return { day, month, year };
};

const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

// Two-step, plain-language replacement for a calendar date picker: the user
// types the day as a number (skippable when they only remember the month),
// then picks the month by name and types the year. Everything defaults to
// today, so confirming without edits yields today's date.
const DateEntryDialog = ({ open, value, onClose, onConfirm }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const monthNames = useMemo(() => getMonthNames(currentLanguage), [currentLanguage]);

  const [stage, setStage] = useState(0); // 0 = day, 1 = month + year
  const [day, setDay] = useState("");
  const [dayUnknown, setDayUnknown] = useState(false);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(String(today.getFullYear()));
  const [error, setError] = useState(null);

  // Seed from the current field value (or today) every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const parsed = parseDateValue(value);
    setStage(0);
    setError(null);
    if (parsed) {
      setDay(parsed.day ? String(parsed.day) : "");
      setDayUnknown(!parsed.day);
      setMonth(parsed.month);
      setYear(String(parsed.year));
    } else {
      setDay(String(today.getDate()));
      setDayUnknown(false);
      setMonth(today.getMonth());
      setYear(String(today.getFullYear()));
    }
  }, [open, value, today]);

  const accent = theme.custom.color.brandPrimary;
  const currentYear = today.getFullYear();

  const digitsOnly = (input, maxLength) => input.replace(/\D/g, '').slice(0, maxLength);

  const handleNextFromDay = () => {
    if (!dayUnknown) {
      const dayNumber = Number(day);
      if (!day || Number.isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
        setError(t('datePickerInvalidDay'));
        return;
      }
    }
    setError(null);
    setStage(1);
  };

  const handleSkipDay = () => {
    setDay("");
    setDayUnknown(true);
    setError(null);
    setStage(1);
  };

  const handleConfirm = () => {
    const yearNumber = Number(year);
    if (!year || Number.isNaN(yearNumber) || yearNumber < MIN_YEAR || yearNumber > currentYear) {
      setError(t('datePickerInvalidYear', { min: MIN_YEAR, max: currentYear }));
      return;
    }

    const dayNumber = dayUnknown ? null : Number(day);
    if (dayNumber) {
      const maxDay = daysInMonth(month, yearNumber);
      if (dayNumber > maxDay) {
        setError(t('datePickerInvalidDayForMonth', {
          month: monthNames[month],
          year: yearNumber,
          days: maxDay,
        }));
        return;
      }
    }

    // A lost/found item can't have happened in the future.
    const candidate = new Date(yearNumber, month, dayNumber || 1);
    const isFuture = dayNumber
      ? candidate > today
      : yearNumber > currentYear || (yearNumber === currentYear && month > today.getMonth());
    if (isFuture) {
      setError(t('datePickerFutureDate'));
      return;
    }

    setError(null);
    onConfirm(formatDateValue({ day: dayNumber, month, year: yearNumber }, currentLanguage));
  };

  const previewValue = (() => {
    const yearNumber = Number(year);
    if (!year || Number.isNaN(yearNumber)) return null;
    const dayNumber = dayUnknown ? null : Number(day) || null;
    return formatDateValue({ day: dayNumber, month, year: yearNumber }, currentLanguage);
  })();

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: `${theme.custom.radius.md}px`,
      '& fieldset': {
        borderColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.3 : 0.2),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.5 : 0.4),
      },
      '&.Mui-focused fieldset': { borderColor: accent },
    },
  };

  const labelSx = {
    mb: 1,
    display: 'block',
    fontWeight: 600,
    color: theme.palette.text.primary,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: theme.custom.color.surfaceRaised,
          boxShadow: theme.shadows[12],
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <CalendarMonthIcon sx={{ color: accent }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {t('datePickerTitle')}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label={t('close')}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Two-segment progress bar, same treatment as the wizard's mobile stepper */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
          {[0, 1].map((index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: index <= stage
                  ? accent
                  : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.1 : 0.08),
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
          {t('wizardStepProgressShort', { current: stage + 1, total: 2 })}
        </Typography>

        <Box sx={{ mt: 2.5 }}>
          {stage === 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: accent, mb: 0.5 }}>
                {t('datePickerStepDayTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {t('datePickerStepDaySubtitle')}
              </Typography>

              <FormLabel htmlFor="datePickerDay" sx={labelSx}>
                {t('datePickerDayLabel')}
              </FormLabel>
              <TextField
                id="datePickerDay"
                fullWidth
                autoFocus
                value={day}
                onChange={(event) => {
                  setDay(digitsOnly(event.target.value, 2));
                  setDayUnknown(false);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleNextFromDay();
                  }
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { textAlign: 'center', fontSize: '1.6rem', fontWeight: 700 },
                }}
                placeholder="1 - 31"
                sx={fieldSx}
              />

              <Button
                onClick={handleSkipDay}
                startIcon={<HelpOutlineIcon />}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: accent,
                  borderRadius: `${theme.custom.radius.md}px`,
                }}
              >
                {t('datePickerSkipDay')}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: accent, mb: 0.5 }}>
                {t('datePickerStepMonthYearTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {t('datePickerStepMonthYearSubtitle')}
              </Typography>

              <FormLabel htmlFor="datePickerMonth" sx={labelSx}>
                {t('datePickerMonthLabel')}
              </FormLabel>
              <Select
                id="datePickerMonth"
                fullWidth
                value={month}
                onChange={(event) => {
                  setMonth(Number(event.target.value));
                  setError(null);
                }}
                sx={{
                  mb: 2,
                  borderRadius: `${theme.custom.radius.md}px`,
                  '& fieldset': {
                    borderColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.3 : 0.2),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.5 : 0.4),
                  },
                  '&.Mui-focused fieldset': { borderColor: accent },
                }}
              >
                {monthNames.map((name, index) => (
                  <MenuItem key={name} value={index}>{name}</MenuItem>
                ))}
              </Select>

              <FormLabel htmlFor="datePickerYear" sx={labelSx}>
                {t('datePickerYearLabel')}
              </FormLabel>
              <TextField
                id="datePickerYear"
                fullWidth
                value={year}
                onChange={(event) => {
                  setYear(digitsOnly(event.target.value, 4));
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleConfirm();
                  }
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { textAlign: 'center', fontSize: '1.6rem', fontWeight: 700 },
                }}
                placeholder={String(currentYear)}
                sx={fieldSx}
              />

              {previewValue && (
                <Box
                  sx={{
                    mt: 2.5,
                    p: 1.5,
                    borderRadius: `${theme.custom.radius.md}px`,
                    backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.12 : 0.08),
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {t('datePickerSummary', { date: previewValue })}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {error && (
            <Typography
              variant="caption"
              sx={{ mt: 1.5, display: 'block', fontWeight: 500, color: theme.palette.error.main }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={stage === 0 ? onClose : () => { setError(null); setStage(0); }}
          sx={{ textTransform: 'none', borderRadius: `${theme.custom.radius.md}px`, px: 3 }}
        >
          {stage === 0 ? t('cancel') : t('back')}
        </Button>
        <Button
          variant="contained"
          onClick={stage === 0 ? handleNextFromDay : handleConfirm}
          sx={{
            textTransform: 'none',
            borderRadius: `${theme.custom.radius.md}px`,
            px: 3,
            background: `linear-gradient(45deg, ${accent} 30%, ${lighten(accent, 0.15)} 90%)`,
            color: `${theme.palette.getContrastText(accent)} !important`,
            '&:hover': {
              background: `linear-gradient(45deg, ${lighten(accent, 0.08)} 30%, ${lighten(accent, 0.25)} 90%)`,
            },
          }}
        >
          {stage === 0 ? t('wizardNext') : t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateEntryDialog;
