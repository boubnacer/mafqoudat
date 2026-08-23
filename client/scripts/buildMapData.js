#!/usr/bin/env node
/**
 * Builds the world map topology both front ends render
 * (client/src/data/worldMap.topo.json, mirrored to mobile/src/data/).
 *
 * Why this exists: the dashboard/welcome map is always zoomed to ONE country,
 * so it needs high-resolution geometry for a couple of dozen countries and
 * almost nothing for the rest of the planet. Shipping world-atlas's
 * countries-10m.json to get that detail would cost 3.6 MB (921 KB gzipped) for
 * 477k points, of which the visible region uses a small fraction; shipping
 * countries-50m.json (the previous approach, 756 KB / 230 KB gzipped) buys
 * global coverage nobody looks at while leaving the one country that fills the
 * canvas visibly coarse — 369 points for the whole of Morocco.
 *
 * So the resolution is spent where the map actually looks:
 *   - the 25 supported countries      -> Natural Earth 10m, and drawn as the
 *                                        union of their own provinces, so the
 *                                        country outline and the internal
 *                                        borders share arcs exactly (see the
 *                                        `subdivisions` layer below)
 *   - countries near them             -> world-atlas 10m (same Natural Earth
 *                                        10m lineage, so borders line up)
 *   - the rest of the world           -> world-atlas 110m, a backdrop that is
 *                                        off-canvas at every zoom this map uses
 *   - provinces / wilayas / governorates of the 25 -> Natural Earth 10m
 *   - lakes in the region             -> Natural Earth 10m
 *
 * Everything here is free and public domain (Natural Earth), with no API key,
 * no tile server and no attribution requirement — the map keeps working with
 * no network at runtime, which is the property that made the original choice
 * right and is worth not losing.
 *
 * Run: npm run build-map-data   (from client/)
 * The two Natural Earth source files are downloaded once into
 * client/.cache/naturalearth/ and reused; the generated topology is committed,
 * so an ordinary install/build never needs the network.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { feature, merge, quantize } = require("topojson-client");
const { topology } = require("topojson-server");
const {
  presimplify, simplify, quantile, filter, filterAttachedWeight,
} = require("topojson-simplify");

// The platform's countries, ISO2 -> the numeric id Natural Earth (and so
// world-atlas) uses for feature.id. Both map components keep their own copy of
// this table to resolve the visitor's country against the geometry, so a
// country added to the platform has to be added in three places: here, and in
// each component's ISO2_TO_NUMERIC (after which this script has to be re-run,
// or the new country renders at backdrop resolution with no provinces).
const FOCUS = {
  AE: "784", BH: "048", CF: "140", TD: "148", KM: "174", DZ: "012",
  DJ: "262", EG: "818", IQ: "368", JO: "400", KW: "414", LB: "422",
  LY: "434", MA: "504", ML: "466", MR: "478", NE: "562", OM: "512",
  PS: "275", QA: "634", SA: "682", SO: "706", SD: "729", SY: "760",
  TN: "788",
};
const FOCUS_IDS = new Set(Object.values(FOCUS));

// How far beyond the supported countries' combined bounding box a country's
// centre may sit and still be drawn at full resolution. At the widest zoom this
// map uses (desktop, one country fitted to the canvas height) the neighbours
// within this margin are what fills the rest of the frame.
const REGION_PADDING_DEGREES = 8;

// Natural Earth ranks lakes by the scale they are meant to appear at; anything
// above this is a pond that would render as a speck. 6 rather than something
// stricter because the rank is set for a world map, not for a map zoomed to one
// country: at 3, Lake Nasser (5), Lake Volta (5) and Lake Habbaniyah (6) all
// drop out, and those are exactly the ones a visitor in Egypt, Ghana's
// neighbours or Iraq would expect to see.
const LAKE_MAX_SCALERANK = 6;

// Rivers are ranked the same way. 6 keeps the ones that define a country the
// way a border does — the Nile, the Tigris and Euphrates, the Niger, the
// Senegal, the Jordan — and leaves out the seasonal wadi network, which at this
// zoom would read as cracks in the fill rather than as water.
const RIVER_MAX_SCALERANK = 6;

// Urban footprints are filtered by their own area instead of by scalerank:
// scalerank answers "at what scale should this city appear on a world map",
// which under-selects in exactly the countries this map serves. 100 km² is
// about "a city you would name if asked to name cities in this country" — 14 in
// Morocco, 13 in Egypt, 32 in Iraq.
const URBAN_MIN_AREA_SQKM = 100;

// Simplification is per layer, not global — one tolerance over everything
// spends the whole budget on the backdrop. Each value is the fraction of points
// kept (Visvalingam, via topojson-simplify's quantile helper).
//
// The supported countries and their internal borders are what the map is
// zoomed to, so they keep most of their 10m detail; the neighbours are frame
// filler at that zoom and are cut hard; lakes are few and small.
const RETAIN = {
  focus: 0.6,
  neighbours: 0.12,
  lakes: 0.5,
  rivers: 0.5,
  // Urban areas are painted as a faint wash showing where people are, never as
  // a shape anyone reads the outline of, so they are cut to almost nothing.
  urban: 0.08,
};

// Coordinate grid for the delta-encoded output. 1e5 is ~0.004 degrees, well
// under a pixel at every zoom this map renders at.
const QUANTIZATION = 1e5;

const NE_BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const SOURCES = {
  admin1: "ne_10m_admin_1_states_provinces.geojson",
  lakes: "ne_10m_lakes.geojson",
  rivers: "ne_10m_rivers_lake_centerlines.geojson",
  urban: "ne_10m_urban_areas.geojson",
};
const CACHE_DIR = path.join(__dirname, "..", ".cache", "naturalearth");
const OUTPUTS = [
  path.join(__dirname, "..", "src", "data", "worldMap.topo.json"),
  path.join(__dirname, "..", "..", "mobile", "src", "data", "worldMap.topo.json"),
];

const download = (url, destination) =>
  new Promise((resolve, reject) => {
    const request = (target, redirects = 0) => {
      https
        .get(target, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            if (redirects > 5) return reject(new Error(`Too many redirects for ${url}`));
            response.resume();
            return request(response.headers.location, redirects + 1);
          }
          if (response.statusCode !== 200) {
            response.resume();
            return reject(new Error(`${target} responded ${response.statusCode}`));
          }
          const file = fs.createWriteStream(destination);
          response.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", reject);
        })
        .on("error", reject);
    };
    request(url);
  });

const readSource = async (key) => {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cached = path.join(CACHE_DIR, SOURCES[key]);
  if (!fs.existsSync(cached)) {
    process.stdout.write(`downloading ${SOURCES[key]} ...\n`);
    await download(`${NE_BASE}/${SOURCES[key]}`, cached);
  }
  return JSON.parse(fs.readFileSync(cached, "utf8"));
};

const eachCoordinate = (coordinates, visit) => {
  if (typeof coordinates[0] === "number") visit(coordinates);
  else coordinates.forEach((child) => eachCoordinate(child, visit));
};

const boundsOf = (geometry) => {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  eachCoordinate(geometry.coordinates, ([x, y]) => {
    if (x < bounds[0]) bounds[0] = x;
    if (y < bounds[1]) bounds[1] = y;
    if (x > bounds[2]) bounds[2] = x;
    if (y > bounds[3]) bounds[3] = y;
  });
  return bounds;
};

const countPoints = (object) => {
  let total = 0;
  if (object.type === "Topology") {
    object.arcs.forEach((arc) => {
      total += arc.length;
    });
    return total;
  }
  eachCoordinate(object.coordinates, () => {
    total += 1;
  });
  return total;
};

// presimplify + simplify, plus the ring filter that goes with them: without it
// a collapsed island survives as a two-point sliver (presimplify pins arc
// endpoints at Infinity, so no arc ever disappears on its own) and renders as a
// hairline scratch in the sea.
const thin = (topo, retain, { rings = true } = {}) => {
  const weighted = presimplify(topo);
  const minWeight = quantile(weighted, retain);
  // The ring filter only means anything for polygons; a river is a line and has
  // no area to fall below a threshold.
  const pruned = rings ? filter(weighted, filterAttachedWeight(weighted, minWeight)) : weighted;
  return simplify(pruned, minWeight);
};

const worldAtlasCountries = (file) => {
  const topo = require(`world-atlas/${file}`);
  return feature(topo, topo.objects.countries).features;
};

const build = async () => {
  const admin1 = await readSource("admin1");
  const lakesSource = await readSource("lakes");
  const riversSource = await readSource("rivers");
  const urbanSource = await readSource("urban");
  const detailed = worldAtlasCountries("countries-10m.json");
  const coarse = worldAtlasCountries("countries-110m.json");

  // --- the 25 supported countries, assembled from their own provinces -------
  // Merging the provinces (rather than taking the country polygon from a
  // second file) is what lets the map draw internal borders as a mesh with no
  // doubled coastline: the outline is literally made of the same arcs.
  // Every province Natural Earth attributes to one of the 25, including the two
  // it marks FCLASS_ISO "Unrecognized" (Laâyoune-Boujdour-Sakia El Hamra and
  // Oued el Dahab, in Western Sahara). Keeping them is what makes the country
  // outlines identical to the ones this map drew before this file existed:
  // world-atlas's countries-50m is Natural Earth's admin-0 layer, which already
  // draws Morocco including those two and leaves the remaining Western Sahara
  // as its own separate shape — still drawn here, from the neighbours layer.
  // Dropping them would redraw a disputed border, which is a decision to take
  // on purpose and not a side effect of a resolution upgrade.
  const provinces = admin1.features.filter((f) => FOCUS[f.properties.iso_a2]);

  const missing = Object.keys(FOCUS).filter(
    (iso) => !provinces.some((f) => f.properties.iso_a2 === iso)
  );
  if (missing.length) throw new Error(`No Natural Earth provinces for: ${missing.join(", ")}`);

  const provinceCollection = {
    type: "FeatureCollection",
    features: provinces.map((f) => ({
      type: "Feature",
      // Only the country code survives — the map draws these as boundary lines,
      // never labels them, and the localized province names would more than
      // double the file.
      properties: { iso: f.properties.iso_a2 },
      geometry: f.geometry,
    })),
  };
  // Thinned here, before the merge, so the country outline is made of the same
  // already-simplified arcs as the province boundaries — simplifying the two
  // separately would leave a country's coast a hair away from its own coastal
  // province's, which reads as a fringe along every shoreline.
  const provinceTopology = thin(topology({ subdivisions: provinceCollection }), RETAIN.focus);
  const focusCountries = Object.entries(FOCUS).map(([iso, id]) => ({
    type: "Feature",
    id,
    properties: {},
    geometry: merge(
      provinceTopology,
      provinceTopology.objects.subdivisions.geometries.filter((g) => g.properties.iso === iso)
    ),
  }));
  const thinnedProvinces = feature(provinceTopology, provinceTopology.objects.subdivisions);

  // --- everything else -----------------------------------------------------
  const focusBounds = focusCountries.reduce(
    (acc, f) => {
      const b = boundsOf(f.geometry);
      return [
        Math.min(acc[0], b[0]), Math.min(acc[1], b[1]),
        Math.max(acc[2], b[2]), Math.max(acc[3], b[3]),
      ];
    },
    [Infinity, Infinity, -Infinity, -Infinity]
  );
  const region = [
    focusBounds[0] - REGION_PADDING_DEGREES, focusBounds[1] - REGION_PADDING_DEGREES,
    focusBounds[2] + REGION_PADDING_DEGREES, focusBounds[3] + REGION_PADDING_DEGREES,
  ];
  // Centre-of-bounds rather than an overlap test: a country whose bounding box
  // merely reaches into the region (Russia's spans half the planet) is not
  // itself in frame.
  const inRegion = (f) => {
    const [x0, y0, x1, y1] = boundsOf(f.geometry);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    return cx >= region[0] && cx <= region[2] && cy >= region[1] && cy <= region[3];
  };

  const neighbours = detailed.filter((f) => !FOCUS_IDS.has(f.id) && inRegion(f));
  const neighbourIds = new Set(neighbours.map((f) => f.id));
  const backdrop = coarse.filter((f) => !FOCUS_IDS.has(f.id) && !neighbourIds.has(f.id));

  const overlapsRegion = (f) => {
    const [x0, y0, x1, y1] = boundsOf(f.geometry);
    return x0 <= region[2] && x1 >= region[0] && y0 <= region[3] && y1 >= region[1];
  };
  const lakes = lakesSource.features.filter(
    (f) => (f.properties.scalerank ?? 99) <= LAKE_MAX_SCALERANK && overlapsRegion(f)
  );
  const rivers = riversSource.features.filter(
    (f) => (f.properties.scalerank ?? 99) <= RIVER_MAX_SCALERANK && overlapsRegion(f)
  );
  const urban = urbanSource.features.filter(
    (f) => (f.properties.area_sqkm || 0) >= URBAN_MIN_AREA_SQKM && overlapsRegion(f)
  );

  // --- one topology, so every shared border is one arc ----------------------
  // Built unquantized on purpose: topojson-simplify measures triangle areas in
  // absolute coordinates, and quantizing first leaves the topology
  // delta-encoded, which the simplifier then undoes — the output ends up as
  // full-precision floats and roughly ten times the size it should be.
  // Quantization is the last step instead (below).
  const thinnedNeighbours = feature(
    thin(topology({ countries: { type: "FeatureCollection", features: neighbours } }), RETAIN.neighbours),
    "countries"
  ).features;
  const thinnedLakes = feature(
    thin(topology({ lakes: { type: "FeatureCollection", features: lakes } }), RETAIN.lakes),
    "lakes"
  ).features;
  const thinnedRivers = feature(
    thin(topology({ rivers: { type: "FeatureCollection", features: rivers } }), RETAIN.rivers, {
      rings: false,
    }),
    "rivers"
  ).features;
  const thinnedUrban = feature(
    thin(topology({ urban: { type: "FeatureCollection", features: urban } }), RETAIN.urban),
    "urban"
  ).features;

  const bare = (f) => ({ type: "Feature", id: f.id, properties: {}, geometry: f.geometry });
  const simplified = quantize(
    topology({
      countries: {
        type: "FeatureCollection",
        features: [...focusCountries, ...thinnedNeighbours, ...backdrop].map(bare),
      },
      subdivisions: {
        type: "FeatureCollection",
        features: thinnedProvinces.features.map((f) => ({
          type: "Feature",
          properties: { iso: f.properties.iso },
          geometry: f.geometry,
        })),
      },
      lakes: { type: "FeatureCollection", features: thinnedLakes.map(bare) },
      rivers: { type: "FeatureCollection", features: thinnedRivers.map(bare) },
      urbanAreas: { type: "FeatureCollection", features: thinnedUrban.map(bare) },
    }),
    QUANTIZATION
  );

  const output = JSON.stringify(simplified);

  OUTPUTS.forEach((destination) => {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, output);
  });

  process.stdout.write(
    [
      `countries : ${focusCountries.length} at 10m (from provinces), ` +
        `${neighbours.length} neighbours at 10m, ${backdrop.length} at 110m`,
      `provinces : ${provinces.length}`,
      `lakes     : ${lakes.length}`,
      `rivers    : ${rivers.length}`,
      `urban     : ${urban.length}`,
      `points    : ${countPoints(simplified)}`,
      `written   : ${(output.length / 1024).toFixed(0)} KB to`,
      ...OUTPUTS.map((o) => `            ${path.relative(path.join(__dirname, "..", ".."), o)}`),
    ].join("\n") + "\n"
  );
};

build().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
