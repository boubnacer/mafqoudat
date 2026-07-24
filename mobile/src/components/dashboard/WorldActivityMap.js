/**
 * WorldActivityMap (mobile)
 * Ports client/src/components/dashboard/WorldActivityMap.jsx to React Native:
 * a chrome-less, full-bleed SVG world map (react-native-svg) that fills the
 * header behind HomeScreen.js's Statistics panel, countries colored by
 * worldActivity ({code, count}) with the current country highlighted, and
 * city markers (proportional-symbol dots) from cityActivity. Uses the same
 * free/no-API-key data web does - world-atlas's countries-50m topojson
 * (Natural Earth, public domain), converted to GeoJSON via topojson-client,
 * projected with d3-geo (pure JS, no DOM dependency, so it runs fine here).
 *
 * Deliberately NOT mirrored for RTL, matching web: a real map has to stay
 * geographically accurate regardless of reading direction.
 *
 * Only one layout variant exists here (there's no desktop/mobile branch like
 * Dash.js's - the mobile app is always phone-shaped), so this only ports
 * web's `isMobile` crop math: the map is rendered oversized and shifted so
 * its center (where the current country renders, since react-native-svg's
 * projection always centers on its own canvas the same way d3/react-simple-maps
 * does) lands roughly where HomeScreen's reserved spacer box sits below the
 * Statistics panel, with the header's overflow:hidden clipping the rest.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { geoMercator, geoPath, geoBounds } from 'd3-geo';
import { feature as topojsonFeature } from 'topojson-client';
import countriesTopoJson from 'world-atlas/countries-50m.json';

// Same 25-country roster as the web version - ISO2 (matches Country.code) to
// the numeric id world-atlas's topojson uses for feature.id.
const ISO2_TO_NUMERIC = {
  AE: '784', BH: '048', CF: '140', TD: '148', KM: '174', DZ: '012',
  DJ: '262', EG: '818', IQ: '368', JO: '400', KW: '414', LB: '422',
  LY: '434', MA: '504', ML: '466', MR: '478', NE: '562', OM: '512',
  PS: '275', QA: '634', SA: '682', SO: '706', SD: '729', SY: '760',
  TN: '788',
};

const MAP_WIDTH = 520;
const MAP_HEIGHT = 520;
const CITY_MIN_RADIUS = 4;
const CITY_MAX_RADIUS = 12;

const hexToRgba = (hex, alpha) => {
  const clean = (hex || '#000000').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const WorldActivityMap = ({
  worldActivity,
  cityActivity,
  currentCountryCode,
  countriesByCode,
  isLoading,
  tokens,
  isDark,
  t,
  currentLanguage,
}) => {
  const [geoFeatures, setGeoFeatures] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // world-atlas + topojson-client have no DOM dependency and could run
    // synchronously, but deferring a tick keeps this off the header's first
    // paint the same way web's dynamic import does.
    const timer = setTimeout(() => {
      if (cancelled) return;
      const { features } = topojsonFeature(countriesTopoJson, countriesTopoJson.objects.countries);
      setGeoFeatures(features);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
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
  const cityRadius = (count) => CITY_MIN_RADIUS + (count / maxCityCount) * (CITY_MAX_RADIUS - CITY_MIN_RADIUS);

  const currentNumericId = currentCountryCode ? ISO2_TO_NUMERIC[currentCountryCode] : null;

  const currentFeature = useMemo(() => {
    if (!geoFeatures || !currentNumericId) return null;
    return geoFeatures.find((f) => f.id === currentNumericId) || null;
  }, [geoFeatures, currentNumericId]);

  const mapView = useMemo(() => {
    if (!currentFeature) return { center: [15, 20], scale: 220 };
    const padding = 60;
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(currentFeature);
    const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    const reference = geoMercator().center(center).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]).scale(1);
    const [[x0, y0], [x1, y1]] = geoPath(reference).bounds(currentFeature);
    const scale = Math.min(
      (MAP_WIDTH - padding * 2) / Math.max(x1 - x0, 0.001),
      (MAP_HEIGHT - padding * 2) / Math.max(y1 - y0, 0.001)
    );
    return { center, scale };
  }, [currentFeature]);

  const projection = useMemo(
    () => geoMercator().center(mapView.center).scale(mapView.scale).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]),
    [mapView]
  );
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const ink = tokens.ink;
  const panel = tokens.surfaceRaised;
  const brand = tokens.brandPrimary;

  const currentCountryName =
    countriesByCode?.[currentCountryCode]?.names?.[currentLanguage] ||
    countriesByCode?.[currentCountryCode]?.names?.en ||
    currentCountryCode ||
    '';

  if (isLoading || !geoFeatures) {
    return <View style={[styles.container, { backgroundColor: hexToRgba(ink, 0.05) }]} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapCrop}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none">
          {geoFeatures.map((geoFeat) => {
            const entry = activityByNumericId.get(geoFeat.id);
            const isCurrent = geoFeat.id === currentNumericId;
            const fill = entry
              ? hexToRgba(brand, 0.22 + (entry.count / maxCount) * 0.68)
              : hexToRgba(ink, isDark ? 0.14 : 0.08);
            const d = pathGenerator(geoFeat);
            if (!d) return null;
            return (
              <Path
                key={geoFeat.id}
                d={d}
                fill={fill}
                stroke={isCurrent ? brand : hexToRgba(panel, isDark ? 0.4 : 0.8)}
                strokeWidth={isCurrent ? 1.6 : 0.5}
              />
            );
          })}
          {cities.map((city, index) => {
            const point = projection([city.lon, city.lat]);
            if (!point) return null;
            const [x, y] = point;
            const r = cityRadius(city.count);
            return (
              <React.Fragment key={`${city.name}-${index}`}>
                <Circle cx={x} cy={y} r={r} fill={panel} stroke={brand} strokeWidth={2} />
                <SvgText
                  x={x}
                  y={y + r + 12}
                  fontSize={10}
                  fontWeight="600"
                  fill={ink}
                  stroke={panel}
                  strokeWidth={3}
                  textAnchor="middle"
                >
                  {city.name}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
      <View style={styles.titleOverlay} pointerEvents="none">
        <Text style={[styles.title, { color: ink }]}>
          {t('worldActivityCountries', { country: currentCountryName })}
        </Text>
        <View style={[styles.legendSwatch, { backgroundColor: hexToRgba(brand, 0.7) }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  // Same pan/crop trick as web's isMobile branch: the map renders oversized
  // and shifted vertically so its always-centered projection lands the
  // current country roughly where the header's reserved spacer box sits,
  // rather than dead-center of the whole header (which would land it mostly
  // behind the Statistics panel above it).
  mapCrop: {
    position: 'absolute',
    left: 0,
    width: '100%',
    top: '-54%',
    height: '271%',
  },
  titleOverlay: {
    position: 'absolute',
    top: '63%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  legendSwatch: {
    width: 48,
    height: 7,
    borderRadius: 4,
  },
});

export default WorldActivityMap;
