import { Box, Typography, useTheme, Link } from "@mui/material";
import ProcessSvg from "../../img/ProcessSvg.svg";
import RenderIcon from "../RenderIcon";
import { motion } from "framer-motion";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";

const Process = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isRTLMode = isRTL();

  const processSteps = [
    {
      icon: "share",
      text: t('shareToOurSocials'),
      description: t('shareToOurSocialsDesc')
    },
    {
      icon: "ad",
      text: t('makeAdvertising'),
      description: t('makeAdvertisingDesc')
    },
    {
      icon: "notif",
      text: t('wellNotifyYou'),
      description: t('wellNotifyYouDesc')
    }
  ];

  const socialLinks = [
    { name: "face", url: "https://facebook.com/mafqoudat" },
    { name: "whats", url: "https://wa.me/mafqoudat" },
    { name: "x", url: "https://twitter.com/mafqoudat" },
    { name: "insta", url: "https://instagram.com/mafqoudat" }
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: { xs: "2rem", md: "3rem" },
        flexDirection: { xs: "column", md: "row" },
        padding: { xs: "2rem 1rem", md: "5rem 2rem" },
        backgroundColor: theme.palette.background.default,
        transition: "all 0.3s ease"
      }}
    >
      {/* Left side */}
      <Box 
        sx={{ 
          padding: { xs: "2rem 0", md: "5rem 0" },
          maxWidth: "600px",
          transition: "all 0.3s ease"
        }}
      >
        <Typography 
          variant="h2" 
          fontWeight="600" 
          fontSize={{ xs: "28px", md: "36px" }}
          sx={{
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
            transition: "color 0.3s ease"
          }}
        >
          {t('whatWeDo')}
        </Typography>
        <Typography 
          variant="h3" 
          fontWeight="800" 
          fontSize={{ xs: "24px", md: "28px" }} 
          mt="1rem"
          sx={{
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
            transition: "color 0.3s ease"
          }}
        >
          {t('afterPostingInMafqoudat')}
        </Typography>

        <Box mt="3rem" display="flex" flexDirection="column" gap="1.5rem">
          {processSteps.map((step, index) => (
            <Box
              key={step.icon}
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "1rem",
                borderRadius: "12px",
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : theme.palette.background.default,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: "all 0.3s ease",
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : theme.palette.category}`,
                "&:hover": {
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : theme.palette.background.default,
                }
              }}
            >
              <RenderIcon name={step.icon} />
              <Box sx={{ ml: isRTLMode ? "1.5rem" : "1rem", mr: isRTLMode ? "1rem" : 0 }}>
                <Typography
                  component="div"
                  sx={{ 
                    color: theme.palette.textColor.main,
                    fontSize: { xs: "18px", sm: "17px" },
                    fontWeight: 600,
                    transition: "color 0.3s ease",
                    direction: isRTLMode ? 'rtl' : 'ltr'
                  }}
                >
                  {step.text}
                </Typography>
                <Typography
                  component="div"
                  sx={{ 
                    color: theme.palette.textColor.secondary,
                    fontSize: { xs: "16px", sm: "15px" },
                    mt: 0.5,
                    transition: "color 0.3s ease",
                    direction: isRTLMode ? 'rtl' : 'ltr'
                  }}
                >
                  {step.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box 
          mt="3rem" 
          display="flex" 
          gap="1.5rem"
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : theme.palette.background.default,
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : theme.palette.category}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : theme.palette.background.default,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <RenderIcon name={social.name} />
            </Link>
          ))}
        </Box>
      </Box>

      {/* Right side */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        sx={{
          padding: { xs: "2rem 0", md: "4rem 0" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          "& img": {
            maxWidth: "100%",
            height: "auto",
            maxHeight: "500px",
            filter: theme.palette.mode === 'dark' ? 'brightness(0.8)' : 'none',
            transition: "filter 0.3s ease"
          }
        }}
      >
        <img src={ProcessSvg} alt="Process illustration" />
      </Box>
    </Box>
  );
};

export default Process;
