import { TextField, InputAdornment, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "../../utils/translations";

// Controlled free-text search box — sits at the top of the filter row, above
// whatever category/city dropdowns the page renders alongside it. Value/onChange
// are owned by the parent so it can debounce before firing a network request.
const Filter = ({ value, onChange }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={t('filter.searchPlaceholder')}
      size="small"
      dir="auto"
      sx={{
        width: { xs: '100%', sm: 320 },
        '& .MuiOutlinedInput-root': {
          borderRadius: `${theme.custom.radius.md}px`,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default Filter;
