import { useFormikContext } from "formik";
import { Button, CircularProgress, useTheme } from "@mui/material";
import { useTranslation } from "../../../../utils/translations";

// The final submit button (S5) - visually distinct from Back/Next, full
// width on mobile so it reads as the primary, deliberate action.
const ReviewSubmitButton = () => {
  const { isSubmitting } = useFormikContext();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      sx={{
        width: { xs: '100%', sm: 'auto' },
        minWidth: { sm: 220 },
        padding: '12px 24px',
        fontSize: '1rem',
        fontWeight: 600,
        borderRadius: 2,
        textTransform: 'none',
        background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
        color: '#fff !important',
        boxShadow: '0 4px 15px rgba(26, 110, 238, 0.3)',
        '&:hover': {
          background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
          boxShadow: '0 6px 20px rgba(26, 110, 238, 0.4)',
          transform: 'translateY(-1px)',
          color: '#fff !important',
        },
        '&:disabled': {
          background: theme.palette.mode === 'dark' ? 'rgba(74, 139, 255, 0.3)' : 'rgba(26, 110, 238, 0.3)',
          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5) !important' : 'rgba(255,255,255,0.7) !important',
          transform: 'none',
          boxShadow: 'none',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('createPost')}
    </Button>
  );
};

export default ReviewSubmitButton;
