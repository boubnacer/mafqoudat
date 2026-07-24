/**
 * WorldActivityMap (mobile)
 * Ports client/src/components/dashboard/WorldActivityMap.jsx to React Native:
 * an SVG world map (react-native-svg), zoomed to the current country,
 * countries colored by worldActivity ({code, count}) with the current
 * country highlighted, and city markers (proportional-symbol dots) from
 * cityActivity. Uses the same free/no-API-key data web does - world-atlas's
 * countries-50m topojson (Natural Earth, public domain), converted to
 * GeoJSON via topojson-client, projected with d3-geo (pure JS, no DOM
 * dependency, so it runs fine here).
 *
 * Deliberately NOT mirrored for RTL, matching web: a real map has to stay
 * geographically accurate regardless of reading direction.
 *
 * Unlike web's Dash.js, this renders as a plain bounded square (HomeScreen
 * wraps it in its own Panel card, below Statistics, not behind it). Web's
 * full-bleed backdrop is achieved by rendering the map oversized and
 * panning it via CSS percentage positioning on an absolutely-positioned
 * layer; react-native-svg's percentage sizing doesn't resolve the same way
 * on a `flex: 1` parent (verified live via `expo start --web` - it
 * rendered corrupted, not just imprecisely positioned), so that trick isn't
 * worth chasing here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
  isLoading,
  tokens,
  isDark,
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
    const padding = 20;
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

  // d3-geo's per-feature projection (~177 countries) is the expensive part of
  // rendering this map - memoized separately from fill/stroke (which only
  // depend on cheap theme/activity lookups below) so a theme or language
  // change, which re-renders this whole component with new `tokens`/`isDark`
  // but the same `geoFeatures`/`projection`, doesn't redo it.
  const countryShapes = useMemo(() => {
    if (!geoFeatures) return [];
    return geoFeatures
      .map((geoFeat) => ({ geoFeat, d: pathGenerator(geoFeat) }))
      .filter((shape) => shape.d);
  }, [geoFeatures, pathGenerator]);

  const ink = tokens.ink;
  const panel = tokens.surfaceRaised;
  const brand = tokens.brandPrimary;

  if (isLoading || !geoFeatures) {
    return <View style={[styles.mapBox, { backgroundColor: hexToRgba(ink, 0.05) }]} />;
  }

  return (
    <View style={styles.mapBox}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        {countryShapes.map(({ geoFeat, d }, index) => {
          const entry = activityByNumericId.get(geoFeat.id);
          const isCurrent = geoFeat.id === currentNumericId;
          const fill = entry
            ? hexToRgba(brand, 0.22 + (entry.count / maxCount) * 0.68)
            : hexToRgba(ink, isDark ? 0.14 : 0.08);
          return (
            <Path
              key={`${geoFeat.id}-${index}`}
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
              {/* Halo-then-fill instead of paintOrder="stroke": paintOrder
                  support is inconsistent on react-native-svg's native
                  (iOS/Android) renderer, so a thick stroke could paint back
                  over the fill and turn labels into solid blobs regardless
                  of weight/stroke tuning. Two separately-ordered Text nodes
                  (stroke-only halo behind, fill-only text in front) gets the
                  same outlined-label look without depending on that. */}
              <SvgText
                x={x}
                y={y + r + 12}
                fontSize="10"
                fontWeight="normal"
                fill="none"
                stroke={panel}
                strokeWidth={2}
                textAnchor="middle"
                style={{ fontSize: 10, fontWeight: 'normal' }}
              >
                {city.name}
              </SvgText>
              <SvgText
                x={x}
                y={y + r + 12}
                fontSize="10"
                fontWeight="normal"
                fill={ink}
                textAnchor="middle"
                style={{ fontSize: 10, fontWeight: 'normal' }}
              >
                {city.name}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  mapBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default WorldActivityMap;
