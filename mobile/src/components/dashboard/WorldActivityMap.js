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
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { geoMercator, geoPath, geoBounds } from 'd3-geo';
import { feature as topojsonFeature, mesh as topojsonMesh } from 'topojson-client';
import worldMapTopoJson from '../../data/worldMap.topo.json';
import { CITY_LABEL_FONT_SIZE, layoutCityLabels } from '../../utils/cityLabelLayout';

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
// Every city dot is the same small size. The dots used to be a
// proportional symbol (radius scaled by the city's all-time post count),
// which made a busy city's marker swallow its neighbours and read as an
// arbitrary difference in importance at a glance. Matches web's
// WorldActivityMap.jsx.
const CITY_DOT_RADIUS = 4;

const hexToRgba = (hex, alpha) => {
  const clean = (hex || '#000000').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// 8-direction offset duplicates instead of a single textShadow: RN's
// textShadow* props render as one soft-blurred shadow (and historically had
// inconsistent Android support), which can't reproduce a crisp stroke-style
// halo. Stacking the label 8x in a 1px ring (scaled with the map) behind an
// unshifted fill copy gets the same outlined look as the old stroke+fill
// SvgText pair.
const CITY_LABEL_HALO_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

// City labels: a plain RN `Text` overlay positioned on top of the SVG map,
// anchored to the same projected x/y used for the marker circle. Unlike
// react-native-svg's `SvgText`, RN `Text` goes through the platform's native
// text shaping, so Arabic city names render as properly joined script
// instead of isolated letters.
const CityLabel = ({ x, y, text, ink, panel, scale }) => {
  const [width, setWidth] = useState(0);
  const fontSize = CITY_LABEL_FONT_SIZE * scale;
  const haloOffset = scale;
  return (
    // Positioned with `transform: translateX/Y`, never relying on RN's RTL
    // handling for the offset itself: `transform` is exempt from any
    // auto-mirroring, which is what keeps the map deliberately unmirrored
    // for RTL (see file header) - the underlying SVG map/markers (plain
    // `cx`/`cy` attributes, not RN layout styles) never move either.
    //
    // `left: 0, top: 0` are still set explicitly - leaving them unset
    // entirely made Yoga fall back to its own direction-aware default
    // static position for an offset-less absolute node, silently moving the
    // whole label anchor before the transform offset is even added. Simply
    // hardcoding `left: 0` isn't enough on its own though: RN converts JS
    // `left`/`right` to Yoga's logical START/END edges whenever
    // I18nManager.doLeftAndRightSwapInRTL is on (the default) - see
    // react-native's LayoutShadowNode.maybeTransformLeftRightToStartEnd -
    // and START only resolves to the physical left edge under LTR. Under
    // real native RTL it resolves to the physical *right* edge instead,
    // re-anchoring every label to the box's right edge (then clipped by
    // mapBox's overflow: hidden). Whether that's "real" at any given moment
    // is unreliable to reason about from JS - I18nManager.isRTL can flip
    // immediately on a language switch while already-mounted native nodes
    // stay visually frozen at the old direction until reload (per
    // LanguageContext.js's note on forceRTL), but a *freshly mounted* node
    // (e.g. this component remounting on navigating back to Home) picks up
    // whatever's current at mount time - so the same `left: 0` can resolve
    // correctly right after a language switch and then wrongly the next
    // time this remounts, with no code change in between.
    //
    // `direction: 'ltr'` on mapBox (below) sidesteps that ambiguity at the
    // source: Fabric wires the JS `direction` style straight to Yoga's
    // per-node setDirection (see
    // ReactCommon/.../view/propsConversions.h), independent of
    // I18nManager's global/possibly-stale-until-reload state entirely, and
    // it's inherited by this whole subtree. With the subtree's direction
    // pinned to LTR outright, plain `left: 0` always means physical left,
    // permanently - matching the map's stated intent of staying
    // geographically unmirrored no matter the reading direction.
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: [{ translateX: x * scale }, { translateY: y * scale }],
      }}
    >
      {/* Centred on the layout's chosen point in both axes (web's <text> uses
          textAnchor="middle" + dominantBaseline="central" for the same reason):
          the placement returned by cityLabelLayout.js is the centre of the
          label's box, not a baseline or a corner. */}
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          transform: [{ translateX: -width / 2 }, { translateY: -fontSize * 0.6 }],
          opacity: width ? 1 : 0,
        }}
      >
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
  const brand = tokens.brandPrimary;
  // What the screen behind this map shows for the sea; lakes reuse it so
  // inland water reads as water rather than a hole punched in the country.
  const sea = tokens.surfaceBase;

  const ready = !isLoading && !!geoFeatures;
  const scale = boxSize && boxSize.width ? boxSize.width / MAP_WIDTH : 1;

  const cityPoints = ready
    ? cities
        .map((city) => {
          const point = projection([city.lon, city.lat]);
          if (!point) return null;
          const [x, y] = point;
          return { city, x, y, r: CITY_DOT_RADIUS };
        })
        .filter(Boolean)
    : [];

  // The dots stay exactly on their coordinates; only the names move. See
  // utils/cityLabelLayout.js (mirrored from web) - labels walk outwards from
  // their dot until they find room, take a leader line back once they have left
  // its side, and are dropped rather than stacked when the map is too crowded.
  // Mobile has no "+N today" badges, so there are no obstacles to route around
  // beyond the dots and the other labels.
  const cityLabels = layoutCityLabels({
    points: cityPoints.map(({ city, x, y }) => ({
      x,
      y,
      name: city.name,
      weight: city.count || 0,
    })),
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    dotRadius: CITY_DOT_RADIUS,
    fontSize: CITY_LABEL_FONT_SIZE,
  });

  // Always the same outer node (loading placeholder and loaded content are
  // both children of it) so `onLayout` reliably fires on first mount and
  // `boxSize` gets measured - previously the loading state returned a whole
  // separate <View> without onLayout, and swapping to the loaded <View> once
  // data arrived didn't trigger a new layout event (same width/aspectRatio,
  // so Yoga saw no size change), leaving boxSize stuck at null and city
  // labels positioned using the unscaled 520-coordinate space instead of the
  // box's actual on-screen size - pushing them outside the clipped box on
  // any cold start where the dashboard fetch was still in flight when this
  // component first mounted.
  // No loading placeholder fill: the map now sits directly on the page as a
  // backdrop rather than inside a card, so a tinted square would read as a
  // stray panel. It simply appears once the topojson is parsed.
  return (
    <View style={styles.mapBox} onLayout={(e) => setBoxSize(e.nativeEvent.layout)}>
      {ready && (
        <>
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
            {/* Built-up areas, under everything else that sits on the country
                fill: a wash, not a shape - it should register as "this part is
                populated" without competing with the city dots, which are the
                only thing on this map carrying real data. */}
            {urbanPath && <Path d={urbanPath} fill={hexToRgba(ink, isDark ? 0.18 : 0.12)} />}
            {/* Provinces / wilayas / governorates of the supported countries, as
                one mesh path rather than per-province shapes - a single node
                with no fill to double up on the country fills below it.
                Deliberately faint: texture saying the country is a real place
                with regions in it, not a number anyone is asked to read. */}
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
            {/* Leader lines before the dots, so a dot covers its own end of
                the line instead of the line crossing it. Only labels that had
                to leave their dot's side get one. */}
            {cityLabels.map((placement, index) =>
              placement.leader ? (
                <React.Fragment key={`leader-${index}`}>
                  {/* Panel-colored halo under the line, the same trick the city
                      names use: a single thin ink line disappears against a
                      saturated country fill exactly where it matters most. */}
                  <Line
                    x1={cityPoints[index].x}
                    y1={cityPoints[index].y}
                    x2={placement.leader.x}
                    y2={placement.leader.y}
                    stroke={panel}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                  <Line
                    x1={cityPoints[index].x}
                    y1={cityPoints[index].y}
                    x2={placement.leader.x}
                    y2={placement.leader.y}
                    stroke={hexToRgba(ink, isDark ? 0.75 : 0.6)}
                    strokeWidth={0.9}
                    strokeLinecap="round"
                  />
                </React.Fragment>
              ) : null
            )}
            {cityPoints.map(({ city, x, y, r }, index) => (
              <Circle key={`${city.name}-${index}`} cx={x} cy={y} r={r} fill={panel} stroke={brand} strokeWidth={2} />
            ))}
          </Svg>
          {/* City labels are drawn as a plain RN `Text` overlay, not SvgText -
              react-native-svg's native text renderer doesn't perform Arabic
              shaping/ligature joining, so Arabic city names would render as
              isolated letters. Positions reuse the same projected x/y as the
              markers above; not mirrored for RTL, matching the map itself
              (see file header). */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {cityLabels.map((placement, index) =>
              placement.hidden ? null : (
                <CityLabel
                  key={`${cityPoints[index].city.name}-${index}`}
                  x={placement.labelX}
                  y={placement.labelY}
                  text={cityPoints[index].city.name}
                  ink={ink}
                  panel={panel}
                  scale={scale}
                />
              )
            )}
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
    // of I18nManager's global RTL state - see the long comment on
    // CityLabel's positioning View for why relying on that global state
    // (even just to read I18nManager.isRTL) is unreliable here. Requires
    // Fabric (React Native's new architecture, on by default since Expo
    // SDK 52+ and not overridden in this app's app.config.js) - Fabric
    // wires the JS `direction` style straight to Yoga's per-node
    // setDirection; the older bridge architecture only exposed this on iOS.
    direction: 'ltr',
  },
  cityLabelText: {
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default WorldActivityMap;
