## World activity map (web + mobile)

The dashboard header and the welcome hero render the same map — a chrome-less,
full-bleed backdrop zoomed to the visitor's country, countries tinted by
`worldActivity`, city dots from `cityActivity`. Web:
[WorldActivityMap.jsx](client/src/components/dashboard/WorldActivityMap.jsx)
(`react-simple-maps` + `d3-geo`), mobile:
[WorldActivityMap.js](mobile/src/components/dashboard/WorldActivityMap.js)
(`react-native-svg` + `d3-geo`, projecting by hand).

- **The geometry is generated, not a package file.**
  [buildMapData.js](client/scripts/buildMapData.js) (`npm run build-map-data`
  in `client/`) writes `client/src/data/worldMap.topo.json` and copies it to
  `mobile/src/data/`. It replaced a direct `world-atlas/countries-50m.json`
  import on both platforms. The output is committed; an install or a deploy
  never needs the network, and neither does the app at runtime.
- **Resolution is budgeted, because the map is always zoomed to one country.**
  A world file spends its whole size on countries nobody is looking at while
  leaving the one filling the canvas coarse — countries-50m gave the whole of
  Morocco 369 points. So: the 25 supported countries and their neighbours come
  from Natural Earth 10m, the rest of the world from 110m (off-canvas at every
  zoom this map uses), and each layer is simplified with its own tolerance —
  one global tolerance spends the budget on the backdrop. Net result is
  **700 KB (211 KB gzipped) against countries-50m's 756 KB (230 KB)** — for five
  layers rather than one, with the focus countries' outlines alone carrying
  ~2.8x its detail (11,884 points across the 25 against 4,211).
  `countries-10m.json` wholesale would have been 3.6 MB / 921 KB, and on mobile
  it is a static import parsed at startup.
- **Five layers.** `countries` (unchanged contract: `feature.id` is still the
  numeric Natural Earth id the components' `ISO2_TO_NUMERIC` maps to),
  `subdivisions` (the provinces / wilayas / governorates of the 25), `lakes`,
  `rivers` and `urbanAreas`. Both front ends draw the subdivisions as a **mesh
  filtered to internal borders** (`mesh(topo, subdivisions, (a, b) => a !== b)`),
  never as per-province shapes: the country underneath stays the interactive
  unit, and a mesh is one node with no fill to double up on the fills below it.
  Rivers are a mesh too, unfiltered — one node, each shared arc once. Lakes and
  urban areas stay whole `FeatureCollection`s, which `geoPath` renders into a
  single `d` apiece. So all four of these layers cost one node each, and the
  countries layer is the only per-feature one (it has to be — each country is
  filled by its own activity count).
- **Scalerank is a world-map question, and this is not a world map.** Natural
  Earth's rank says at what scale a lake or river belongs on a globe; here the
  map is always zoomed to one country, so a strict cutoff drops exactly the
  features a visitor expects. Lakes and rivers both cut at rank 6 — that keeps
  Lake Nasser (5), Lake Volta (5), Lake Habbaniyah (6), and the Nile, Tigris,
  Euphrates, Niger, Senegal and Jordan, while leaving out the seasonal wadi
  network that would read as cracks in the fill. Urban areas ignore scalerank
  altogether and filter on their own `area_sqkm` (≥ 100), which is what stops
  it under-selecting in these countries: 14 footprints in Morocco, 13 in Egypt,
  32 in Iraq.
- **City markers have NO dots; quiet cities are clean text, and active cities are Unified Map Chips.**
  Dots have been removed completely. [cityLabelLayout.js](client/src/utils/cityLabelLayout.js),
  mirrored 1:1 at [mobile/src/utils/cityLabelLayout.js](mobile/src/utils/cityLabelLayout.js),
  centers isolated cities directly on their coordinate. In crowded clusters, it walks candidate
  positions in 16 directions across rings until finding an overlap-free placement.
  When a city has new posts in the last 24h (`todayCount > 0`):
  - The city is rendered as a **Unified Map Chip**: a sleek, high-contrast pill enclosing a live
    pulsing beacon dot, the city name, and the new posts count (`+N` in bold brand accent, without a bulky inner container box).
  - In **LTR mode**: `[ • CityName +N ]` (beacon on left, city name in middle, count on right).
  - In **RTL mode**: `[ +N CityName • ]` (count on left, city name in middle, beacon on right).
  - A subtle pulse ring animates out from the live beacon dot to signal live today activity.
  - Sizing is tuned to be ultra-compact (8px font, 14px chip height, 7.5px badge font, 4px beacon, 2.5px gap)
    so active chips don't crowd or eclipse neighbouring cities.
  - Sequential fixed-gap positioning (`CHIP_GAP = 2.5px`) locks elements side by side without floating empty space.
  - The city name uses `textAnchor="middle"` anchored at the exact midpoint, guaranteeing that RTL Arabic text
    stays centered inside the chip container without bidi overflow.
  - This completely eliminates ambiguity with nearby neighbouring cities and eliminates RTL bidi overlap bugs.
  Cities are placed in descending activity order, ensuring high-activity cities stay centered
  at their true location.
  - **A placement is refused unless the city's own coordinate is the closest** (`ownsLabel`),
    preventing any misplaced label from drifting near another city's location.
  - **A label that fits nowhere is dropped, not stacked**, avoiding clutter in pathological clusters.
  - Both platforms estimate text width with balanced glyph ratios (0.48em for Arabic, 0.44em for Latin),
    keeping boxes compact and leaving ample map canvas for nearby cities.
- **The map's accent is `brandLogo`, not `brandPrimary` (web + mobile).** Every
  other surface renders the brand as a control — a button, a chip, a 6px accent
  bar — where a deep, high-contrast blue is right. This one renders it as a large
  field of color: whole countries filled at up to 90% opacity, with city names
  and a badge on top of them. `brandPrimary` at that size reads as a block of
  ink rather than as the brand. One consequence: the "+N today" badge can no
  longer take `getContrastText`, which answers white — MUI's default
  `contrastThreshold` is 3 and white on the logo blue is 3.15:1, enough to win
  that check and not enough for an 11px number. It picks between the two surface
  tokens by measured ratio instead (ink at 5.9:1 light, the panel tone at 5.5:1
  dark). Deepening the color the way `status.lost`/`status.found` did is not
  available here: being the logo's exact blue is the point.
- **Edge fade, not a drop shadow (web only).** An earlier version of this pass
  gave the city dots and "+N today" badges a shared `feDropShadow` group each
  for depth; that was removed on request — city markers and badges are flat
  fills again (panel fill + brand stroke, brand fill respectively), map color
  alone carries the surface. What stayed: the four edges still dissolve into
  the container's `surfaceBase` via a two-axis linear-gradient overlay, since
  that layer is oversized and offset (165% wide / 271% tall) and needs a fade
  in the visible window rather than a CSS mask on the map layer itself (which
  would land mostly off-screen); it's two per-axis gradients rather than one
  radial because the desktop crop lands the country ~75% across, where a
  centred vignette would dim the subject. Not mirrored to mobile:
  `react-native-svg` has no filter support anyway. A still-earlier version of
  this pass also gave the focus country a blurred brand halo, masked out of
  its own shape; it read as an extra wash of the already-bold logo blue on top
  of the country's own fill and was dropped rather than tuned down.
- **Cities with a post today pulse a ring**, and only those — the same condition
  the "+N today" badge uses, so the motion carries data the map already shows
  instead of giving every dot a heartbeat it has not earned. Stroked in `ink`
  rather than `brandLogo` — the ring crosses whatever the activity fill happens
  to be at that point, from a pale wash to the deep end of the ramp, and `ink`
  is the one tone the map already relies on to stay legible over the whole
  range (near-black in light mode, near-white in dark) rather than one more
  blue that can disappear into a same-toned country. Local GSAP in the
  component rather than a `data-reveal` attribute for `useDashboardMotion` to
  find, because `WelcomePage` mounts this map too and never runs that hook.
  Reduced motion is the usual `gsap.matchMedia("(prefers-reduced-motion:
  no-preference)")` wrapper, and the ring's resting state is `opacity="0"` as a
  presentation attribute, so a visitor for whom no tween is ever created sees
  nothing rather than a ring frozen around a dot.
- **Urban areas are a wash, and never a data layer.** They are drawn under the
  borders in flat `alpha(ink, …)` and say "people live here"; the city dots,
  which are the only thing on this map carrying real numbers, must always
  outrank them.
- **Focus countries are built as the union of their own provinces**
  (`topojson-client`'s `merge`), and the simplification happens *before* the
  merge. That is what lets the mesh work: the country outline is literally made
  of the same arcs as the province boundaries, so the internal-border filter
  drops the coast exactly, with no fringe of one line beside another.
- **The map is decorative, so lakes are filled in the container's sea tone**
  (`surfaceBase`, what `Dash.js`/`WelcomePage.jsx` paint behind the map) rather
  than a blue of their own — inland water reads as water, not as a hole in the
  country.
- **The two "Unrecognized" provinces are kept.** Natural Earth flags
  Laâyoune-Boujdour-Sakia El Hamra and Oued el Dahab `FCLASS_ISO:
  "Unrecognized"`; they are the only such features in this set. They stay in,
  because Natural Earth's admin-0 layer (which world-atlas is a build of, and
  so what this map drew before) already includes them in Morocco and leaves the
  remaining Western Sahara as its own shape — still drawn, from the neighbours
  layer. Filtering them would redraw a disputed border, which is a decision to
  take deliberately, not a side effect of a resolution change. Every other
  supported country's outline matches the previous file to within 2% of area;
  Bahrain differs by 17% because Natural Earth's admin-1 archipelago is a
  different (and closer to correct) geometry than its admin-0 one.
- **Not tiles.** MapLibre/OSM/MapTiler would bring streets and labels, and with
  them a runtime network dependency, an API key or a usage policy, a mandatory
  attribution this design has no chrome for, per-theme restyling, and a native
  module that breaks Expo Go. This map is an activity backdrop, not something
  anyone navigates.
- **The four Natural Earth sources** (`ne_10m_admin_1_states_provinces`,
  `ne_10m_lakes`, `ne_10m_rivers_lake_centerlines`, `ne_10m_urban_areas`,
  ~81 MB together) are downloaded on first run into
  `client/.cache/naturalearth/`, which is gitignored. Public domain, no key,
  no attribution requirement.
