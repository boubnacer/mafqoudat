import { useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoMercator, geoPath, geoBounds } from "d3-geo";
import { useTranslation } from "../../utils/translations";
import { TrendingItemSkeleton } from "../LoadingStates";

// Desktop: a single chrome-less, full-bleed map filling the whole header
// section behind BOTH LeftSide and this component's own title — not a
// second map, the same instance just zoomed out and given the full section
// to render into instead of its own half-width card. LeftSide's own card
// goes translucent (see LeftSide.jsx) so it reads as a glass panel floating
// over the same map rather than a separate boxed section next to it.
//
// Mobile keeps the previous boxed-card treatment unchanged: LeftSide and
// this map stack vertically there (a CSS Grid single column, not the
// side-by-side flex row), so "two halves sharing one backdrop" doesn't
// really apply — there's only one column, not two to unify.
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
// (title, legend) follows the usual RTL/logical-property rules.
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
// the projected bounds at a reference scale of 1 and dividing. Same
// constraint is why the country can't be pinned to one side of the wide
// desktop canvas the way "same place" might suggest — translate always
// lands it dead-center of whatever canvas size we give the map, so a wider
// canvas with more padding just reads as "more of the world around it,"
// not "shifted to the right."
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

  // Mobile: square card, tightly zoomed (unchanged from before). Desktop:
  // wide canvas matching the full header's rough proportions, zoomed out a
  // lot further so the surrounding world reads as a backdrop, not a crop.
  const MAP_WIDTH = isMobile ? 520 : 1100;
  const mapHeight = isMobile ? 520 : 480;

  const mapView = useMemo(() => {
    if (!currentFeature) return { center: [15, 20], scale: 220 };
    const padding = isMobile ? 8 : 70;
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(currentFeature);
    const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    const reference = geoMercator().center(center).translate([MAP_WIDTH / 2, mapHeight / 2]).scale(1);
    const [[x0, y0], [x1, y1]] = geoPath(reference).bounds(currentFeature);
    const scale = Math.min((MAP_WIDTH - padding * 2) / Math.max(x1 - x0, 0.001), (mapHeight - padding * 2) / Math.max(y1 - y0, 0.001));
    return { center, scale };
  }, [currentFeature, MAP_WIDTH, mapHeight, isMobile]);

  const currentCountryName =
    countriesByCode?.[currentCountryCode]?.names?.[currentLanguage] ||
    countriesByCode?.[currentCountryCode]?.names?.en ||
    currentCountryCode ||
    "";

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TrendingItemSkeleton />
      </Box>
    );
  }

  const mapNode = geoFeatures ? (
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

      {/* City markers — proportional-symbol dots (radius scaled by post
          count) layered on top of the country fill. Panel-filled with a
          brand stroke so they read as solid pins regardless of the fill
          tone beneath them; labels get a panel-colored text outline
          (paintOrder="stroke") for the same reason, rather than a
          background pill shape. */}
      {cities.map((city, index) => (
        <Marker key={`${city.name}-${index}`} coordinates={[city.lon, city.lat]}>
          <circle r={cityRadius(city.count)} fill={panel} stroke={brand} strokeWidth={2} />
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
    <Box sx={{ width: "100%", height: "100%", backgroundColor: alpha(ink, 0.05) }} />
  );

  const titleNode = (
    <Typography sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" }, fontWeight: 700, color: ink, textAlign: "center" }}>
      {t("worldActivityCountries", { country: currentCountryName })}
    </Typography>
  );

  const legendSwatch = (
    <Box
      sx={{
        width: 48,
        height: 7,
        borderRadius: 4,
        background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${alpha(brand, 0.2)}, ${alpha(brand, 0.95)})`,
      }}
    />
  );

  if (isMobile) {
    // Unchanged boxed-card treatment.
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(135deg, ${alpha(panel, 0.95)} 0%, ${alpha(panel, 0.95)} 100%)`,
            backdropFilter: "blur(10px)",
            borderRadius: `${theme.custom.radius.lg}px`,
            border: `1px solid ${alpha(ink, isDark ? 0.08 : 0.15)}`,
            boxShadow: theme.custom.elevation.e1,
            padding: "1.5rem",
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 1.25, mb: 2 }}>
            {titleNode}
          </Box>
          <Box sx={{ width: "100%", minHeight: 300, aspectRatio: "1 / 1" }}>{mapNode}</Box>
        </Box>
      </Box>
    );
  }

  // Desktop: chrome-less full-bleed map. Dash.js renders this absolutely
  // positioned to fill the whole header section (behind LeftSide too), so
  // here it just needs to fill 100% of whatever box it's given. Title sits
  // as an overlay near the top, offset toward the side LeftSide *isn't* on
  // (LeftSide is always the first flex child, so under the header's
  // direction-aware flex row it sits at the logical start — this puts the
  // title at the logical end, mirroring where it visually sat back when
  // this was its own half-width card).
  //
  // Pan/crop for "same place as before": react-simple-maps always renders
  // the projection centered on its own canvas (translate can't be
  // customized — see the note above), so the chosen country would otherwise
  // land dead-center of the full header and get hidden behind LeftSide.
  // To put it back where the old half-width map card used to show it
  // (~75% across from the logical start, i.e. 25% in from the end), the
  // map is rendered at 165% of the container's width and shifted via
  // insetInlineStart so ITS center — always where the country renders —
  // lands at that 75% mark; Dash.js's header container clips the overflow.
  // The CSS width stretch (100% of an already-165%-wide box) scales the SVG
  // non-uniformly the same way it always did pre-crop (viewBox aspect ratio
  // never matched the container's), so the zoom/padding math above is
  // untouched by this — it still targets the same on-canvas fit as before.
  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: "-7.5%", width: "165%" }}>{mapNode}</Box>
      <Box
        sx={{
          position: "absolute",
          top: 24,
          insetInlineEnd: 32,
          insetInlineStart: "52%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {titleNode}
        {legendSwatch}
      </Box>
    </Box>
  );
};

export default WorldActivityMap;
