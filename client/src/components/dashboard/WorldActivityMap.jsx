import { useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { PublicOutlined } from "@mui/icons-material";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoMercator, geoPath, geoBounds } from "d3-geo";
import { useTranslation } from "../../utils/translations";
import { TrendingItemSkeleton } from "../LoadingStates";

// Sits inline with LeftSide (same flex row, height-matched via fillHeight),
// zoomed to the selected country rather than the whole world.
//
// Real, free, no-API-key map data: world-atlas's countries-50m topojson
// (Natural Earth, public domain) — no tile server, no key, no network call
// at runtime (bundled + dynamically imported so it's code-split rather than
// bloating the main bundle). 50m resolution specifically because the 110m
// file drops small territories, and two of this platform's 25 countries
// (Bahrain, Comoros) are small enough to disappear at 110m.
//
// Deliberately NOT mirrored for RTL: an actual world map has to stay
// geographically accurate regardless of reading direction — real maps on
// Arabic sites are never horizontally flipped. Only the surrounding chrome
// (title, legend, info strip) follows the usual RTL/logical-property rules.
//
// Zoom math note: react-simple-maps' projectionConfig only forwards
// center/scale/rotate/parallels to the underlying d3 projection — it always
// hardcodes translate to the canvas center (see its makeProjection()), so
// d3's usual fitExtent() (which computes scale AND a possibly-off-center
// translate) can't be used directly; passing fitExtent's translate is
// silently ignored, which very nearly shipped a broken zoom. Instead:
// center on the country's bounding-box midpoint (not its true centroid —
// those differ for an irregular shape, and only the bbox midpoint lands the
// bbox itself in the middle of a fixed-translate canvas), then solve for
// the scale that fits that bbox into the padded target area by measuring
// the projected bounds at a reference scale of 1 and dividing.

// ISO 3166-1 alpha-2 -> UN M49 numeric code, for exactly the 25 countries
// this platform actually serves (verified against the app's /countries
// endpoint) — small enough to hand-maintain rather than pulling in a full
// ISO country-code package for a 25-row lookup.
const ISO2_TO_NUMERIC = {
  AE: "784", BH: "048", CF: "140", TD: "148", KM: "174", DZ: "012",
  DJ: "262", EG: "818", IQ: "368", JO: "400", KW: "414", LB: "422",
  LY: "434", MA: "504", ML: "466", MR: "478", NE: "562", OM: "512",
  PS: "275", QA: "634", SA: "682", SO: "706", SD: "729", SY: "760",
  TN: "788",
};

const WorldActivityMap = ({ worldActivity, cityActivity, currentCountryCode, countriesByCode, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";
  const [geoFeatures, setGeoFeatures] = useState(null);
  const [hoveredNumericId, setHoveredNumericId] = useState(null);
  const [hoveredCityIndex, setHoveredCityIndex] = useState(null);

  const ink = theme.custom.color.ink;
  const panel = theme.custom.color.surfaceRaised;
  const brand = theme.custom.color.brandPrimary;
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("world-atlas/countries-50m.json"), import("topojson-client")]).then(
      ([topoModule, topojsonClient]) => {
        if (cancelled) return;
        const topo = topoModule.default;
        const { features } = topojsonClient.feature(topo, topo.objects.countries);
        setGeoFeatures(features);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Activity keyed by numeric id (what the topojson shapes use), carrying
  // the raw ISO2 code along so we can look up the localized country name.
  const activityByNumericId = useMemo(() => {
    const map = new Map();
    (worldActivity || []).forEach(({ code, count }) => {
      const numericId = ISO2_TO_NUMERIC[code];
      if (numericId) map.set(numericId, { code, count });
    });
    return map;
  }, [worldActivity]);

  const maxCount = useMemo(
    () => (worldActivity || []).reduce((m, row) => Math.max(m, row.count || 0), 0) || 1,
    [worldActivity]
  );

  const cities = useMemo(() => (Array.isArray(cityActivity) ? cityActivity : []), [cityActivity]);
  const maxCityCount = useMemo(() => cities.reduce((m, c) => Math.max(m, c.count || 0), 0) || 1, [cities]);
  const CITY_MIN_RADIUS = 4;
  const CITY_MAX_RADIUS = 12;
  const cityRadius = (count) => CITY_MIN_RADIUS + (count / maxCityCount) * (CITY_MAX_RADIUS - CITY_MIN_RADIUS);

  const currentNumericId = currentCountryCode ? ISO2_TO_NUMERIC[currentCountryCode] : null;

  const currentFeature = useMemo(() => {
    if (!geoFeatures || !currentNumericId) return null;
    return geoFeatures.find((f) => f.id === currentNumericId) || null;
  }, [geoFeatures, currentNumericId]);

  // Internal coordinate system for ComposableMap — independent of the CSS
  // box it's displayed at, but should still match its aspect ratio or the
  // map letterboxes inside it instead of filling the space. Square on both
  // mobile and desktop now (matches the CSS box below on each).
  const MAP_WIDTH = 520;
  const mapHeight = 520;

  const mapView = useMemo(() => {
    if (!currentFeature) return { center: [15, 20], scale: 220 };
    const padding = 22;
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(currentFeature);
    const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    const reference = geoMercator().center(center).translate([MAP_WIDTH / 2, mapHeight / 2]).scale(1);
    const [[x0, y0], [x1, y1]] = geoPath(reference).bounds(currentFeature);
    const scale = Math.min((MAP_WIDTH - padding * 2) / Math.max(x1 - x0, 0.001), (mapHeight - padding * 2) / Math.max(y1 - y0, 0.001));
    return { center, scale };
  }, [currentFeature, MAP_WIDTH, mapHeight]);

  const countryDisplayName = (numericId, fallbackName) => {
    const entry = activityByNumericId.get(numericId);
    const localized = entry && countriesByCode ? countriesByCode[entry.code]?.names?.[currentLanguage] : null;
    return localized || countriesByCode?.[entry?.code]?.names?.en || fallbackName;
  };

  const currentCountryName =
    countriesByCode?.[currentCountryCode]?.names?.[currentLanguage] ||
    countriesByCode?.[currentCountryCode]?.names?.en ||
    currentCountryCode ||
    "";
  const citiesPostCount = cities.reduce((sum, c) => sum + (c.count || 0), 0);

  const hovered = useMemo(() => {
    // A hovered city marker takes priority over the country fill beneath it.
    if (hoveredCityIndex != null && cities[hoveredCityIndex]) {
      const city = cities[hoveredCityIndex];
      return { name: city.name, count: city.count, isCurrent: false, isCity: true };
    }
    if (!hoveredNumericId) return null;
    const entry = activityByNumericId.get(hoveredNumericId);
    return {
      name: countryDisplayName(hoveredNumericId, hoveredNumericId),
      count: entry?.count || 0,
      isCurrent: hoveredNumericId === currentNumericId,
      isCity: false,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCityIndex, cities, hoveredNumericId, activityByNumericId, currentNumericId, currentLanguage]);

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TrendingItemSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flex: 1,
          minHeight: isMobile ? undefined : 320,
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${alpha(panel, 0.95)} 0%, ${alpha(panel, 0.95)} 100%)`,
          backdropFilter: "blur(10px)",
          borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
          border: `1px solid ${alpha(ink, isDark ? 0.08 : 0.15)}`,
          boxShadow: theme.custom.elevation.e1,
          padding: isMobile ? "1.5rem" : "2rem",
        }}
      >
        {/* Title centered on its own row, mirroring LeftSide's title
            treatment, since this now sits right next to it. Sized down
            harder on mobile than the desktop title — this is a long
            sentence-style phrase (not a short label like "Statistics"), so
            at desktop sizes on a narrow screen it was taking more vertical
            room than the map itself. */}
        <Box sx={{ textAlign: "center", mb: isMobile ? 1 : 2 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <PublicOutlined sx={{ color: brand, fontSize: { xs: 18, sm: 24 } }} />
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: "0.95rem", sm: "1.4rem" }, lineHeight: 1.25, color: ink }}>
              {t("worldActivityTitle", { country: currentCountryName })}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1, sm: 2 },
            mb: isMobile ? 1 : 2,
          }}
        >
          <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, fontWeight: 600, color: alpha(ink, 0.7) }}>
            {t("worldActivityCountries", { posts: citiesPostCount, cities: cities.length })}
          </Typography>

          {/* sequential-ramp legend (fewer -> more) — dropped on mobile,
              the least essential of the three header items and the
              biggest offender for wrapping onto its own line there. */}
          {!isMobile && (
            <Box
              sx={{
                width: 48,
                height: 7,
                borderRadius: 4,
                background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${alpha(brand, 0.2)}, ${alpha(brand, 0.95)})`,
              }}
            />
          )}

          {/* current-country stroke legend */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "3px", border: `2px solid ${brand}`, backgroundColor: alpha(brand, 0.15) }} />
            <Typography sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" }, fontWeight: 600, color: alpha(ink, 0.7) }}>
              {t("worldActivityCurrent")}
            </Typography>
          </Box>
        </Box>

        {/* Desktop: flex:1 fills the row-stretched height LeftSide drives
            (see Dash.js's alignItems:'stretch' flex row). Mobile has no
            such external height to grow into — it's a single-column grid
            row there, not a stretched flex row — so it needs its own
            explicit size instead; square (1/1) rather than the previous
            4/3 specifically because 4/3 was reading as noticeably short
            once the header above it got more compact. */}
        <Box
          sx={{
            width: "100%",
            flex: isMobile ? undefined : 1,
            minHeight: isMobile ? 300 : 0,
            aspectRatio: isMobile ? "1 / 1" : undefined,
          }}
        >
          {geoFeatures ? (
          <ComposableMap
            width={MAP_WIDTH}
            height={mapHeight}
            projection="geoMercator"
            projectionConfig={{ center: mapView.center, scale: mapView.scale }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={geoFeatures}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const entry = activityByNumericId.get(geo.id);
                  const isCurrent = geo.id === currentNumericId;
                  const baseFill = entry
                    ? alpha(brand, 0.22 + (entry.count / maxCount) * 0.68)
                    : alpha(ink, isDark ? 0.14 : 0.08);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredNumericId(geo.id)}
                      onMouseLeave={() => setHoveredNumericId((prev) => (prev === geo.id ? null : prev))}
                      style={{
                        default: {
                          fill: baseFill,
                          stroke: isCurrent ? brand : alpha(panel, isDark ? 0.4 : 0.8),
                          strokeWidth: isCurrent ? 1.6 : 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: entry ? alpha(brand, 0.9) : alpha(ink, isDark ? 0.22 : 0.16),
                          stroke: isCurrent ? brand : alpha(panel, isDark ? 0.4 : 0.8),
                          strokeWidth: isCurrent ? 1.6 : 0.5,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* City markers — proportional-symbol dots (radius scaled by
                post count) layered on top of the country fill. Panel-filled
                with a brand stroke so they read as solid pins regardless of
                the fill tone beneath them; labels get a panel-colored text
                outline (paintOrder="stroke") for the same reason, rather
                than a background pill shape. */}
            {cities.map((city, index) => (
              <Marker key={`${city.name}-${index}`} coordinates={[city.lon, city.lat]}>
                <circle
                  r={cityRadius(city.count)}
                  fill={panel}
                  stroke={brand}
                  strokeWidth={2}
                  onMouseEnter={() => setHoveredCityIndex(index)}
                  onMouseLeave={() => setHoveredCityIndex((prev) => (prev === index ? null : prev))}
                  style={{ cursor: "pointer" }}
                />
                <text
                  y={cityRadius(city.count) + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={ink}
                  stroke={panel}
                  strokeWidth={3}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {city.name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
        ) : (
          <Box sx={{ width: "100%", height: "100%", borderRadius: `${theme.custom.radius.md}px`, backgroundColor: alpha(ink, 0.05) }} />
        )}
      </Box>

      {/* hover info strip, instead of a floating tooltip that would need
          its own RTL-aware position math on top of the map's own. */}
      <Box sx={{ mt: 1.5, minHeight: 24, textAlign: isRTL ? "right" : "left" }}>
        {hovered && (
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: ink }}>
            {hovered.name}
            {hovered.isCurrent && (
              <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 600, color: brand, mx: 1 }}>
                · {t("worldActivityCurrent")}
              </Typography>
            )}
            <Typography component="span" sx={{ fontSize: "0.85rem", fontWeight: 500, color: alpha(ink, 0.65), mx: 1 }}>
              {hovered.count > 0 ? t("worldActivityPosts", { count: hovered.count }) : t("worldActivityNoPosts")}
            </Typography>
          </Typography>
        )}
        </Box>
      </Box>
    </Box>
  );
};

export default WorldActivityMap;
