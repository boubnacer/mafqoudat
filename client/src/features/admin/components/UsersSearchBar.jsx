import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import {
  Search,
  Clear,
} from '@mui/icons-material';

const UsersSearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search by username, email, or phone...',
}) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);

  // Debounced onChange handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onChange && localValue !== value) {
        onChange(localValue);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, value]);

  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
  }, [onChange]);

  const handleChange = (event) => {
    setLocalValue(event.target.value);
  };

  return (
    <Box sx={{ width: { xs: '100%', sm: 400 } }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: theme.palette.text.secondary }} />
            </InputAdornment>
          ),
          endAdornment: localValue && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-focused': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)',
            },
          },
        }}
      />
    </Box>
  );
};

export default UsersSearchBar;

