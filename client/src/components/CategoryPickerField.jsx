import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  LocalOfferOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../utils/translations";
import { getCategoryColor, getCategoryBackgroundColor, getCategoryIcon } from "../config/categories";

const MAX_CATEGORIES = 10;

const getCategoryId = (category) => String(category?.id || category?._id || "");
const getCategoryLabel = (category, currentLanguage) =>
  category?.labels?.[currentLanguage] || category?.label || category?.code || "";

// Categories field, restyled to match the mobile app's picker (mobile/src/components/PostForm.js
// + SelectModal.js): a tappable field showing the current selection opens a searchable
// checklist sheet with a Confirm button, instead of MUI Autocomplete's free-typing
// multi-select combobox, so picking categories feels the same on web and mobile.
const CategoryPickerField = ({ categories, value, onChange, error, errorText, dataTestId }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draftIds, setDraftIds] = useState([]);

  const selectedIds = useMemo(() => (Array.isArray(value) ? value.map(String) : []), [value]);
  const selectedCategories = useMemo(
    () => (categories || []).filter((cat) => selectedIds.includes(getCategoryId(cat))),
    [categories, selectedIds]
  );

  const handleOpen = () => {
    setDraftIds(selectedIds);
    setQuery("");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const filteredCategories = useMemo(() => {
    const list = categories || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((cat) => getCategoryLabel(cat, currentLanguage).toLowerCase().includes(q));
  }, [categories, query, currentLanguage]);

  const toggleDraftId = (id) => {
    setDraftIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    onChange(draftIds);
    setOpen(false);
  };

  const handleRemoveSelected = (id) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const borderColor = error
    ? theme.palette.error.main
    : alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.3 : 0.2);

  return (
    <Box>
      <Box
        role="button"
        tabIndex={0}
        data-testid={dataTestId}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: 56,
          px: 2,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          cursor: "pointer",
          backgroundColor: theme.custom.color.surfaceRaised,
          "&:hover": {
            borderColor: error
              ? theme.palette.error.main
              : alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.5 : 0.4),
          },
          "&:focus-visible": {
            outline: `2px solid ${theme.custom.color.brandPrimary}`,
            outlineOffset: 2,
          },
        }}
      >
        <LocalOfferOutlined fontSize="small" sx={{ color: alpha(theme.custom.color.ink, 0.6), flexShrink: 0 }} />
        <Typography
          noWrap
          sx={{
            flex: 1,
            color: selectedCategories.length ? theme.palette.text.primary : theme.palette.text.secondary,
            fontWeight: selectedCategories.length ? 600 : 400,
          }}
        >
          {selectedCategories.length
            ? selectedCategories.map((cat) => getCategoryLabel(cat, currentLanguage)).join(", ")
            : t("selectCategories")}
        </Typography>
        {selectedCategories.length > 0 && (
          <Box
            sx={{
              minWidth: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: theme.custom.color.brandPrimary,
              color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              px: 0.5,
              flexShrink: 0,
            }}
          >
            {selectedCategories.length}
          </Box>
        )}
        <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
      </Box>

      {errorText && (
        <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: theme.palette.error.main }}>
          {errorText}
        </Typography>
      )}

      {selectedCategories.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>
          {selectedCategories.map((cat) => {
            const id = getCategoryId(cat);
            const chipColor = cat.code ? getCategoryColor(cat.code) : theme.custom.color.brandPrimary;
            const chipBackground = cat.code
              ? getCategoryBackgroundColor(cat.code)
              : theme.palette.mode === "dark"
                ? "rgba(91, 127, 255, 0.2)"
                : "rgba(27, 77, 255, 0.1)";
            return (
              <Chip
                key={id}
                label={getCategoryLabel(cat, currentLanguage)}
                onDelete={() => handleRemoveSelected(id)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === "dark" ? `${chipColor}33` : chipBackground,
                  color: chipColor,
                  border: `1px solid ${chipColor}`,
                  "& .MuiChip-deleteIcon": { color: chipColor },
                }}
              />
            );
          })}
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("categories")}
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label={t('close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder={t("searchCategories")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1,
              // This app's legacy palette.primary is white in light mode / dark
              // grey in dark mode (see theme.js), so the default focus border
              // needs an explicit brand color override, same as elsewhere in
              // this codebase's outlined TextFields.
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.custom.color.brandPrimary,
              },
            }}
          />

          <List sx={{ maxHeight: 360, overflowY: "auto" }}>
            {filteredCategories.length === 0 && (
              <Typography variant="body2" sx={{ textAlign: "center", color: theme.palette.text.secondary, py: 4 }}>
                {t("noSearchResults")}
              </Typography>
            )}
            {filteredCategories.map((cat) => {
              const id = getCategoryId(cat);
              const checked = draftIds.includes(id);
              const Icon = cat.code ? getCategoryIcon(cat.code) : LocalOfferOutlined;
              const chipColor = cat.code ? getCategoryColor(cat.code) : theme.custom.color.brandPrimary;
              const chipBackground = cat.code
                ? getCategoryBackgroundColor(cat.code)
                : alpha(theme.custom.color.brandPrimary, 0.1);
              return (
                <ListItemButton key={id} onClick={() => toggleDraftId(id)} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.palette.mode === "dark" ? `${chipColor}33` : chipBackground,
                      }}
                    >
                      <Icon fontSize="small" sx={{ color: chipColor }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={getCategoryLabel(cat, currentLanguage)} />
                  {/* This app's legacy palette.primary.main is white in light mode
                      (see theme.js) - Checkbox's default color="primary" would render
                      an invisible checked icon, so the brand color is set explicitly. */}
                  <Checkbox
                    checked={checked}
                    edge="end"
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      color: alpha(theme.custom.color.ink, 0.4),
                      "&.Mui-checked": { color: theme.custom.color.brandPrimary },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          {draftIds.length >= MAX_CATEGORIES && (
            <Typography variant="caption" sx={{ display: "block", color: theme.palette.warning.main, mt: 0.5 }}>
              {t("maxCategoriesReached")}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirm}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: 1.2,
              backgroundColor: theme.custom.color.brandPrimary,
              // Explicit contrast text against the actual brand color, not MUI's
              // default primary.contrastText (this app's legacy palette.primary
              // is white in light mode, which would otherwise pick dark text).
              color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
              "&:hover": {
                backgroundColor: theme.custom.color.brandPrimary,
                opacity: 0.92,
              },
            }}
          >
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryPickerField;
