// mui theme settings
import { createTheme } from '@mui/material/styles';
import { fontFamilies, resolveDesignTokens } from './designTokens';

export const themeSettings = (mode, currentLanguage = 'en') => {
  const isRTL = currentLanguage === 'ar'; // Use currentLanguage for RTL detection
  const tokens = resolveDesignTokens(mode);

  return createTheme({
    // Phase 1 design tokens (client/src/designTokens.js), resolved for this mode.
    // New work should read colors/radius/elevation from here instead of hardcoding.
    custom: tokens,
    direction: isRTL ? 'rtl' : 'ltr',
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light',
      ...(mode === "dark"
        ? {
            // palette values for dark mode

            primary: {
              main:"#3C3C3C"  //#242526 ,
            },
            secondary: {
              main: "#3498DB",
              alt: "#14191F",
            },
            action: {
              back: "#202122", // A slightly lighter shade of dark gray 242526
              main: "#FF7828",
            },
            textColor: {
              main: "#E0E0E0", 
              secondary:"#B0B0B0",
              title: "#CCCCCC",
              links: "#FFFFFF", //#AAAAAA
            },
            background: {
              default: "#121212",
              paper: "#1E1E1E",
            },
            category: "#4E4F50",
            // caetgories -----
            categories: {
              // Electronics
              electronicscate: {
                back: "#E0F7FA",
                icon: "#00BCD4",
              },
              // Documents
              documentscate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Jewelry
              jewelrycate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Clothing
              clothingcate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Pets
              petscate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Vehicles
              vehiclescate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Keys
              keyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Wallet
              walletcate: {
                back: "#FBE9E7",
                icon: "#FF5722",
              },
              // Watches
              watchescate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Gaming
              gamingcate: {
                back: "#FCE4EC",
                icon: "#E91E63",
              },
              // Medical
              medicalcate: {
                back: "#FFEBEE",
                icon: "#F44336",
              },
              // Luggage
              luggagecate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Person
              personcate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Shopping
              shoppingcate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Work
              workcate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Sports
              sportscate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Music
              musiccate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Toys
              toyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Beauty
              beautycate: {
                back: "#FCE4EC",
                icon: "#E91E63",
              },
              // Camera
              cameracate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Tools
              toolscate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Garden
              gardencate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Home
              homecate: {
                back: "#F1F8E9",
                icon: "#8BC34A",
              },
              // Food
              foodcate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Other
              othercate: {
                back: "#F5F5F5",
                icon: "#9E9E9E",
              },
              // Legacy fallbacks
              keyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              personcate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              bagcate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              moneycate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              devicecate: {
                back: "#E0F7FA",
                icon: "#00BCD4",
              },
              walletcate: {
                back: "#FBE9E7",
                icon: "#FF5722",
              },
              vehiclecate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              documentcate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
            },
            // Text color :
            text: {
              white: "#FFFFFF",
              black: "#000000",
              primary: "#CCCCCC", // Default text color
              secondary: "#AAAAAA", // Secondary text color
              title: "#7FB3D5",
              description: "#CCCCCC", //#707070
              navlinks: "#AAAAAA",
              recentIcon: "",
            },
          }
        : {
            // palette values for light mode

            primary: {
              main: "#FFFFFF",
            },
            secondary: {
              main: "#3498DB",
              alt: "#E2E4E7",
            },
            action: {
              main: "#2C2D2E", 
            },
            textColor: {
              main: "#000000",
              secondary:"#B0B0B0"
            },
            background: {
              default: "#fafafa",
              paper: "#ffffff",
            },
            category: "#E4E6E9",
            // categories - using centralized configuration
            categories: {
              // Electronics
              electronicscate: {
                back: "#E0F7FA",
                icon: "#00BCD4",
              },
              // Documents
              documentscate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Jewelry
              jewelrycate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Clothing
              clothingcate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Pets
              petscate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Vehicles
              vehiclescate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Keys
              keyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Wallet
              walletcate: {
                back: "#FBE9E7",
                icon: "#FF5722",
              },
              // Watches
              watchescate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Gaming
              gamingcate: {
                back: "#FCE4EC",
                icon: "#E91E63",
              },
              // Medical
              medicalcate: {
                back: "#FFEBEE",
                icon: "#F44336",
              },
              // Luggage
              luggagecate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              // Person
              personcate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Shopping
              shoppingcate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Work
              workcate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Sports
              sportscate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Music
              musiccate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              // Toys
              toyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Beauty
              beautycate: {
                back: "#FCE4EC",
                icon: "#E91E63",
              },
              // Camera
              cameracate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              // Tools
              toolscate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              // Garden
              gardencate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              // Home
              homecate: {
                back: "#F1F8E9",
                icon: "#8BC34A",
              },
              // Food
              foodcate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              // Other
              othercate: {
                back: "#F5F5F5",
                icon: "#9E9E9E",
              },
              // Legacy fallbacks
              keyscate: {
                back: "#FFF3E0",
                icon: "#FF9800",
              },
              personcate: {
                back: "#E3F2FD",
                icon: "#2196F3",
              },
              bagcate: {
                back: "#E8F5E9",
                icon: "#4CAF50",
              },
              moneycate: {
                back: "#F3E5F5",
                icon: "#9C27B0",
              },
              devicecate: {
                back: "#E0F7FA",
                icon: "#00BCD4",
              },
              walletcate: {
                back: "#FBE9E7",
                icon: "#FF5722",
              },
              vehiclecate: {
                back: "#ECEFF1",
                icon: "#607D8B",
              },
              documentcate: {
                back: "#EFEBE9",
                icon: "#795548",
              },
              back: "#FFECCC",
              text: "#E79C25",
            },
          }),
    },

    typography: {
      // Phase 1 type system: Cairo (display) + IBM Plex Sans Arabic (body).
      // Both faces have solid Arabic + Latin coverage, so no per-language font swap is needed.
      fontFamily: fontFamilies.body,

      // Responsive font sizes
      h1: {
        fontFamily: fontFamilies.display,
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: fontFamilies.display,
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: fontFamilies.display,
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontFamily: fontFamilies.display,
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontFamily: fontFamilies.display,
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontFamily: fontFamilies.display,
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.6,
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },

      category: {
        fontFamily: isRTL 
          ? ['"Noto Sans Arabic"', 'sans-serif'].join(',')
          : ['"Inter"', 'sans-serif'].join(','),
        fontSize: isRTL ? '1rem' : '1rem',
        fontWeight: 500,
      },

      floption: {
        fontFamily: isRTL 
          ? ['"Noto Sans Arabic"', 'sans-serif'].join(',')
          : ['"Inter"', 'sans-serif'].join(','),
        fontSize: isRTL ? '0.875rem' : '0.875rem',
        fontWeight: 500,
      },

      welcome: {
        fontFamily: ["Source Code Pro", "monospace"].join(","),
      },

      brandName: {
        fontFamily: isRTL 
          ? ['"Noto Sans Arabic"', 'normal'].join(',')
          : ["Agbalumo", "normal"].join(","),
        fontSize: isRTL ? '1.5rem' : 24,
        fontWeight: 600,
      }
    },

    // RTL-aware spacing
    spacing: (factor) => `${8 * factor}px`,
    
    // Custom breakpoints for large screens (1920x1080 support)
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
        xxl: 1920, // Custom breakpoint for 1920px screens
      },
    },
    
    // RTL-aware components
    components: {
      MuiChip: {
        styleOverrides: {
          root: {
            // Ensure proper RTL support for chips
            '& .MuiChip-label': {
              textAlign: 'center',
            },
            // Same physical-margin issue as MuiButton's icons: these mirror MUI's
            // default icon/deleteIcon spacing but as logical properties so the gap
            // stays between the icon and the label when RTL swaps their sides.
            '& .MuiChip-icon': {
              marginRight: 0,
              marginLeft: 0,
              marginInlineStart: 5,
              marginInlineEnd: -6,
            },
            '&.MuiChip-sizeSmall .MuiChip-icon': {
              marginInlineStart: 4,
              marginInlineEnd: -4,
            },
            '& .MuiChip-deleteIcon': {
              marginRight: 0,
              marginLeft: 0,
              marginInlineEnd: 5,
              marginInlineStart: -6,
            },
            '&.MuiChip-sizeSmall .MuiChip-deleteIcon': {
              marginInlineEnd: 4,
              marginInlineStart: -4,
            },
          },
        },
      },
      MuiInputAdornment: {
        styleOverrides: {
          // Positional margins are physical by default, which loses the gap toward
          // the input's text once RTL mirrors which side the adornment sits on.
          positionStart: {
            marginRight: 0,
            marginLeft: 0,
            marginInlineEnd: 8,
          },
          positionEnd: {
            marginRight: 0,
            marginLeft: 0,
            marginInlineStart: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            // Ensure proper RTL support for buttons
            textTransform: 'none',
            fontWeight: 500,
          },
          // MUI's default startIcon/endIcon margins are physical (marginLeft/marginRight),
          // so they don't follow the button when RTL flips the icon to the other side —
          // this is what collapses the gap between icon and label in Arabic. Logical
          // properties resolve relative to direction, so the gap follows the icon in both modes.
          startIcon: {
            marginRight: 0,
            marginLeft: 0,
            marginInlineEnd: 8,
            marginInlineStart: -4,
            '&.MuiButton-iconSizeSmall': {
              marginInlineStart: -2,
            },
          },
          endIcon: {
            marginRight: 0,
            marginLeft: 0,
            marginInlineStart: 8,
            marginInlineEnd: -4,
            '&.MuiButton-iconSizeSmall': {
              marginInlineEnd: -2,
            },
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          // Same physical-padding issue as MuiButton/MuiChip's icon margins above:
          // MUI's default iconContainer uses paddingRight (physical), which collapses
          // the gap between the step icon and its label once RTL puts the label on
          // the icon's other side. paddingInlineEnd keeps the gap on the correct side
          // in both directions.
          iconContainer: {
            paddingRight: 0,
            paddingInlineEnd: 8,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            // Ensure proper RTL support for icon buttons
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
            },
          },
        },
      },
      // Fix dropdown background opacity issues
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#2d2d2d' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            '& .MuiAutocomplete-option': {
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&[aria-selected="true"]': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              },
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#2d2d2d' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#2d2d2d' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            },
          },
        },
      },
      // RTL icon rotation for directional icons
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            // Auto-rotate directional icons in RTL
            '[dir="rtl"] &[data-directional="true"]': {
              transform: 'scaleX(-1)',
            },
          },
        },
      },
      // Container component - support for large screens (1920x1080)
      MuiContainer: {
        styleOverrides: {
          root: {
            // For screens 1920px and above, use a larger max-width
            '@media (min-width: 1920px)': {
              maxWidth: '1800px',
            },
          },
        },
      },
    },
  });
};
