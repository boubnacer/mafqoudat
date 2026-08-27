import { Box, Typography, useTheme, useMediaQuery, Link, alpha } from "@mui/material";
import RenderIcon from "../RenderIcon";
import { motion } from "framer-motion";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";

const Process = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();
  const isRTLMode = isRTL();

  const processSteps = [
    {
      icon: "share",
      text: t('shareToOurSocials'),
      description: t('shareToOurSocialsDesc'),
    },
    {
      icon: "ad",
      text: t('makeAdvertising'),
      description: t('makeAdvertisingDesc'),
    },
    {
      icon: "notif",
      text: t('wellNotifyYou'),
      description: t('wellNotifyYouDesc'),
    },
  ];

  const socialLinks = [
    { name: "face", url: "https://www.facebook.com/profile.php?id=100075968495897" },
    { name: "whats", url: "https://wa.me/212711621132" },
    { name: "insta", url: "https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu" },
  ];

  const stepCount = processSteps.length;
  const nodeSize = isMobile ? 56 : 64;

  // Same glass-blob family as QuickActions/Categories, toned down (gentle):
  // smaller blobs, lower opacity, since this panel already carries its own
  // motion (the step connectors/cards animate on scroll) and doesn't need a
  // loud backdrop competing with that.
  const processBlob = (color, position) => ({
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.14)} 0%, ${alpha(color, 0)} 70%)`,
    filter: 'blur(20px)',
    pointerEvents: 'none',
    ...position,
  });

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
        boxShadow: 'none',
        padding: { xs: '1.5rem', sm: '2.5rem', md: '3rem' },
      }}
    >
      <Box sx={processBlob(theme.custom.color.brandPrimary, { top: -80, insetInlineStart: -60 })} />
      <Box sx={processBlob(theme.custom.color.brandLogo, { bottom: -90, insetInlineEnd: -60 })} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
      {/* Heading */}
      <Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 4, md: 6 } }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 600, letterSpacing: 1, color: alpha(theme.custom.color.ink, 0.6) }}
        >
          {t('whatWeDo')}
        </Typography>
        <Typography
          variant="h4"
          fontWeight="700"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            color: theme.custom.color.ink,
            mt: 0.5,
          }}
        >
          {t('afterPostingInMafqoudat')}
        </Typography>
      </Box>

      {/* Step path */}
      <Box sx={{ position: 'relative' }}>
        {/* Connector — desktop horizontal */}
        <Box
          component={motion.div}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: nodeSize / 2 - 1,
            insetInlineStart: `calc(100% / ${stepCount * 2})`,
            insetInlineEnd: `calc(100% / ${stepCount * 2})`,
            height: 2,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${alpha(theme.custom.color.brandPrimary, 0.15)}, ${theme.custom.color.brandPrimary})`,
            transformOrigin: isRTLMode ? '100% 0' : '0% 0',
            zIndex: 0,
          }}
        />
        {/* Connector — mobile vertical */}
        <Box
          component={motion.div}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'absolute',
            insetInlineStart: nodeSize / 2,
            top: `calc(100% / ${stepCount * 2})`,
            bottom: `calc(100% / ${stepCount * 2})`,
            width: 2,
            background: `linear-gradient(180deg, ${alpha(theme.custom.color.brandPrimary, 0.15)}, ${theme.custom.color.brandPrimary})`,
            transformOrigin: '0 0%',
            zIndex: 0,
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 3 },
            alignItems: { xs: 'stretch', md: 'flex-start' },
          }}
        >
          {processSteps.map((step, index) => (
            <Box
              key={step.icon}
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.15, ease: 'easeOut' }}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: { xs: 2, md: 0 },
                textAlign: { xs: isRTLMode ? 'right' : 'left', md: 'center' },
                '&:hover .processNode': {
                  boxShadow: theme.custom.elevation.e2,
                  transform: 'translateY(-2px)',
                },
                '&:hover .processTextCard': {
                  boxShadow: theme.custom.elevation.e1,
                },
              }}
            >
              {/* Node — brand-tinted so it reads as the focal shape on a
                  surfaceRaised card, with a small numbered badge (this is a
                  sequence, not three independent facts) */}
              <Box
                className="processNode"
                sx={{
                  position: 'relative',
                  flexShrink: 0,
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                  boxShadow: theme.custom.elevation.e1,
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                }}
              >
                <RenderIcon name={step.icon} />
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    insetBlockEnd: -2,
                    insetInlineEnd: -2,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.custom.color.brandPrimary,
                    color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    boxShadow: theme.custom.elevation.e1,
                  }}
                >
                  {index + 1}
                </Box>
              </Box>

              {/* Text */}
              <Box
                className="processTextCard"
                sx={{
                  mt: { xs: 0, md: 2 },
                  p: { xs: 1.5, md: 2 },
                  borderRadius: `${theme.custom.radius.lg}px`,
                  backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.6),
                  transition: 'box-shadow 0.25s ease',
                  maxWidth: { md: 240 },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.2rem', md: '1.15rem' },
                    color: theme.custom.color.ink,
                  }}
                >
                  {step.text}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: { xs: '1.05rem', md: '1rem' },
                    color: alpha(theme.custom.color.ink, 0.7),
                  }}
                >
                  {step.description}
                </Typography>

                {/* Lost/Found-specific clarifier — the notify step genuinely
                    differs by post type, so it's worth spelling out. */}
                {step.icon === 'notif' && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          mt: '6px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          backgroundColor: theme.custom.status.lost.main,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.9rem', color: alpha(theme.custom.color.ink, 0.65) }}>
                        {t('notifyLostHint')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          mt: '6px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          backgroundColor: theme.custom.status.found.main,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.9rem', color: alpha(theme.custom.color.ink, 0.65) }}>
                        {t('notifyFoundHint')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Social links */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        sx={{ mt: { xs: 4, md: 5 } }}
      >
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: 1,
            color: alpha(theme.custom.color.ink, 0.6),
            mb: 1.5,
          }}
        >
          {t('followUs')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: theme.custom.color.surfaceRaised,
                boxShadow: theme.custom.elevation.e1,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.custom.elevation.e2,
                },
              }}
            >
              <RenderIcon name={social.name} />
            </Link>
          ))}
        </Box>
      </Box>
      </Box>
    </Box>
  );
};

export default Process;
