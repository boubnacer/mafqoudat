import { useNavigate } from "react-router-dom";
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";

const DashFooter = () => {
  const navigate = useNavigate();
  const { country } = useAuth();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
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
        // Mobile-specific scrolling with manual calculation
        const navbar = document.querySelector(".MuiAppBar-root");
        const navbarHeight = navbar ? navbar.offsetHeight : 0;

        // Get the element's position relative to the document
        const elementRect = helpSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;

        // Calculate scroll position accounting for navbar
        const scrollPosition = absoluteElementTop - navbarHeight - 20;

        // Use multiple scrolling methods for mobile compatibility
        const finalScrollPosition = Math.max(0, scrollPosition);

        // Real mobile device detection
        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isRealMobile) {
          // Method 1: Try to focus the element first (sometimes helps with mobile scrolling)
          try {
            helpSection.focus();
          } catch (e) {
            // Ignore focus errors
          }

          // Method 2: Simple instant scroll for real mobile devices
          const instantScrollToPosition = (targetPosition) => {
            // Try multiple scroll methods for maximum compatibility
            try {
              // Method 1: Direct window scroll
              window.scrollTo(0, targetPosition);

              // Method 2: Direct DOM manipulation
              document.documentElement.scrollTop = targetPosition;
              document.body.scrollTop = targetPosition;

              // Method 3: Force scroll on main container
              const mainContainer = document.querySelector("main");
              if (mainContainer) {
                mainContainer.scrollTop = targetPosition;
              }

              // Method 4: Use scrollIntoView with instant behavior
              helpSection.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "nearest",
              });
            } catch (error) {
              // Ignore scroll errors
            }
          };

          // Use instant scrolling
          instantScrollToPosition(finalScrollPosition);
        } else {
          // Desktop/emulator approach
          try {
            helpSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });

            // Check if it worked after a delay
            setTimeout(() => {
              const currentScroll = window.pageYOffset;

              if (Math.abs(currentScroll - finalScrollPosition) > 100) {
                // Method 2: Manual scroll with animation
                const startPosition = window.pageYOffset;
                const distance = finalScrollPosition - startPosition;
                const duration = 500; // 500ms animation
                let startTime = null;

                const animateScroll = (currentTime) => {
                  if (startTime === null) startTime = currentTime;
                  const timeElapsed = currentTime - startTime;
                  const progress = Math.min(timeElapsed / duration, 1);

                  // Easing function (ease-out)
                  const easeOut = 1 - Math.pow(1 - progress, 3);
                  const currentPosition = startPosition + distance * easeOut;

                  // Try multiple scroll methods
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
            // Final fallback - force scroll
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
          }
        }
      } else {
        // Desktop scrolling
        helpSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    } else {
      // Fallback: try to find the help section by text content
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

          // Use the same multiple-method approach for fallback
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
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100075968495897" },
    { icon: Instagram, href: "https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu" },
    { icon: WhatsApp, href: "https://wa.me/212711621132" },
  ];

  const languageOptions = [
    { code: "en", label: "EN" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.custom.color.surfaceRaised,
        padding: { xs: "4rem 2rem 1.5rem", "@media (min-width: 1920px)": "5rem 3rem 2rem" },
        position: "relative",
        borderTop: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
      }}
    >
      <Grid
        container
        spacing={{ xs: 4, "@media (min-width: 1920px)": 6 }}
        sx={{
          maxWidth: { xs: "100%", sm: "600px", md: "900px", lg: "1200px", xl: "1536px", xxl: "1800px" },
          margin: "0 auto",
          px: { xs: 2, sm: 3, "@media (min-width: 1920px)": 4 },
        }}
      >
        {/* Company Info */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: "bold",
              fontFamily: theme.custom.font.display,
              fontSize: { xs: "20px", sm: "18px" },
              "@media (min-width: 1920px)": { fontSize: "24px" },
              color: theme.custom.color.brandPrimary,
            }}
          >
            {t("brandName")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } }}
          >
            {t("footerDescription")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {socialLinks.map(({ icon: SocialIcon, href }) => (
              <IconButton
                key={href}
                component={Link}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: theme.custom.color.ink,
                  backgroundColor: alpha(theme.custom.color.ink, 0.04),
                  borderRadius: `${theme.custom.radius.sm}px`,
                  "& .MuiSvgIcon-root": {
                    fontSize: { xs: "22px", "@media (min-width: 1920px)": "28px" },
                  },
                  "&:hover": {
                    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
                    color: theme.custom.color.brandPrimary,
                  },
                }}
              >
                <SocialIcon />
              </IconButton>
            ))}
          </Box>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: "bold", fontSize: { xs: "18px", sm: "16px" }, "@media (min-width: 1920px)": { fontSize: "22px" } }}
          >
            {t("quickLinks")}
          </Typography>
          <List dense>
            <ListItem
              button
              onClick={() => {
                if (!token) {
                  const intendedDestination = "/dash/posts/new?type=lost";
                  authStorage.setRedirectAfterLoginWithMessage(intendedDestination, "loginRequiredCreatePost");
                  navigate("/login");
                } else {
                  navigate("/dash/posts/new?type=lost");
                }
              }}
            >
              <ListItemText
                primary={t("reportLostItem")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                if (!token) {
                  const intendedDestination = "/dash/posts/new?type=found";
                  authStorage.setRedirectAfterLoginWithMessage(intendedDestination, "loginRequiredCreatePost");
                  navigate("/login");
                } else {
                  navigate("/dash/posts/new?type=found");
                }
              }}
            >
              <ListItemText
                primary={t("reportFoundItem")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/dash/posts")}>
              <ListItemText
                primary={t("searchItems")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={scrollToHelpSection}>
              <ListItemText
                primary={t("getHelp")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/about")}>
              <ListItemText
                primary={t("aboutUs")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/blog")}>
              <ListItemText
                primary={t("blog")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/help")}>
              <ListItemText
                primary={t("helpCenter")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/contact")}>
              <ListItemText
                primary={t("contactUs")}
                sx={{ "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } } }}
              />
            </ListItem>
          </List>
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: "bold", fontSize: { xs: "18px", sm: "16px" }, "@media (min-width: 1920px)": { fontSize: "22px" } }}
          >
            {t("contactUs")}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Email sx={{ color: theme.custom.color.brandPrimary, fontSize: { xs: "22px", "@media (min-width: 1920px)": "28px" } }} />
              </ListItemIcon>
              <ListItemText
                primary="team.mafqoudat@gmail.com"
                secondary={t("emailUsForSupport")}
                sx={{
                  "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } },
                  "& .MuiListItemText-secondary": { fontSize: { xs: "14px", sm: "12px" }, "@media (min-width: 1920px)": { fontSize: "16px" } },
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone sx={{ color: theme.custom.color.brandPrimary, fontSize: { xs: "22px", "@media (min-width: 1920px)": "28px" } }} />
              </ListItemIcon>
              <ListItemText
                primary={<span className="phone-number">+212 711 621 132</span>}
                secondary={t("callUsForAssistance")}
                sx={{
                  "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } },
                  "& .MuiListItemText-secondary": { fontSize: { xs: "14px", sm: "12px" }, "@media (min-width: 1920px)": { fontSize: "16px" } },
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocationOn sx={{ color: theme.custom.color.brandPrimary, fontSize: { xs: "22px", "@media (min-width: 1920px)": "28px" } }} />
              </ListItemIcon>
              <ListItemText
                primary={isCountryLoading ? t("loadingCountries") : countryName || t("yourLocation")}
                secondary={t("currentRegion")}
                sx={{
                  "& .MuiListItemText-primary": { fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } },
                  "& .MuiListItemText-secondary": { fontSize: { xs: "14px", sm: "12px" }, "@media (min-width: 1920px)": { fontSize: "16px" } },
                }}
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Divider sx={{ my: { xs: 3, "@media (min-width: 1920px)": 4 }, borderColor: alpha(theme.custom.color.ink, 0.08) }} />

      {/* Bottom Section */}
      <Grid
        container
        spacing={{ xs: 2, "@media (min-width: 1920px)": 3 }}
        sx={{
          maxWidth: { xs: "100%", sm: "600px", md: "900px", lg: "1200px", xl: "1536px", xxl: "1800px" },
          margin: "0 auto",
          px: { xs: 2, sm: 3, "@media (min-width: 1920px)": 4 },
          alignItems: "center",
        }}
      >
        <Grid item xs={12} md={4}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } }}
          >
            © {new Date().getFullYear()} {t("brandName")}. {t("allRightsReserved")}.
          </Typography>
        </Grid>

        {/* Compact language row — a lighter-weight duplicate of the navbar's
            region picker, reinforcing the multi-country/multilingual promise
            at the point a visitor decides whether to trust the site. */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "center" }, gap: 1.5 }}>
            {languageOptions.map((option) => (
              <Link
                key={option.code}
                component="button"
                onClick={() => changeLanguage(option.code)}
                underline="hover"
                sx={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: { xs: "15px", sm: "13px" },
                  fontWeight: currentLanguage === option.code ? 700 : 500,
                  color: currentLanguage === option.code ? theme.custom.color.brandPrimary : "text.secondary",
                }}
              >
                {option.label}
              </Link>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              gap: 2,
            }}
          >
            <Link
              component="button"
              onClick={() => navigate("/privacy")}
              color="text.secondary"
              underline="hover"
              sx={{ background: "none", border: "none", cursor: "pointer", fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } }}
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              component="button"
              onClick={() => navigate("/terms")}
              color="text.secondary"
              underline="hover"
              sx={{ background: "none", border: "none", cursor: "pointer", fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } }}
            >
              {t("termsOfUse")}
            </Link>
            <Link
              component="button"
              onClick={() => navigate("/cookies")}
              color="text.secondary"
              underline="hover"
              sx={{ background: "none", border: "none", cursor: "pointer", fontSize: { xs: "16px", sm: "14px" }, "@media (min-width: 1920px)": { fontSize: "18px" } }}
            >
              {t("cookieNotice")}
            </Link>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashFooter;
