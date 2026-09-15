import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { SearchOutlined, FilterAltOffOutlined } from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { actionButtonSx, inputSx } from './adminSx';

// How long to wait after the last keystroke before actually calling
// search.onChange. Every one of this bar's four callers (Moderation, Users,
// Posts, Support) wires it straight into a $regex query, so without this the
// field fired one request per keystroke.
const SEARCH_DEBOUNCE_MS = 350;

/**
 * The filter row every list page shares.
 *
 * Filters sit in one row above the list (the search field first, then the
 * selects, then "clear"), wrap onto more rows as the screen narrows, and never
 * appear inside the list itself. Controls keep their borders - the borderless
 * rule is for containers, not for things you type into or choose from.
 */
const FilterBar = ({ search, selects = [], onClear, hasActiveFilters, children }) => {
  const { t } = useTranslation();

  // Debounced locally rather than by each of the four pages separately - one
  // fix here covers all of them, and the field still feels instant to type
  // in since it's this local state, not the debounced onChange, that drives
  // the TextField's value.
  const [localSearchValue, setLocalSearchValue] = useState(search?.value || '');

  // Stay in sync with an external reset (e.g. "Clear filters", or a filter
  // change elsewhere that clears the search too).
  useEffect(() => {
    setLocalSearchValue(search?.value || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.value]);

  useEffect(() => {
    if (!search) return undefined;
    if (localSearchValue === (search.value || '')) return undefined;

    const timer = setTimeout(() => {
      search.onChange(localSearchValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchValue]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.25,
        mb: 2,
      }}
    >
      {search ? (
        <TextField
          size="small"
          value={localSearchValue}
          onChange={(event) => setLocalSearchValue(event.target.value)}
          placeholder={search.placeholder}
          sx={(theme) => ({
            ...inputSx(theme),
            flex: '1 1 220px',
            minWidth: 0,
            maxWidth: 460,
            '& .MuiOutlinedInput-root': {
              ...inputSx(theme)['& .MuiOutlinedInput-root'],
              backgroundColor: theme.custom.color.surfaceRaised,
            },
          })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          inputProps={{ 'aria-label': search.placeholder }}
        />
      ) : null}

      {selects.map((select) => (
        <FormControl
          key={select.id}
          size="small"
          sx={(theme) => ({
            ...inputSx(theme),
            flex: `0 1 ${select.width || 170}px`,
            minWidth: 132,
            '& .MuiOutlinedInput-root': {
              ...inputSx(theme)['& .MuiOutlinedInput-root'],
              backgroundColor: theme.custom.color.surfaceRaised,
            },
          })}
        >
          <InputLabel id={`admin-filter-${select.id}`}>{select.label}</InputLabel>
          <Select
            labelId={`admin-filter-${select.id}`}
            label={select.label}
            value={select.value}
            onChange={(event) => select.onChange(event.target.value)}
          >
            {select.options.map((option) => (
              <MenuItem key={String(option.value)} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      {children}

      {onClear ? (
        <Button
          onClick={onClear}
          disabled={!hasActiveFilters}
          startIcon={<FilterAltOffOutlined />}
          sx={(theme) => ({ ...actionButtonSx('neutral')(theme), flexShrink: 0 })}
        >
          {t('clearFilters')}
        </Button>
      ) : null}
    </Box>
  );
};

export default FilterBar;
