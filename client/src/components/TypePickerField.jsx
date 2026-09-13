import { useState } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, Check as CheckIcon, CompareArrowsOutlined } from "@mui/icons-material";

// Single-select dropdown for a small, known list of options (Found/Lost/All),
// built to be the box-for-box twin of CategoryPickerField: same trigger box
// (height, border, radius, background, muted leading icon, chevron) and the
// same colored-circle list-item treatment inside the popup - a Menu rather
// than CategoryPickerField's Dialog, since there's no search to do and a
// single pick should apply and close immediately, the way a native dropdown
// does.
const TypePickerField = ({ options, value, onChange, placeholder, error, errorText, dataTestId }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const selectedOption = (options || []).find((option) => option.id === value) || null;

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (id) => {
    onChange(id);
    setAnchorEl(null);
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
            handleOpen(event);
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
        <CompareArrowsOutlined fontSize="small" sx={{ color: alpha(theme.custom.color.ink, 0.6), flexShrink: 0 }} />
        <Typography
          noWrap
          sx={{
            flex: 1,
            color: selectedOption ? theme.palette.text.primary : theme.palette.text.secondary,
            fontWeight: selectedOption ? 600 : 400,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Typography>
        <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
      </Box>

      {errorText && (
        <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: theme.palette.error.main }}>
          {errorText}
        </Typography>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 0.5,
            minWidth: anchorEl?.offsetWidth,
          },
        }}
      >
        {(options || []).map((option) => {
          const selected = option.id === value;
          const Icon = option.icon;
          const tone = option.tone;
          const circleBg = tone
            ? (theme.palette.mode === "dark" ? alpha(tone.main, 0.2) : tone.bg)
            : alpha(theme.custom.color.brandPrimary, 0.1);
          const iconColor = tone ? tone.main : theme.custom.color.brandPrimary;
          return (
            <MenuItem
              key={option.id || "all"}
              onClick={() => handleSelect(option.id)}
              selected={selected}
              sx={{
                gap: 1,
                py: 1,
                borderRadius: 1,
                mx: 0.5,
                "&.Mui-selected": { backgroundColor: circleBg },
                "&.Mui-selected:hover": { backgroundColor: circleBg },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: circleBg,
                  }}
                >
                  {Icon ? (
                    <Icon fontSize="small" sx={{ color: iconColor }} />
                  ) : (
                    <CompareArrowsOutlined fontSize="small" sx={{ color: iconColor }} />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText primary={option.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }} />
              {selected && (
                <CheckIcon fontSize="small" sx={{ color: iconColor, marginInlineStart: 1 }} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default TypePickerField;
