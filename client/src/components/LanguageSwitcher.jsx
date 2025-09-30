import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { Language, KeyboardArrowDown } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setCurrentCountry } from '../app/state';
import { useGetCountriesQuery } from '../features/countries/countriesApiSlice';
import { LoadingState } from './LoadingStates';
import { SUPPORTED_LANGUAGES } from '../utils/languageUtils';
import { useUnifiedLanguageChange } from '../hooks/useUnifiedLanguageChange';

const LanguageSwitcher = ({ variant = 'button', onLanguageChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentLanguage, changeLanguage, isChanging } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: 'medium',
    enableLogging: process.env.NODE_ENV === 'development'
  });
  const theme = useTheme();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (language) => {
    console.log('🌐 [LANGUAGE-SWITCHER] Language change triggered:', { language, currentUrl: window.location.href });
    
    try {
      // Use unified language change handler
      const success = await changeLanguage(language);
      
      if (success) {
        handleClose();
        
        // Notify parent component if callback provided
        if (onLanguageChange) {
          onLanguageChange(language);
        }
        
        console.log('🌐 [LANGUAGE-SWITCHER] Language changed successfully to:', language);
      } else {
        console.error('🌐 [LANGUAGE-SWITCHER] Failed to change language to:', language);
      }
    } catch (error) {
      console.error('🌐 [LANGUAGE-SWITCHER] Error changing language:', error);
    }
  };

  const currentLanguageInfo = SUPPORTED_LANGUAGES[currentLanguage];

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Change Language">
          <IconButton
            onClick={handleClick}
            sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <Language />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
            <MenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              selected={code === currentLanguage}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 120
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <Typography variant="body2">{lang.name}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        endIcon={<KeyboardArrowDown />}
        startIcon={<Language />}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light + '10'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: '1.1rem' }}>{currentLanguageInfo.flag}</span>
          <Typography variant="body2">{currentLanguageInfo.name}</Typography>
        </Box>
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            minWidth: 150
          }
        }}
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            selected={code === currentLanguage}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light + '20',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light + '30'
                }
              }
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{lang.flag}</span>
            <Box>
              <Typography variant="body2" fontWeight={code === currentLanguage ? 600 : 400}>
                {lang.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {code.toUpperCase()}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 