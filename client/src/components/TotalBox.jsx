import { Box, Typography, useTheme, alpha } from "@mui/material";
import React, { useRef } from "react";
import FlexBetween from "./FlexBetween";
import { useTranslation } from "../utils/translations";
import { gsap, useGSAP } from "../utils/gsapSetup";

const StatBox = ({ title, value, icon, description, titleStyle, valueStyle, descriptionStyle, iconStyle, sx, hasNotification = false, notificationColor, onClick, countUp = false, ...rest }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const valueRef = useRef(null);

  // Opt-in count-up for the headline figure, matching the one FoundLostStrip
  // already runs on the Found/Lost totals beside it — without it the stats
  // panel had two numbers that count and two that simply appear.
  //
  // The tween writes textContent directly instead of going through state:
  // one tween per mount beats ~60 React renders per second, and React still
  // owns the final value, so any re-render lands on the real number.
  const numericValue = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  const shouldCount = countUp && Number.isFinite(numericValue) && numericValue > 0;

  useGSAP(
    () => {
      if (!shouldCount || !valueRef.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { current: 0 };
        // useGSAP runs in a layout effect, so this lands before paint — the
        // final number is never shown and then snapped back to zero.
        valueRef.current.textContent = "0";
        gsap.to(counter, {
          current: numericValue,
          duration: 1.2,
          ease: "power2.out",
          snap: { current: 1 },
          onUpdate: () => {
            if (valueRef.current) valueRef.current.textContent = String(counter.current);
          },
        });
      });
    },
    { dependencies: [numericValue, shouldCount], revertOnUpdate: true }
  );
  const defaultNotificationColor = notificationColor || (theme.palette.mode === 'dark' ? '#FF6B6B' : '#EF4444');
  
  return (
    <Box
      {...rest}
      p="1.5rem"
      borderRadius="16px"
      position="relative"
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        // Glass edge + top highlight, matching FoundLostStrip/LeftSide
        // beside it — a hairline border and a lift shadow (elevation e1,
        // e2 on hover) instead of 'none' when there's no notification glow
        // to carry that job instead.
        border: `1px solid ${alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.28 : 0.18)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          insetInlineStart: 0,
          insetInlineEnd: 0,
          top: 0,
          height: '1px',
          borderRadius: '16px 16px 0 0',
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.3 : 0.75)}, transparent)`,
          pointerEvents: 'none',
        },
        boxShadow: hasNotification
          ? theme.palette.mode === 'dark'
            ? `0 8px 32px 0 ${defaultNotificationColor}30, 0 0 20px 0 ${defaultNotificationColor}20`
            : `0 8px 32px 0 ${defaultNotificationColor}25, 0 0 20px 0 ${defaultNotificationColor}15`
          : theme.custom.elevation.e1,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
        ...(hasNotification && {
          animation: 'pulseGlow 2s ease-in-out infinite',
          '@keyframes pulseGlow': {
            '0%, 100%': {
              boxShadow: theme.palette.mode === 'dark'
                ? `0 8px 32px 0 ${defaultNotificationColor}30, 0 0 20px 0 ${defaultNotificationColor}20`
                : `0 8px 32px 0 ${defaultNotificationColor}25, 0 0 20px 0 ${defaultNotificationColor}15`,
            },
            '50%': {
              boxShadow: theme.palette.mode === 'dark'
                ? `0 8px 40px 0 ${defaultNotificationColor}40, 0 0 30px 0 ${defaultNotificationColor}30`
                : `0 8px 40px 0 ${defaultNotificationColor}35, 0 0 30px 0 ${defaultNotificationColor}25`,
            },
          },
        }),
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: hasNotification
            ? theme.palette.mode === 'dark'
              ? `0 12px 48px 0 ${defaultNotificationColor}40, 0 0 30px 0 ${defaultNotificationColor}30`
              : `0 12px 48px 0 ${defaultNotificationColor}35, 0 0 30px 0 ${defaultNotificationColor}25`
            : theme.custom.elevation.e2,
        },
        height: { xs: '240px', sm: 'auto' }, // Increased height for longer text in mobile
        minHeight: { xs: '240px', sm: '180px' }, // Increased minimum height for desktop mode
        width: { xs: '100%', sm: 'auto' }, // Same width for all boxes on mobile
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      {/* Title */}
      <Typography 
        fontWeight="600" 
        fontSize="1rem"
        sx={{ 
          letterSpacing: '0.5px',
          paddingRight: { xs: '50px', sm: 0 }, // Add right padding on mobile to avoid icon overlap (LTR)
          paddingLeft: { xs: 0, sm: 0 }, // No left padding needed (LTR)
          // RTL support for padding
          '[dir="rtl"] &': {
            paddingRight: { xs: 0, sm: 0 }, // No right padding in RTL
            paddingLeft: { xs: '50px', sm: 0 }, // Add left padding on mobile in RTL to avoid icon overlap
          },
          ...titleStyle 
        }}
      >
        {title}
      </Typography>

      {/* Icon positioned absolutely */}
      <Box
        sx={{
          position: 'absolute',
          top: '12px',
          right: '12px', // Top-right in LTR
          background: iconStyle?.background || (theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)'),
          borderRadius: '12px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          width: '40px', // Fixed width for uniform sizing
          height: '40px', // Fixed height for uniform sizing
          minWidth: '40px', // Ensure minimum width
          minHeight: '40px', // Ensure minimum height
          '& svg': {
            color: iconStyle?.color || (theme.palette.mode === 'dark' ? '#B0BEC5' : '#4A5568'),
            transition: 'color 0.3s ease',
            fontSize: '20px', // Fixed icon size for consistency
            width: '20px',
            height: '20px'
          },
          // RTL support
          '[dir="rtl"] &': {
            right: 'auto',
            left: '12px', // Top-left in RTL
          }
        }}
      >
        {icon}
      </Box>

      {/* Notification Badge on Box Container */}
      {hasNotification && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '12px',
            right: '12px', // Bottom-right in LTR
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${defaultNotificationColor} 0%, ${defaultNotificationColor}DD 100%)`,
            border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)'}`,
            boxShadow: `0 0 0 2px ${defaultNotificationColor}40, 0 2px 8px 0 ${defaultNotificationColor}60`,
            animation: 'pulseDot 2s ease-in-out infinite',
            '@keyframes pulseDot': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.15)',
                opacity: 0.85,
              },
            },
            // RTL support - inverse position
            '[dir="rtl"] &': {
              right: 'auto',
              left: '12px', // Bottom-left in RTL
            }
          }}
        />
      )}

      <Box mt="1rem" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Typography
          ref={valueRef}
          fontWeight="600"
          fontSize="2rem"
          sx={valueStyle}
        >
          {value}
        </Typography>
        
        {/* Description positioned absolutely at bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '0',
            left: '0', // Bottom-left in LTR
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            // RTL support
            '[dir="rtl"] &': {
              left: 'auto',
              right: '0', // Bottom-right in RTL
            }
          }}
        >
          <Typography
            fontSize="0.875rem"
            sx={{
              ...descriptionStyle,
              textAlign: 'left',
              // RTL support
              '[dir="rtl"] &': {
                textAlign: 'right',
              }
            }}
          >
            {description}
          </Typography>
          {/* Notification Badge */}
          {hasNotification && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                px: '6px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${defaultNotificationColor} 0%, ${defaultNotificationColor}DD 100%)`,
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                boxShadow: `0 2px 8px 0 ${defaultNotificationColor}50`,
                animation: 'bounceIn 0.5s ease-out',
                '@keyframes bounceIn': {
                  '0%': {
                    transform: 'scale(0)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.15)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }}
            >
              {t('new')}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StatBox;
