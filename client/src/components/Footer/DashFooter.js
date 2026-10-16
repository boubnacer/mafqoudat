import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Facebook,
  Instagram,
  WhatsApp,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import useCountryName from "../../hooks/useCountryName";
import { authStorage } from "../../utils/authStorage";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import { useUnifiedLanguageChange } from "../../hooks/useUnifiedLanguageChange";
import {
  Typography,
  useTheme,
  alpha,
  Box,
  Grid,
  IconButton,
  Link,
  Divider,
  useMediaQuery,
} from "@mui/material";

const POPULAR_CATEGORIES = [
  { code: "phones", labels: { ar: "هواتف و أجهزة لوحية", fr: "Téléphones et Tablettes", en: "Phones & Tablets" } },
  { code: "documents", labels: { ar: "وثائق و بطاقات", fr: "Documents et Cartes", en: "Documents & Cards" } },
  { code: "wallets", labels: { ar: "محافظ و حقائب", fr: "Portefeuilles et Sacs", en: "Wallets & Bags" } },
  { code: "electronics", labels: { ar: "إلكترونيات", fr: "Électronique", en: "Electronics" } },
  { code: "keys", labels: { ar: "مفاتيح", fr: "Clés", en: "Keys" } },
  { code: "person", labels: { ar: "أشخاص مفقودون", fr: "Personnes Disparues", en: "Missing Persons" } },
  { code: "jewelry", labels: { ar: "مجوهرات و ساعات", fr: "Bijoux et Montres", en: "Jewelry & Watches" } },
];

const TOP_CITIES = [
  { slug: "casablanca", labels: { ar: "الدار البيضاء", fr: "Casablanca", en: "Casablanca" } },
  { slug: "rabat", labels: { ar: "الرباط", fr: "Rabat", en: "Rabat" } },
  { slug: "marrakech", labels: { ar: "مراكش", fr: "Marrakech", en: "Marrakech" } },
  { slug: "tangier", labels: { ar: "طنجة", fr: "Tanger", en: "Tangier" } },
  { slug: "agadir", labels: { ar: "أكادير", fr: "Agadir", en: "Agadir" } },
  { slug: "fes", labels: { ar: "فاس", fr: "Fès", en: "Fes" } },
  { slug: "meknes", labels: { ar: "مكناس", fr: "Meknès", en: "Meknes" } },
  { slug: "oujda", labels: { ar: "وجدة", fr: "Oujda", en: "Oujda" } },
];

const DashFooter = ({ sx = {}, ...otherProps } = {}) => {
  const navigate = useNavigate();
  const { country } = useAuth();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { changeLanguage } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: "medium",
    enableLogging: process.env.NODE_ENV === "development",
  });

  // Resolve country ID to country name
  const getCountryIdFromLocalStorage = () => {
    try {
      const savedState = localStorage.getItem("globalState");
      if (!savedState) return null;
      const parsed = JSON.parse(savedState);
      return parsed?.currentCountry || null;
    } catch (e) {
      return null;
    }
  };
  const resolvedCountryId = country || getCountryIdFromLocalStorage();
  const { countryName, isLoading: isCountryLoading } = useCountryName(resolvedCountryId);

  const scrollToHelpSection = () => {
    const helpSection = document.querySelector('[data-section="help"]');

    if (helpSection) {
      if (isMobile) {
        const navbar = document.querySelector(".MuiAppBar-root");
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const elementRect = helpSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const scrollPosition = absoluteElementTop - navbarHeight - 20;
        const finalScrollPosition = Math.max(0, scrollPosition);

        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isRealMobile) {
          try {
            helpSection.focus();
          } catch (e) {
            // Ignore focus errors
          }

          const instantScrollToPosition = (targetPosition) => {
            try {
              window.scrollTo(0, targetPosition);
              document.documentElement.scrollTop = targetPosition;
              document.body.scrollTop = targetPosition;
              const mainContainer = document.querySelector("main");
              if (mainContainer) {
                mainContainer.scrollTop = targetPosition;
              }
              helpSection.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "nearest",
              });
            } catch (error) {
              // Ignore scroll errors
            }
          };

          instantScrollToPosition(finalScrollPosition);
        } else {
          try {
            helpSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });

            setTimeout(() => {
              const currentScroll = window.pageYOffset;
              if (Math.abs(currentScroll - finalScrollPosition) > 100) {
                const startPosition = window.pageYOffset;
                const distance = finalScrollPosition - startPosition;
                const duration = 500;
                let startTime = null;

                const animateScroll = (currentTime) => {
                  if (startTime === null) startTime = currentTime;
                  const timeElapsed = currentTime - startTime;
                  const progress = Math.min(timeElapsed / duration, 1);
                  const easeOut = 1 - Math.pow(1 - progress, 3);
                  const currentPosition = startPosition + distance * easeOut;

                  window.scrollTo(0, currentPosition);
                  document.documentElement.scrollTop = currentPosition;
                  document.body.scrollTop = currentPosition;

                  if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                  }
                };

                requestAnimationFrame(animateScroll);
              }
            }, 300);
          } catch (error) {
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
          }
        }
      } else {
        helpSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    } else {
      const helpElements = document.querySelectorAll("*");
      let foundElement = null;

      for (let element of helpElements) {
        if (element.textContent && element.textContent.includes("Help & Support")) {
          foundElement = element;
          break;
        }
      }

      if (foundElement) {
        if (isMobile) {
          const navbar = document.querySelector(".MuiAppBar-root");
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const elementRect = foundElement.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const scrollPosition = absoluteElementTop - navbarHeight - 20;
          const finalScrollPosition = Math.max(0, scrollPosition);

          try {
            window.scrollTo({
              top: finalScrollPosition,
              behavior: "smooth",
            });

            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                window.scrollTo(0, finalScrollPosition);
              }
            }, 100);

            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                document.documentElement.scrollTop = finalScrollPosition;
              }
            }, 200);
          } catch (error) {
            window.scrollTo(0, finalScrollPosition);
          }
        } else {
          foundElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }
    }
  };

  const socialLinks = [
    { icon: Facebook, name: "Facebook", href: "https://www.facebook.com/profile.php?id=100075968495897" },
    { icon: Instagram, name: "Instagram", href: "https://www.instagram.com/mafqoudat?igsh=d29saTdtajZ5dWpu" },
    { icon: WhatsApp, name: "WhatsApp", href: "https://wa.me/212711621132" },
  ];

  const languageOptions = [
    { code: "en", label: "EN" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
  ];

  // Dynamic colors derived from design tokens and mode
  const bgFooter = theme.custom?.color?.footerBackground || theme.custom?.color?.surfaceRaised || (isDark ? "#171B22" : "#FFFFFF");
  const borderFooter = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(11, 18, 32, 0.08)";
  const titleColor = isDark ? "#FFFFFF" : "#0B1220";
  const bodyTextColor = isDark ? "rgba(237, 239, 245, 0.72)" : "rgba(11, 18, 32, 0.70)";
  const mutedTextColor = isDark ? "rgba(237, 239, 245, 0.52)" : "rgba(11, 18, 32, 0.52)";

  // Reusable Link Item component with RTL-aware hover translation and typography
  const FooterLinkItem = ({ to, onClick, children }) => {
    const linkContent = (
      <Box
        component="span"
        sx={{
          fontFamily: theme.custom?.font?.body,
          fontSize: { xs: "0.875rem", sm: "0.8125rem", md: "0.875rem", "@media (min-width: 1920px)": "0.9375rem" },
          fontWeight: 500,
          lineHeight: 1.6,
          color: bodyTextColor,
          display: "inline-flex",
          alignItems: "center",
          py: 0.5,
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            color: theme.custom?.color?.brandPrimary,
            transform: isRTL ? "translateX(-4px)" : "translateX(4px)",
          },
        }}
      >
        {children}
      </Box>
    );

    if (to) {
      return (
        <Box component="li" sx={{ listStyle: "none", m: 0, p: 0 }}>
          <RouterLink to={to} style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}>
            {linkContent}
          </RouterLink>
        </Box>
      );
    }

    return (
      <Box component="li" sx={{ listStyle: "none", m: 0, p: 0 }}>
        <Box component="button" onClick={onClick} sx={{ background: "none", border: "none", p: 0, m: 0, textAlign: isRTL ? "right" : "left" }}>
          {linkContent}
        </Box>
      </Box>
    );
  };

  // Reusable Column Header component
  const ColumnHeader = ({ title }) => (
    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
      <Typography
        component="h3"
        sx={{
          fontFamily: theme.custom?.font?.display,
          fontWeight: 700,
          fontSize: { xs: "0.95rem", sm: "0.9375rem", md: "1rem", "@media (min-width: 1920px)": "1.125rem" },
          color: titleColor,
          letterSpacing: isRTL ? "0" : "0.01em",
          lineHeight: 1.3,
          m: 0,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          width: "22px",
          height: "2.5px",
          borderRadius: "1.5px",
          backgroundColor: theme.custom?.color?.brandPrimary,
          mt: 0.75,
          opacity: 0.85,
        }}
      />
    </Box>
  );

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        backgroundColor: bgFooter,
        position: "relative",
        borderTop: `1px solid ${borderFooter}`,
        direction: isRTL ? "rtl" : "ltr",
        textAlign: isRTL ? "right" : "left",
        padding: {
          xs: "3.5rem 1.25rem 2rem",
          sm: "4rem 2rem 2.25rem",
          md: "4.5rem 2.5rem 2.5rem",
          "@media (min-width: 1920px)": "5.5rem 4rem 3rem",
        },
        ...sx,
      }}
      {...otherProps}
    >
      {/* Top subtle ambient highlight line */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, rgba(91, 127, 255, 0.35) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(27, 77, 255, 0.22) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <Grid
        container
        spacing={{ xs: 4, sm: 3.5, md: 4, "@media (min-width: 1920px)": 6 }}
        sx={{
          maxWidth: { xs: "100%", sm: "600px", md: "960px", lg: "1280px", xl: "1440px", xxl: "1720px" },
          margin: "0 auto",
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* Column 1: Brand Info */}
        <Grid item xs={12} md={3.2} lg={3}>
          <Box sx={{ mb: 2 }}>
            <Link
              component={RouterLink}
              to="/"
              underline="none"
              sx={{
                display: "inline-block",
                fontFamily: theme.custom?.font?.display,
                fontWeight: 800,
                fontSize: { xs: "1.375rem", sm: "1.25rem", md: "1.375rem", "@media (min-width: 1920px)": "1.625rem" },
                color: theme.custom?.color?.brandPrimary,
                letterSpacing: isRTL ? "0" : "-0.02em",
                lineHeight: 1.2,
                transition: "opacity 0.2s ease",
                "&:hover": { opacity: 0.9 },
              }}
            >
              {t("brandName")}
            </Link>
          </Box>

          <Typography
            sx={{
              fontFamily: theme.custom?.font?.body,
              fontSize: { xs: "0.875rem", sm: "0.8125rem", md: "0.84rem", "@media (min-width: 1920px)": "0.9375rem" },
              color: bodyTextColor,
              lineHeight: 1.65,
              mb: 3,
              maxWidth: { xs: "100%", md: "290px" },
            }}
          >
            {t("footerDescription")}
          </Typography>

          {/* Social Links */}
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              justifyContent: isRTL ? "flex-start" : "flex-start",
            }}
          >
            {socialLinks.map(({ icon: SocialIcon, name, href }) => (
              <IconButton
                key={href}
                component="a"
                href={href}
                aria-label={name}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: { xs: 38, sm: 36, "@media (min-width: 1920px)": 44 },
                  height: { xs: 38, sm: 36, "@media (min-width: 1920px)": 44 },
                  borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(11, 18, 32, 0.04)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(11, 18, 32, 0.08)"}`,
                  color: isDark ? "rgba(237, 239, 245, 0.85)" : "rgba(11, 18, 32, 0.8)",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  "& .MuiSvgIcon-root": {
                    fontSize: { xs: "20px", "@media (min-width: 1920px)": "24px" },
                  },
                  "&:hover": {
                    transform: "translateY(-2px)",
                    backgroundColor: isDark ? "rgba(91, 127, 255, 0.18)" : "rgba(27, 77, 255, 0.1)",
                    borderColor: isDark ? "rgba(91, 127, 255, 0.35)" : "rgba(27, 77, 255, 0.25)",
                    color: theme.custom?.color?.brandPrimary,
                    boxShadow: isDark
                      ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                      : "0 4px 12px rgba(27, 77, 255, 0.15)",
                  },
                }}
              >
                <SocialIcon />
              </IconButton>
            ))}
          </Box>
        </Grid>

        {/* Column 2: Popular Categories */}
        <Grid item xs={6} sm={4} md={2}>
          <ColumnHeader title={t("popularCategories")} />
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {POPULAR_CATEGORIES.map((cat) => (
              <FooterLinkItem key={cat.code} to={`/posts?category=${cat.code}`}>
                {cat.labels[currentLanguage] || cat.labels.en || cat.code}
              </FooterLinkItem>
            ))}
          </Box>
        </Grid>

        {/* Column 3: Top Cities */}
        <Grid item xs={6} sm={4} md={2}>
          <ColumnHeader title={t("topCities")} />
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {TOP_CITIES.map((city) => (
              <FooterLinkItem key={city.slug} to={`/posts?city=${city.slug}`}>
                {city.labels[currentLanguage] || city.labels.en || city.slug}
              </FooterLinkItem>
            ))}
          </Box>
        </Grid>

        {/* Column 4: Quick Links (responsively 2-columns on xs mobile for balance) */}
        <Grid item xs={12} sm={4} md={2}>
          <ColumnHeader title={t("quickLinks")} />
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "1fr" },
              columnGap: { xs: 2, sm: 0 },
            }}
          >
            <FooterLinkItem to="/posts/new?type=lost">{t("reportLostItem")}</FooterLinkItem>
            <FooterLinkItem to="/posts/new?type=found">{t("reportFoundItem")}</FooterLinkItem>
            <FooterLinkItem to="/posts">{t("searchItems")}</FooterLinkItem>
            <FooterLinkItem onClick={scrollToHelpSection}>{t("getHelp")}</FooterLinkItem>
            <FooterLinkItem to="/about">{t("aboutUs")}</FooterLinkItem>
            <FooterLinkItem to="/blog">{t("blog")}</FooterLinkItem>
            <FooterLinkItem to="/help">{t("helpCenter")}</FooterLinkItem>
            <FooterLinkItem to="/contact">{t("contactUs")}</FooterLinkItem>
          </Box>
        </Grid>

        {/* Column 5: Contact Info */}
        <Grid item xs={12} sm={12} md={2.8} lg={3}>
          <ColumnHeader title={t("contactUs")} />
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.75 }}>
            {/* Email link */}
            <Box component="li" sx={{ listStyle: "none", m: 0, p: 0 }}>
              <Box
                component="a"
                href="mailto:contact@mafqoudat.com"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  p: 0.5,
                  borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(11, 18, 32, 0.03)",
                    "& .contact-icon-box": {
                      borderColor: theme.custom?.color?.brandPrimary,
                      backgroundColor: isDark ? "rgba(91, 127, 255, 0.2)" : "rgba(27, 77, 255, 0.12)",
                    },
                  },
                }}
              >
                <Box
                  className="contact-icon-box"
                  sx={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                    backgroundColor: isDark ? "rgba(91, 127, 255, 0.12)" : "rgba(27, 77, 255, 0.08)",
                    border: `1px solid ${isDark ? "rgba(91, 127, 255, 0.22)" : "rgba(27, 77, 255, 0.14)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginInlineEnd: "12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Email sx={{ color: theme.custom?.color?.brandPrimary, fontSize: "18px" }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    component="span"
                    dir="ltr"
                    sx={{
                      display: "block",
                      fontFamily: theme.custom?.font?.body,
                      fontSize: { xs: "0.875rem", sm: "0.8125rem", md: "0.84rem" },
                      fontWeight: 600,
                      color: titleColor,
                      lineHeight: 1.4,
                      unicodeBidi: "embed",
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    contact@mafqoudat.com
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: theme.custom?.font?.body,
                      fontSize: "0.75rem",
                      color: mutedTextColor,
                      lineHeight: 1.3,
                    }}
                  >
                    {t("emailUsForSupport")}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Phone link */}
            <Box component="li" sx={{ listStyle: "none", m: 0, p: 0 }}>
              <Box
                component="a"
                href="tel:+212711621132"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  p: 0.5,
                  borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(11, 18, 32, 0.03)",
                    "& .contact-icon-box": {
                      borderColor: theme.custom?.color?.brandPrimary,
                      backgroundColor: isDark ? "rgba(91, 127, 255, 0.2)" : "rgba(27, 77, 255, 0.12)",
                    },
                  },
                }}
              >
                <Box
                  className="contact-icon-box"
                  sx={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                    backgroundColor: isDark ? "rgba(91, 127, 255, 0.12)" : "rgba(27, 77, 255, 0.08)",
                    border: `1px solid ${isDark ? "rgba(91, 127, 255, 0.22)" : "rgba(27, 77, 255, 0.14)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginInlineEnd: "12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Phone sx={{ color: theme.custom?.color?.brandPrimary, fontSize: "18px" }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    component="span"
                    dir="ltr"
                    sx={{
                      display: "block",
                      fontFamily: theme.custom?.font?.body,
                      fontSize: { xs: "0.875rem", sm: "0.8125rem", md: "0.84rem" },
                      fontWeight: 600,
                      color: titleColor,
                      lineHeight: 1.4,
                      unicodeBidi: "embed",
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    +212 711 621 132
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: theme.custom?.font?.body,
                      fontSize: "0.75rem",
                      color: mutedTextColor,
                      lineHeight: 1.3,
                    }}
                  >
                    {t("callUsForAssistance")}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Location display */}
            <Box component="li" sx={{ listStyle: "none", m: 0, p: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                    backgroundColor: isDark ? "rgba(91, 127, 255, 0.12)" : "rgba(27, 77, 255, 0.08)",
                    border: `1px solid ${isDark ? "rgba(91, 127, 255, 0.22)" : "rgba(27, 77, 255, 0.14)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginInlineEnd: "12px",
                  }}
                >
                  <LocationOn sx={{ color: theme.custom?.color?.brandPrimary, fontSize: "18px" }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: theme.custom?.font?.body,
                      fontSize: { xs: "0.875rem", sm: "0.8125rem", md: "0.84rem" },
                      fontWeight: 600,
                      color: titleColor,
                      lineHeight: 1.4,
                    }}
                  >
                    {isCountryLoading ? t("loadingCountries") : countryName || t("yourLocation")}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: theme.custom?.font?.body,
                      fontSize: "0.75rem",
                      color: mutedTextColor,
                      lineHeight: 1.3,
                    }}
                  >
                    {t("currentRegion")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Elegant Bottom Section Separator */}
      <Divider
        sx={{
          my: { xs: 3.5, sm: 4, "@media (min-width: 1920px)": 5 },
          borderColor: borderFooter,
          maxWidth: { xs: "100%", sm: "600px", md: "960px", lg: "1280px", xl: "1440px", xxl: "1720px" },
          mx: "auto",
        }}
      />

      {/* Bottom Bar: Copyright, Language Switcher, and Legal Navigation */}
      <Grid
        container
        spacing={{ xs: 2.5, md: 3 }}
        sx={{
          maxWidth: { xs: "100%", sm: "600px", md: "960px", lg: "1280px", xl: "1440px", xxl: "1720px" },
          margin: "0 auto",
          px: { xs: 1, sm: 2, md: 3 },
          alignItems: "center",
        }}
      >
        {/* Copyright */}
        <Grid item xs={12} md={4} sx={{ textAlign: { xs: "center", md: isRTL ? "right" : "left" } }}>
          <Typography
            sx={{
              fontFamily: theme.custom?.font?.body,
              fontSize: { xs: "0.8125rem", sm: "0.8125rem", "@media (min-width: 1920px)": "0.875rem" },
              color: mutedTextColor,
              lineHeight: 1.5,
            }}
          >
            © {new Date().getFullYear()} {t("brandName")}. {t("allRightsReserved")}.
          </Typography>
        </Grid>

        {/* Compact Segmented Language Selector */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                p: "3px",
                borderRadius: `${theme.custom?.radius?.sm || 8}px`,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(11, 18, 32, 0.04)",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(11, 18, 32, 0.07)"}`,
                gap: 0.5,
              }}
            >
              {languageOptions.map((option) => {
                const isActive = currentLanguage === option.code;
                return (
                  <Box
                    key={option.code}
                    component="button"
                    onClick={() => changeLanguage(option.code)}
                    sx={{
                      background: isActive
                        ? isDark
                          ? "rgba(91, 127, 255, 0.22)"
                          : "rgba(27, 77, 255, 0.12)"
                        : "transparent",
                      border: isActive
                        ? `1px solid ${isDark ? "rgba(91, 127, 255, 0.35)" : "rgba(27, 77, 255, 0.22)"}`
                        : "1px solid transparent",
                      cursor: "pointer",
                      px: 1.25,
                      py: 0.35,
                      borderRadius: "6px",
                      fontSize: { xs: "0.8125rem", sm: "0.78rem" },
                      fontFamily: theme.custom?.font?.body,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? theme.custom?.color?.brandPrimary : mutedTextColor,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: isActive ? theme.custom?.color?.brandPrimary : titleColor,
                      },
                    }}
                  >
                    {option.label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Grid>

        {/* Legal Policy Links */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", md: isRTL ? "flex-start" : "flex-end" },
              gap: { xs: 2, sm: 2.25 },
              flexWrap: "wrap",
            }}
          >
            {[
              { to: "/privacy", label: t("privacyPolicy") },
              { to: "/terms", label: t("termsOfUse") },
              { to: "/cookies", label: t("cookieNotice") },
              { to: "/disclaimer", label: t("disclaimer") },
            ].map(({ to, label }) => (
              <Link
                key={to}
                component={RouterLink}
                to={to}
                underline="none"
                sx={{
                  fontFamily: theme.custom?.font?.body,
                  fontSize: { xs: "0.8125rem", sm: "0.8125rem", "@media (min-width: 1920px)": "0.875rem" },
                  color: mutedTextColor,
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.custom?.color?.brandPrimary,
                  },
                }}
              >
                {label}
              </Link>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashFooter;
