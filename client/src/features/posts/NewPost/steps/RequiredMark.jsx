import { Box, useTheme } from "@mui/material";
import { useTranslation } from "../../../../utils/translations";

// Small asterisk for required fields. Rendered as an inline span right after
// the label text so the browser's own bidi handling places it on the
// correct side automatically in RTL - no direction branching needed here.
const RequiredMark = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box component="span" aria-label={t('wizardRequiredMark')} sx={{ color: theme.palette.error.main, mx: 0.5 }}>
      *
    </Box>
  );
};

export default RequiredMark;
