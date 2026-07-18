// mui theme settings
import { createTheme } from '@mui/material/styles';

export const themeSettings = (mode, currentLanguage = 'en') => {
  const isRTL = currentLanguage === 'ar'; // Use currentLanguage for RTL detection
  
  return createTheme({
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
            // found or lost options ------------------
            floptions: {
              found: {
                back: "#D3FBD8",
                // text: "#007C4F",
                text: "#00FF00", // for recent icon color #ADD8E6 
              },
              lost: {
                back: "#FF8B9B",
                text: "#FFA500",  // 
              },
            },
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
              text: {},
              icon: {
                cateIconMain: "#00bcd4",
                cateIconBack: "#006064",
              },
              back: "#006064",
              text: "#00bcd4",
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
            floptions: {
              found: {
                back: "#D3FBD8",
                text: "#007C4F",
              },
              lost: {
                back: "#FF8B9B",
                text: "#AD0000",
              },
            },
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
      // Modern typography with proper Arabic support
      fontFamily: isRTL 
        ? ['"Noto Sans Arabic"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(',')
        : ['"Inter"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      
      // Responsive font sizes
      h1: {
        fontSize: isRTL ? '2.5rem' : '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: isRTL ? '2rem' : '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: isRTL ? '1.75rem' : '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: isRTL ? '1.5rem' : '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: isRTL ? '1.25rem' : '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: isRTL ? '1.125rem' : '1.125rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: isRTL ? '1rem' : '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: isRTL ? '0.875rem' : '0.875rem',
        lineHeight: 1.6,
      },
      caption: {
        fontSize: isRTL ? '0.75rem' : '0.75rem',
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
