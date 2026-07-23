import { Box, Button, useTheme, alpha } from "@mui/material";
import { useTranslation } from "../../../../utils/translations";

// Shared Back/Next action bar for the wizard steps. Anchored to the bottom
// of the viewport on mobile (so actions stay reachable without scrolling
// back up) and inline on larger screens. `stackOnMobile` switches to a
// stacked column on xs instead of a row - needed when the primary action
// (e.g. ReviewSubmitButton) is full-width on mobile, so it doesn't get
// squeezed into the same row as the Back button.
const WizardFooter = ({ showBack = true, onBack, stackOnMobile = false, children }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        mt: 4,
        pt: 2,
        display: 'flex',
        flexDirection: stackOnMobile ? { xs: 'column-reverse', sm: 'row' } : 'row',
        justifyContent: showBack ? 'space-between' : 'flex-end',
        alignItems: stackOnMobile ? { xs: 'stretch', sm: 'center' } : 'center',
        gap: 2,
        position: { xs: 'sticky', sm: 'static' },
        bottom: 0,
        // Only needed on mobile, to occlude content scrolling behind the sticky
        // bar. On desktop this sits statically inline in the form, so a flat
        // fill here reads as a mismatched block against the Paper's actual
        // rendered surface (MUI layers a subtle elevation overlay on Paper in
        // dark mode, which this flat token color doesn't pick up) - transparent
        // lets it blend into the card instead.
        backgroundColor: { xs: theme.custom.color.surfaceRaised, sm: 'transparent' },
        borderTop: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
        pb: { xs: 2, sm: 0 },
        zIndex: 2,
      }}
    >
      {showBack ? (
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            color: theme.custom.color.brandPrimary,
            borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
            '&:hover': {
              borderColor: theme.custom.color.brandPrimary,
              backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
            },
          }}
        >
          {t('back')}
        </Button>
      ) : (
        <span />
      )}
      {children}
    </Box>
  );
};

export default WizardFooter;
