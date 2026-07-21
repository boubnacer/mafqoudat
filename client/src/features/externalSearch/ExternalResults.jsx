import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { TravelExplore } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { trackEvent } from "../../utils/analytics";
import { useLazySearchExternalQuery } from "./externalSearchApiSlice";

const ExternalResults = ({ query, countryCode, language, localResultCount }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [hasSearched, setHasSearched] = useState(false);
  const [triggerSearch, { data, isFetching, isError }] = useLazySearchExternalQuery();

  // A change in search context invalidates whatever we last fetched — fall
  // back to the CTA rather than showing results for a different query.
  useEffect(() => {
    setHasSearched(false);
  }, [query, countryCode, language]);

  if (!query || query.trim().length < 2) return null;
  if ((localResultCount ?? 0) >= 3) return null;

  const handleSearchClick = () => {
    setHasSearched(true);
    trackEvent('external_search_triggered', {
      query,
      country_code: countryCode,
      language,
    });
    triggerSearch({ q: query, countryCode, language, limit: 6 });
  };

  const results = (data?.results || []).slice(0, 6);
  const degraded = Boolean(data?.degraded) || (hasSearched && isError);

  return (
    <Card
      sx={{
        mt: 3,
        backgroundColor: theme.custom.color.surfaceRaised,
        borderRadius: `${theme.custom.radius.lg}px`,
        boxShadow: theme.custom.elevation.e1,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TravelExplore sx={{ color: theme.custom.color.brandPrimary }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
            {t('externalSearch.title')}
          </Typography>
        </Box>

        {!hasSearched && (
          <Button
            variant="contained"
            onClick={handleSearchClick}
            sx={{
              borderRadius: `${theme.custom.radius.md}px`,
              bgcolor: theme.custom.color.brandPrimary,
              '&:hover': { bgcolor: theme.custom.color.brandPrimary, opacity: 0.9 },
            }}
          >
            {t('externalSearch.cta')}
          </Button>
        )}

        {hasSearched && isFetching && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
            <CircularProgress size={20} sx={{ color: theme.custom.color.brandPrimary }} />
            <Typography variant="body2" color="text.secondary">
              {t('externalSearch.searching')}
            </Typography>
          </Box>
        )}

        {hasSearched && !isFetching && degraded && (
          <Typography variant="body2" color="text.secondary">
            {t('externalSearch.degraded')}
          </Typography>
        )}

        {hasSearched && !isFetching && !degraded && results.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('externalSearch.noResults')}
          </Typography>
        )}

        {hasSearched && !isFetching && !degraded && results.length > 0 && (
          <>
            <List sx={{ py: 0 }}>
              {results.map((result, index) => (
                <ListItem
                  key={`${result.link}-${index}`}
                  component="a"
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={t('externalSearch.viewSource', { source: result.source })}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    mb: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    textDecoration: "none",
                    color: "inherit",
                    alignItems: "flex-start",
                    gap: 1,
                    "&:hover": {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.06),
                    },
                  }}
                >
                  <ListItemText
                    primary={result.title}
                    secondary={result.snippet}
                    primaryTypographyProps={{
                      dir: "auto",
                      noWrap: true,
                      sx: { fontWeight: 600 },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      },
                    }}
                  />
                  <Chip
                    label={result.source}
                    size="small"
                    sx={{ flexShrink: 0, mt: 0.5 }}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {t('externalSearch.disclaimer')}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExternalResults;
