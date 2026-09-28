/**
 * WorldActivityMap (mobile)
 * Ports client/src/components/dashboard/WorldActivityMap.jsx to React Native:
 * an SVG world map (react-native-svg), zoomed to the current country,
 * countries colored by worldActivity ({code, count}) with the current
 * country highlighted, and city markers (uniform small dots) from
 * cityActivity. Uses the same free/no-API-key data web does - the generated
 * worldMap.topo.json (Natural Earth, public domain; built by
 * client/scripts/buildMapData.js, which writes this copy too), converted to
 * GeoJSON via topojson-client, projected with d3-geo (pure JS, no DOM
 * dependency, so it runs fine here). Three layers, same as web: countries
 * (the 25 supported ones and their neighbours at 10m detail, the rest of the
 * world at 110m), the provinces/wilayas/governorates of those 25 drawn as a
 * mesh of internal borders only, the region's lakes and rivers, and built-up
 * areas as a faint wash.
 *
 * Deliberately NOT mirrored for RTL, matching web: a real map has to stay
 * geographically accurate regardless of reading direction.
 *
 * Chrome-less, like web's version: no card, no radius, no background of its
 * own - it renders as a bare square that fills whatever box it is given, and
 * HomeScreen positions it as a full-bleed backdrop behind the statistics.
 * Web achieves that backdrop by rendering the map oversized and panning it
 * via CSS percentage positioning on an absolutely-positioned layer;
 * react-native-svg's percentage sizing doesn't resolve the same way on a
 * `flex: 1` parent (verified live via `expo start --web` - it rendered
 * corrupted, not just imprecisely positioned), so HomeScreen reproduces the
 * placement with layout instead: the map keeps its natural square and is
 * bottom-anchored in the header, with a spacer reserving its room.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { geoMercator, geoPath, geoBounds } from 'd3-geo';
import { feature as topojsonFeature, mesh as topojsonMesh } from 'topojson-client';
import worldMapTopoJson from '../../data/worldMap.topo.json';
import {
  CITY_LABEL_FONT_SIZE,
  layoutCityLabels,
} from '../../utils/cityLabelLayout';
import { fontFamilies } from '../../theme/tokens';

// Same 25-country roster as the web version - ISO2 (matches Country.code) to
// the numeric id Natural Earth (and so the generated topology) uses for
// feature.id.
const ISO2_TO_NUMERIC = {
  AE: '784', BH: '048', CF: '140', TD: '148', KM: '174', DZ: '012',
  DJ: '262', EG: '818', IQ: '368', JO: '400', KW: '414', LB: '422',
  LY: '434', MA: '504', ML: '466', MR: '478', NE: '562', OM: '512',
  PS: '275', QA: '634', SA: '682', SO: '706', SD: '729', SY: '760',
  TN: '788',
};

const MAP_WIDTH = 520;
const MAP_HEIGHT = 520;

// Mobile zoom math: matches web's WorldActivityMap.jsx mobile responsive view.
// Pushes past the fit scale while keeping padding = 60 to reserve room around
// the country bounds for city labels and "+N today" badges.
const MOBILE_ZOOM = 1.25;

// Radius the today-pulse ring travels to, duration and repeat delay matching web GSAP.
const PULSE_DURATION = 2200;
const PULSE_REPEAT_DELAY = 1400;

const hexToRgba = (hex, alpha) => {
  const clean = (hex || '#000000').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const getLuminance = (hex) => {
  const clean = (hex || '#000000').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const getContrastRatio = (color1, color2) => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// 8-direction offset duplicates instead of a single textShadow: RN's
// textShadow* props render as one soft-blurred shadow (and historically had
// inconsistent Android support), which can't reproduce a crisp stroke-style
// halo. Stacking the label 8x in a 1px ring (scaled with the map) behind an
// unshifted fill copy gets the same outlined look as web's stroke+fill SVG text.
const CITY_LABEL_HALO_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

// Pulse ring for active cities: expands outward from the live beacon dot
// and fades out, repeating smoothly via RN Animated on the native thread.
const PulseRing = ({ scale, brand, isDark, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [started, setStarted] = useState(delay === 0);

  useEffect(() => {
    let timeoutId;
    let pulseLoop;

    const startPulse = () => {
      setStarted(true);
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: PULSE_DURATION,
            easing: Easing.out(Easing.poly(2)),
            useNativeDriver: true,
          }),
          Animated.delay(PULSE_REPEAT_DELAY),
        ])
      );
      pulseLoop.start();
    };

    if (delay > 0) {
      timeoutId = setTimeout(startPulse, delay);
    } else {
      startPulse();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (pulseLoop) pulseLoop.stop();
    };
  }, [anim, delay]);

  if (!started) return null;

  const initialRadius = 2 * scale;
  const initialDiameter = initialRadius * 2;
  const initialOpacity = isDark ? 0.75 : 0.65;

  const ringScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.2],
  });

  const ringOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [initialOpacity, 0],
  });

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          width: initialDiameter,
          height: initialDiameter,
          borderRadius: initialRadius,
          borderWidth: 1.2 * scale,
          borderColor: brand,
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }}
      />
    </View>
  );
};

// Live beacon dot with pulse ring
const BeaconDot = ({ scale, brand, isDark, delay = 0 }) => {
  const dotSize = 4 * scale;
  return (
    <View style={{ width: dotSize, height: dotSize, justifyContent: 'center', alignItems: 'center' }}>
      <PulseRing scale={scale} brand={brand} isDark={isDark} delay={delay} />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: brand,
        }}
      />
    </View>
  );
};

const CityLabel = ({ text, ink, panel, scale }) => {
  const fontSize = CITY_LABEL_FONT_SIZE * scale;
  const haloOffset = 0.8 * scale;
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      {CITY_LABEL_HALO_OFFSETS.map(([dx, dy], i) => (
        <Text
          key={i}
          numberOfLines={1}
          allowFontScaling={false}
          style={[
            styles.cityLabelText,
            {
              position: 'absolute',
              left: 0,
              top: 0,
              transform: [{ translateX: dx * haloOffset }, { translateY: dy * haloOffset }],
              fontSize,
              color: panel,
            },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[styles.cityLabelText, { fontSize, color: ink }]}
      >
        {text}
      </Text>
    </View>
  );
};

// Unified city item:
// - Quiet city: clean text with halo outline.
// - Active city with new posts: Unified Map Chip enclosing:
//     • Live pulsing beacon dot
//     • City name
//     • New posts counter pill (+N)
//   LTR: [ • CityName  +3 ]
//   RTL: [ +3  CityName • ]
const CityItem = ({ placement, city, brand, panel, ink, badgeText, scale, isDark, isRTL, index }) => {
  const [size, setSize] = useState(null);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: [{ translateX: placement.cx * scale }, { translateY: placement.cy * scale }],
      }}
      pointerEvents="none"
    >
      <View
        onLayout={(e) => setSize(e.nativeEvent.layout)}
        style={{
          transform: [
            { translateX: size ? -size.width / 2 : 0 },
            { translateY: size ? -size.height / 2 : 0 },
          ],
          opacity: size ? 1 : 0,
        }}
      >
        {placement.hasNewPosts ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: panel,
              borderColor: brand,
              borderWidth: 1.2 * scale,
              borderRadius: 8 * scale,
              paddingHorizontal: 5 * scale,
              paddingVertical: 1.5 * scale,
              elevation: 2,
              shadowColor: brand,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            }}
          >
            {isRTL ? (
              <>
                <View
                  style={{
                    backgroundColor: brand,
                    borderRadius: 5.5 * scale,
                    paddingHorizontal: 4 * scale,
                    paddingVertical: 0.5 * scale,
                  }}
                >
                  <Text style={[styles.badgeText, { color: badgeText, fontSize: 7.5 * scale }]}>
                    {`+${placement.todayCount}`}
                  </Text>
                </View>
                <View style={{ width: 3.5 * scale }} />
                <Text style={[styles.cityChipName, { color: ink, fontSize: 8 * scale }]}>
                  {city.name}
                </Text>
                <View style={{ width: 3.5 * scale }} />
                <BeaconDot scale={scale} brand={brand} isDark={isDark} delay={(index % 5) * 450} />
              </>
            ) : (
              <>
                <BeaconDot scale={scale} brand={brand} isDark={isDark} delay={(index % 5) * 450} />
                <View style={{ width: 3.5 * scale }} />
                <Text style={[styles.cityChipName, { color: ink, fontSize: 8 * scale }]}>
                  {city.name}
                </Text>
                <View style={{ width: 3.5 * scale }} />
                <View
                  style={{
                    backgroundColor: brand,
                    borderRadius: 5.5 * scale,
                    paddingHorizontal: 4 * scale,
                    paddingVertical: 0.5 * scale,
                  }}
                >
                  <Text style={[styles.badgeText, { color: badgeText, fontSize: 7.5 * scale }]}>
                    {`+${placement.todayCount}`}
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <CityLabel text={city.name} ink={ink} panel={panel} scale={scale} />
        )}
      </View>
    </View>
  );
};

const WorldActivityMap = ({
  worldActivity,
  cityActivity,
  currentCountryCode,
  isLoading,
  tokens,
  isDark,
  isRTL = false,
  hideTitle = false,
}) => {
  const [mapLayers, setMapLayers] = useState(null);
  const geoFeatures = mapLayers ? mapLayers.countries : null;
  // Actual rendered pixel width of mapBox (square, so height matches). The
  // SVG's viewBox scales its coordinate space - including stroke widths and
  // font sizes - to fit whatever size the box actually renders at (e.g.
  // larger on a tablet), but RN `Text` has no equivalent auto-scaling, so
  // this measurement drives an explicit scale factor for the label overlay.
  const [boxSize, setBoxSize] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // topojson-client has no DOM dependency and could run synchronously, but
    // deferring a tick keeps this off the header's first paint the same way
    // web's dynamic import does.
    const timer = setTimeout(() => {
      if (cancelled) return;
      const topo = worldMapTopoJson;
      setMapLayers({
        countries: topojsonFeature(topo, topo.objects.countries).features,
        // Internal borders only: `a !== b` keeps arcs shared by two provinces
        // and drops the ones with a single neighbour - the coast and the
        // national outline, already drawn by the countries layer. The country
        // shapes are the union of these same provinces, so this is the
        // identical arc rather than a second line beside it.
        subdivisions: topojsonMesh(topo, topo.objects.subdivisions, (a, b) => a !== b),
        // No filter on the river mesh - every arc is wanted, and mesh still
        // beats feature() because it emits each shared arc once and yields one
        // node instead of a hundred.
        rivers: topojsonMesh(topo, topo.objects.rivers),
        // Kept as whole FeatureCollections: d3's geoPath turns one straight
        // into a single `d`, so each of these layers is one Path too.
        lakes: topojsonFeature(topo, topo.objects.lakes),
        urbanAreas: topojsonFeature(topo, topo.objects.urbanAreas),
      });
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

  const currentNumericId = currentCountryCode ? ISO2_TO_NUMERIC[currentCountryCode] : null;

  const currentFeature = useMemo(() => {
    if (!geoFeatures || !currentNumericId) return null;
    return geoFeatures.find((f) => f.id === currentNumericId) || null;
  }, [geoFeatures, currentNumericId]);

  // Mobile: square reference canvas, kept tightly zoomed with MOBILE_ZOOM = 1.25
  // and padding = 60, matching web's WorldActivityMap.jsx mobile responsive view.
  const mapView = useMemo(() => {
    if (!currentFeature) return { center: [15, 20], scale: 220 };
    const padding = 60;
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(currentFeature);
    const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    const reference = geoMercator().center(center).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]).scale(1);
    const [[x0, y0], [x1, y1]] = geoPath(reference).bounds(currentFeature);
    const fitScale = Math.min(
      (MAP_WIDTH - padding * 2) / Math.max(x1 - x0, 0.001),
      (MAP_HEIGHT - padding * 2) / Math.max(y1 - y0, 0.001)
    );
    return { center, scale: fitScale * MOBILE_ZOOM };
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

  // Projected once alongside the country shapes and for the same reason - the
  // mesh is a single large path and the lakes are re-projected on every theme
  // or language change otherwise.
  const subdivisionsPath = useMemo(
    () => (mapLayers && mapLayers.subdivisions ? pathGenerator(mapLayers.subdivisions) : null),
    [mapLayers, pathGenerator]
  );
  const riversPath = useMemo(
    () => (mapLayers && mapLayers.rivers ? pathGenerator(mapLayers.rivers) : null),
    [mapLayers, pathGenerator]
  );
  const lakesPath = useMemo(
    () => (mapLayers && mapLayers.lakes ? pathGenerator(mapLayers.lakes) : null),
    [mapLayers, pathGenerator]
  );
  const urbanPath = useMemo(
    () => (mapLayers && mapLayers.urbanAreas ? pathGenerator(mapLayers.urbanAreas) : null),
    [mapLayers, pathGenerator]
  );

  const ink = tokens.ink;
  const panel = tokens.surfaceRaised;
  // The logo's own blue rather than brandPrimary, matching web's map: this is
  // the one surface that renders the brand as a large field of color (whole
  // countries filled at up to 90% opacity) instead of as a control, and
  // brandPrimary at that size reads as a block of ink rather than as the brand.
  const brand = tokens.brandLogo;
  // What the screen behind this map shows for the sea; lakes reuse it so
  // inland water reads as water rather than a hole punched in the country.
  const sea = tokens.surfaceBase;

  // Badge text color picked by contrast ratio against brandLogo, exactly matching web.
  const badgeText = getContrastRatio(brand, panel) >= 4.5 ? panel : ink;

  const ready = !isLoading && !!geoFeatures;
  const scale = boxSize && boxSize.width ? boxSize.width / MAP_WIDTH : 1;

  // Cities projected once, then laid out: dots have been removed.
  // The city name and optional "+N today" badge form a single unit.
  // In LTR mode, "+N" is placed to the left of the city name.
  // In RTL mode, "+N" is placed to the right of the city name.
  const cityMarkers = useMemo(() => {
    if (!ready) return { cities: [], placements: [] };

    const projected = cities
      .map((city) => {
        const point = projection([city.lon, city.lat]);
        return point ? { city, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);

    const placements = layoutCityLabels({
      points: projected.map(({ city, x, y }) => ({
        x,
        y,
        name: city.name,
        weight: city.count || 0,
        todayCount: city.todayCount || 0,
      })),
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      fontSize: CITY_LABEL_FONT_SIZE,
      isRTL,
    });

    return { cities: projected, placements };
  }, [ready, cities, projection, isRTL]);

  // Always the same outer node (loading placeholder and loaded content are
  // both children of it) so `onLayout` reliably fires on first mount and
  // `boxSize` gets measured.
  return (
    <View style={styles.mapBox} onLayout={(e) => setBoxSize(e.nativeEvent.layout)}>
      {ready && (
        <>
          {/* Layer 1: Base SVG map (countries, urban areas, subdivisions, lakes, rivers) */}
          <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={StyleSheet.absoluteFill}>
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
            {/* Built-up areas, under everything else that sits on the country
                fill: a wash, not a shape - it should register as "this part is
                populated" without competing with the city dots. */}
            {urbanPath && <Path d={urbanPath} fill={hexToRgba(ink, isDark ? 0.18 : 0.12)} />}
            {/* Provinces / wilayas / governorates of the supported countries, as
                one mesh path rather than per-province shapes - a single node
                with no fill to double up on the country fills below it. */}
            {subdivisionsPath && (
              <Path
                d={subdivisionsPath}
                fill="none"
                stroke={hexToRgba(panel, isDark ? 0.35 : 0.7)}
                strokeWidth={0.4}
                strokeLinejoin="round"
              />
            )}
            {lakesPath && <Path d={lakesPath} fill={sea} />}
            {/* Rivers, in the same tone as the lakes and the sea, stroked
                rather than filled. Thin enough to read as water rather than as
                another border. */}
            {riversPath && (
              <Path
                d={riversPath}
                fill="none"
                stroke={sea}
                strokeWidth={0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          {/* Layer 2: City labels and "+N today" badges drawn as RN Text overlay.
              NO dots.
              If there are new posts:
                - LTR: "+N" badge is to the left of the city name (tight 0.1cm gap)
                - RTL: "+N" badge is to the right of the city name (tight 0.1cm gap)
              If no new posts: city name is centered on the city coordinate. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {cityMarkers.placements.map((placement, index) => {
              if (placement.hidden) return null;
              const city = cityMarkers.cities[index].city;
              return (
                <CityItem
                  key={`city-item-${city.name}-${index}`}
                  placement={placement}
                  city={city}
                  brand={brand}
                  panel={panel}
                  ink={ink}
                  badgeText={badgeText}
                  scale={scale}
                  isDark={isDark}
                  isRTL={isRTL}
                  index={index}
                />
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapBox: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    // Pins this whole subtree's Yoga layout direction to LTR, independent
    // of I18nManager's global RTL state.
    direction: 'ltr',
  },
  cityLabelText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  cityChipName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  badgeText: {
    fontFamily: fontFamilies.display,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default WorldActivityMap;
