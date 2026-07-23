import { Button, useTheme, alpha } from "@mui/material";
import { lighten } from "@mui/material/styles";
import { useTranslation } from "../../../../utils/translations";

// The "Next" action shared by the Item/Location/Photo steps. Styled to match
// ReviewSubmitButton's brand gradient rather than MUI's unstyled `contained`
// default, which falls back to theme.js's legacy palette.primary (near-black
// in dark mode, near-white in light mode) and reads as an off-brand button.
const WizardNextButton = ({ onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const brandPrimary = theme.custom.color.brandPrimary;
  const contrastText = theme.palette.getContrastText(brandPrimary);

  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        px: 4,
        py: 1.25,
        fontWeight: 600,
        background: `linear-gradient(45deg, ${brandPrimary} 30%, ${lighten(brandPrimary, 0.15)} 90%)`,
        color: `${contrastText} !important`,
        boxShadow: `0 4px 15px ${alpha(brandPrimary, 0.3)}`,
        '&:hover': {
          background: `linear-gradient(45deg, ${lighten(brandPrimary, 0.08)} 30%, ${lighten(brandPrimary, 0.25)} 90%)`,
          boxShadow: `0 6px 20px ${alpha(brandPrimary, 0.4)}`,
          transform: 'translateY(-1px)',
          color: `${contrastText} !important`,
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {t('wizardNext')}
    </Button>
  );
};

export default WizardNextButton;
