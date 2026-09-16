import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Collapse,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  DescriptionOutlined,
  AddCircleOutlineRounded,
  LockOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../utils/translations";
import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
} from "../features/dependencies/documentTypesApiSlice";

// Matches MAX_DOCUMENT_TYPES in server/controllers/postsController.js: a
// listing names the few papers that were lost together, not an inventory.
export const MAX_DOCUMENT_TYPES = 6;

const getDocumentId = (documentType) => String(documentType?.id || documentType?._id || "");
const getDocumentLabel = (documentType, currentLanguage) =>
  documentType?.labels?.[currentLanguage] || documentType?.labels?.en || documentType?.code || "";

// Same script folding the server normalizes with (utils/textMatching.js), so a
// reader typing "passeport" finds "Passeport" and one typing Arabic without
// hamza still finds "جواز السفر". Kept deliberately small - this list is a few
// dozen rows long and filtered in memory, not a query.
const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * Which document a DOCUMENTS listing is about.
 *
 * This is what the photo step is replaced by on those listings: a picture of
 * an identity document publishes its holder's name, number, address and face
 * to every reader, so the wizard never takes one, and the listing names the
 * document instead. A title the list does not carry is added here, in Arabic
 * and in Latin letters, and saved for whoever files the same paper next.
 *
 * Shaped after CategoryPickerField (a field that opens a checklist sheet with
 * a Confirm button) so the two pickers on the same step behave identically.
 */
const DocumentTypePickerField = ({ value, onChange, error, errorText, dataTestId }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: documentTypes = [], isLoading, isError, refetch } = useGetDocumentTypesQuery();
  const [createDocumentType, { isLoading: isCreating }] = useCreateDocumentTypeMutation();

  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState([]);
  const [search, setSearch] = useState("");
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [arabicLabel, setArabicLabel] = useState("");
  const [latinLabel, setLatinLabel] = useState("");
  const [customError, setCustomError] = useState("");

  const selectedIds = useMemo(() => (Array.isArray(value) ? value.map(String) : []), [value]);
  const byId = useMemo(() => {
    const map = new Map();
    (documentTypes || []).forEach((documentType) => map.set(getDocumentId(documentType), documentType));
    return map;
  }, [documentTypes]);

  const selectedDocumentTypes = useMemo(
    () => selectedIds.map((id) => byId.get(id)).filter(Boolean),
    [selectedIds, byId]
  );

  // A selected id whose row is gone (deactivated between two page loads) would
  // otherwise stay in the form invisibly and be silently dropped on submit.
  useEffect(() => {
    if (isLoading || isError || selectedIds.length === 0) return;
    const stillThere = selectedIds.filter((id) => byId.has(id));
    if (stillThere.length !== selectedIds.length) {
      onChange(stillThere);
    }
  }, [isLoading, isError, selectedIds, byId, onChange]);

  const filtered = useMemo(() => {
    const term = normalize(search);
    if (!term) return documentTypes;
    return (documentTypes || []).filter((documentType) => {
      const haystack = ["ar", "en", "fr"]
        .map((lang) => normalize(documentType?.labels?.[lang]))
        .join(" ");
      return haystack.includes(term);
    });
  }, [documentTypes, search]);

  const resetOtherForm = () => {
    setShowOtherForm(false);
    setArabicLabel("");
    setLatinLabel("");
    setCustomError("");
  };

  const handleOpen = () => {
    setDraftIds(selectedIds);
    setSearch("");
    resetOtherForm();
    setOpen(true);
  };

  const handleClose = () => {
    if (isCreating) return;
    setOpen(false);
  };

  const toggleDraftId = (id) => {
    setDraftIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_DOCUMENT_TYPES) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    onChange(draftIds);
    setOpen(false);
  };

  const handleAddCustom = async () => {
    const arabic = arabicLabel.trim();
    const latin = latinLabel.trim();

    if (!arabic || !latin) {
      setCustomError(t("documentTitleBothNamesRequired"));
      return;
    }
    if (!/\p{Script=Arabic}/u.test(arabic)) {
      setCustomError(t("documentTitleArabicScriptRequired"));
      return;
    }
    if (!/\p{Script=Latin}/u.test(latin)) {
      setCustomError(t("documentTitleLatinScriptRequired"));
      return;
    }

    setCustomError("");
    try {
      // The server answers with the existing row when the title is already
      // saved under another spelling, so both outcomes end the same way: the
      // title is in the list and ticked.
      const created = await createDocumentType({ arabicLabel: arabic, latinLabel: latin }).unwrap();
      const createdId = getDocumentId(created);
      if (createdId) {
        setDraftIds((prev) => (
          prev.includes(createdId) || prev.length >= MAX_DOCUMENT_TYPES ? prev : [...prev, createdId]
        ));
      }
      setSearch("");
      resetOtherForm();
    } catch (submitError) {
      const firstFieldMessage = submitError?.data?.fields?.[0]?.message;
      setCustomError(firstFieldMessage || submitError?.data?.message || t("documentTitleSaveFailed"));
    }
  };

  const borderColor = error
    ? theme.palette.error.main
    : alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.3 : 0.2);

  const atLimit = draftIds.length >= MAX_DOCUMENT_TYPES;

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
          minHeight: 56,
          px: 2,
          py: 1,
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
        <DescriptionOutlined
          fontSize="small"
          sx={{ color: alpha(theme.custom.color.ink, 0.6), flexShrink: 0 }}
        />
        <Typography
          noWrap
          sx={{
            flex: 1,
            color: selectedDocumentTypes.length ? theme.palette.text.primary : theme.palette.text.secondary,
            fontWeight: selectedDocumentTypes.length ? 600 : 400,
          }}
        >
          {selectedDocumentTypes.length
            ? selectedDocumentTypes.map((documentType) => getDocumentLabel(documentType, currentLanguage)).join(", ")
            : t("selectDocumentTitle")}
        </Typography>
        {selectedDocumentTypes.length > 0 && (
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
            {selectedDocumentTypes.length}
          </Box>
        )}
        <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
      </Box>

      {errorText && (
        <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: theme.palette.error.main }}>
          {errorText}
        </Typography>
      )}

      {selectedDocumentTypes.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>
          {selectedDocumentTypes.map((documentType) => {
            const id = getDocumentId(documentType);
            return (
              <Chip
                key={id}
                label={getDocumentLabel(documentType, currentLanguage)}
                onDelete={() => onChange(selectedIds.filter((x) => x !== id))}
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === "dark" ? 0.22 : 0.1),
                  color: theme.custom.color.brandPrimary,
                  fontWeight: 600,
                  border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.5)}`,
                  "& .MuiChip-deleteIcon": { color: theme.custom.color.brandPrimary },
                }}
              />
            );
          })}
        </Box>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 3,
            backgroundColor: theme.custom.color.surfaceRaised,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("selectDocumentTitle")}
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label={t("close")} disabled={isCreating}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Why there is no photo on these listings, said once, where the
              reader is making the choice that replaces it. */}
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "flex-start",
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === "dark" ? 0.16 : 0.08),
            }}
          >
            <LockOutlined fontSize="small" sx={{ color: theme.custom.color.brandPrimary, mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {t("documentPrivacyNotice")}
            </Typography>
          </Box>

          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchDocumentTitle")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: alpha(theme.custom.color.ink, 0.5) }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.custom.color.brandPrimary,
                },
              },
            }}
          />

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: theme.custom.color.brandPrimary }} />
            </Box>
          )}

          {isError && !isLoading && (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" sx={{ color: theme.palette.error.main, mb: 1 }}>
                {t("documentTitlesLoadFailed")}
              </Typography>
              <Button onClick={refetch} sx={{ color: theme.custom.color.brandPrimary, fontWeight: 600 }}>
                {t("retry")}
              </Button>
            </Box>
          )}

          {!isLoading && !isError && (
            <Box
              sx={{
                maxHeight: fullScreen ? "none" : 380,
                overflowY: fullScreen ? "visible" : "auto",
                // The add-new affordance is the last thing inside the scroller,
                // not a footer under it: a reader only reaches for it after
                // scanning the whole list, which is where scrolling leaves them.
                pr: 0.5,
              }}
            >
              <List sx={{ py: 0 }}>
                {filtered.map((documentType) => {
                  const id = getDocumentId(documentType);
                  const checked = draftIds.includes(id);
                  return (
                    <ListItemButton
                      key={id}
                      onClick={() => toggleDraftId(id)}
                      disabled={!checked && atLimit}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        backgroundColor: checked
                          ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === "dark" ? 0.18 : 0.08)
                          : "transparent",
                      }}
                    >
                      <ListItemText
                        primary={getDocumentLabel(documentType, currentLanguage)}
                        primaryTypographyProps={{ fontWeight: checked ? 700 : 500 }}
                      />
                      {/* This app's legacy palette.primary.main is white in light
                          mode (see theme.js), so color="primary" would render an
                          invisible checked box - the brand color is explicit. */}
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

                {filtered.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ textAlign: "center", py: 3, color: theme.palette.text.secondary }}
                  >
                    {search ? t("noDocumentTitleFound") : t("noDocumentTitlesYet")}
                  </Typography>
                )}
              </List>

              {atLimit && (
                <Typography variant="caption" sx={{ display: "block", mb: 1, color: theme.palette.warning.main }}>
                  {t("maxDocumentTitlesReached", { max: MAX_DOCUMENT_TYPES })}
                </Typography>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Adding a title is how the vocabulary grows. What is written
                  here is saved for everyone, so it asks for both scripts - a
                  title added in one language only would be unreadable to half
                  the site. */}
              {!showOtherForm ? (
                <Box sx={{ pb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: theme.palette.text.secondary, fontWeight: 500 }}
                  >
                    {t("cantFindDocument")}
                  </Typography>
                  <Button
                    fullWidth
                    onClick={() => setShowOtherForm(true)}
                    startIcon={<AddCircleOutlineRounded />}
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: 2,
                      py: 1.25,
                      px: 1.5,
                      fontWeight: 700,
                      textTransform: "none",
                      color: theme.custom.color.brandPrimary,
                      backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === "dark" ? 0.14 : 0.06),
                      "&:hover": {
                        backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === "dark" ? 0.2 : 0.12),
                      },
                    }}
                  >
                    {t("addNewDocument")}
                  </Button>
                </Box>
              ) : (
                <Collapse in appear>
                  <Box
                    sx={{
                      p: 2,
                      mb: 0.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.12 : 0.04),
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {t("addNewDocument")}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: theme.palette.text.secondary }}>
                      {t("otherDocumentHint")}
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      value={arabicLabel}
                      onChange={(event) => setArabicLabel(event.target.value)}
                      label={t("documentNameArabic")}
                      placeholder={t("documentNameArabicPlaceholder")}
                      helperText={t("documentNameArabicHelper")}
                      inputProps={{ dir: "rtl", maxLength: 80 }}
                      sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      value={latinLabel}
                      onChange={(event) => setLatinLabel(event.target.value)}
                      label={t("documentNameLatin")}
                      placeholder={t("documentNameLatinPlaceholder")}
                      helperText={t("documentNameLatinHelper")}
                      inputProps={{ dir: "ltr", maxLength: 80 }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />

                    {customError && (
                      <Typography variant="caption" sx={{ display: "block", mt: 1, color: theme.palette.error.main }}>
                        {customError}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button
                        onClick={handleAddCustom}
                        disabled={isCreating}
                        variant="contained"
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          fontWeight: 700,
                          textTransform: "none",
                          backgroundColor: theme.custom.color.brandPrimary,
                          color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                          "&:hover": { backgroundColor: theme.custom.color.brandPrimary },
                        }}
                      >
                        {isCreating ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : t("addDocumentTitle")}
                      </Button>
                      <Button
                        onClick={resetOtherForm}
                        disabled={isCreating}
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none", color: theme.palette.text.secondary }}
                      >
                        {t("cancel")}
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirm}
            disabled={isCreating}
            sx={{
              borderRadius: 2,
              py: 1.25,
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: theme.custom.color.brandPrimary,
              color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
              "&:hover": { backgroundColor: theme.custom.color.brandPrimary },
            }}
          >
            {draftIds.length > 0
              ? t("confirmDocumentTitles", { count: draftIds.length })
              : t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTypePickerField;
