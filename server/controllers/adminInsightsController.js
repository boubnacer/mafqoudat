const Post = require("../models/Post");
const User = require("../models/User");
const Report = require("../models/Report");
const Comment = require("../models/Comment");
const Contact = require("../models/Contact");
const Visitor = require("../models/Visitor");
const Category = require("../models/Category");
const City = require("../models/City");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const AdminAction = require("../models/AdminAction");

/**
 * The panel's read-only half: the overview, the analytics page and the audit
 * trail.
 *
 * Two constraints shape every query in here.
 *
 * The first is the free-tier cluster the panel itself monitors on its System
 * page - so each collection is asked ONCE, with a `$facet` producing every
 * number that page needs from a single pass, rather than a dozen
 * `countDocuments` calls each paying for their own scan. Post carries no
 * standalone index on `status` or `createdAt` (its indexes are all compound
 * and country-led), so those counts would scan regardless; one scan for
 * fourteen numbers is the cheap version, not the expensive one.
 *
 * The second is that a day boundary has to mean one thing. Everything here
 * buckets in UTC, including the daily series, so the chart the client draws
 * and the "today" figure above it agree no matter where the admin is sitting.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 30;

// UTC midnight `daysAgo` days back from now.
const utcDayStart = (daysAgo = 0) => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - daysAgo * DAY_MS
  );
};

const isoDay = (date) => date.toISOString().slice(0, 10);

// One $facet branch that counts documents created inside a window.
const countInWindow = (from, to) => {
  const range = to ? { $gte: from, $lt: to } : { $gte: from };
  return [{ $match: { createdAt: range } }, { $count: "n" }];
};

const facetCount = (result, key) => result?.[key]?.[0]?.n || 0;

// $sortByCount answers [{_id, count}]; turn that into a plain map.
const toCountMap = (rows = []) => {
  const map = {};
  rows.forEach((row) => {
    if (row?._id === null || row?._id === undefined) return;
    map[String(row._id)] = row.count;
  });
  return map;
};

/**
 * Fill in the days nobody posted.
 *
 * An aggregation only answers for days that have documents, so a quiet
 * Tuesday is simply absent from the result - and a chart drawn straight off
 * that silently closes the gap, turning "nothing happened" into a straight
 * line between the days either side of it. Every series here is built against
 * a complete run of days with explicit zeroes instead.
 */
const buildDaySkeleton = (days = SERIES_DAYS) => {
  const start = utcDayStart(days - 1);
  const skeleton = [];
  for (let i = 0; i < days; i += 1) {
    skeleton.push(isoDay(new Date(start.getTime() + i * DAY_MS)));
  }
  return skeleton;
};

// A period-over-period delta, as a whole percentage. `null` rather than 0 or
// Infinity when the previous period was empty: "up 100%" from nothing is a
// claim the data cannot support, and the client renders null as "no comparison".
const percentChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};

const localizedLabels = (doc) => ({
  en: doc?.labels?.en || doc?.names?.en || doc?.code || "",
  fr: doc?.labels?.fr || doc?.names?.fr || doc?.labels?.en || doc?.code || "",
  ar: doc?.labels?.ar || doc?.names?.ar || doc?.labels?.en || doc?.code || "",
});

// Resolve a [{_id, count}] list of refs into labelled rows, dropping ids whose
// document is gone (a deleted category still sits on old posts).
const resolveRefCounts = async (rows, Model, extraSelect = "") => {
  const ids = rows.map((row) => row._id).filter(Boolean);
  if (!ids.length) return [];
  const docs = await Model.find({ _id: { $in: ids } })
    .select(`labels names code ${extraSelect}`.trim())
    .lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  return rows
    .map((row) => {
      const doc = byId.get(String(row._id));
      if (!doc) return null;
      return {
        id: String(doc._id),
        code: doc.code || "",
        labels: localizedLabels(doc),
        count: row.count,
      };
    })
    .filter(Boolean);
};

// @desc  Everything the Overview page renders, in one request
// @route GET /admin/overview
// @access Private (Admin only)
const getAdminOverview = async (req, res) => {
  try {
    const startOfToday = utcDayStart(0);
    const start7 = utcDayStart(6);
    const prev7 = utcDayStart(13);
    const start30 = utcDayStart(29);
    const prev30 = utcDayStart(59);
    const seriesStart = utcDayStart(SERIES_DAYS - 1);

    const [postFacet] = await Post.aggregate([
      {
        $facet: {
          total: [{ $count: "n" }],
          byStatus: [{ $sortByCount: "$status" }],
          byType: [{ $sortByCount: "$foundLost" }],
          returned: [{ $match: { returned: true } }, { $count: "n" }],
          withPhoto: [
            { $match: { cloudinaryUrl: { $nin: [null, ""] } } },
            { $count: "n" },
          ],
          promoted: [{ $match: { promotionRequested: true } }, { $count: "n" }],
          today: countInWindow(startOfToday),
          last7: countInWindow(start7),
          prior7: countInWindow(prev7, start7),
          last30: countInWindow(start30),
          prior30: countInWindow(prev30, start30),
          topCategories: [
            { $match: { category: { $ne: null } } },
            { $sortByCount: "$category" },
            { $limit: 6 },
          ],
          topCities: [
            { $match: { city: { $ne: null } } },
            { $sortByCount: "$city" },
            { $limit: 6 },
          ],
          topCountries: [
            { $match: { country: { $ne: null } } },
            { $sortByCount: "$country" },
            { $limit: 6 },
          ],
          series: [
            { $match: { createdAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  day: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
                  },
                  type: "$foundLost",
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]).allowDiskUse(false);

    const [userFacet] = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "n" }],
          active: [{ $match: { isActive: true } }, { $count: "n" }],
          byRole: [{ $sortByCount: "$role" }],
          byProvider: [{ $sortByCount: "$authProvider" }],
          today: countInWindow(startOfToday),
          last7: countInWindow(start7),
          prior7: countInWindow(prev7, start7),
          last30: countInWindow(start30),
          prior30: countInWindow(prev30, start30),
          series: [
            { $match: { createdAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]).allowDiskUse(false);

    const [
      foundLostOptions,
      pendingReports,
      totalReports,
      pendingPromotions,
      pendingResetRequests,
      contactStats,
      totalComments,
      totalVisitors,
      visitorsToday,
      recentPosts,
      recentUsers,
    ] = await Promise.all([
      FoundLost.find().select("code labels").lean(),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments(),
      Post.countDocuments({ promotionRequested: true, promotionProcessed: false }),
      PasswordResetRequest.countDocuments({ status: "pending" }),
      Contact.getStats(),
      Comment.countDocuments({ status: "active" }),
      Visitor.countDocuments(),
      Visitor.countDocuments({ visitedAt: { $gte: startOfToday } }),
      Post.find()
        .populate("user", "username")
        .populate("category", "labels code")
        .populate("city", "labels")
        .populate("country", "labels names code")
        .populate("foundLost", "code")
        .select("_id description exactLocation createdAt status returned cloudinaryUrl image views")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      User.find()
        .populate("country", "labels names code")
        .select("username email phone role isActive createdAt authProvider")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // foundLost is a two-document collection, so its ids are mapped in JS
    // rather than paid for as a $lookup inside every facet branch.
    const typeById = new Map(
      (foundLostOptions || []).map((option) => [String(option._id), option.code])
    );
    const codeFor = (id) => typeById.get(String(id)) || null;

    const statusCounts = toCountMap(postFacet?.byStatus);
    const typeRaw = toCountMap(postFacet?.byType);
    const byType = { lost: 0, found: 0 };
    Object.entries(typeRaw).forEach(([id, count]) => {
      const code = codeFor(id);
      if (code === "LOST") byType.lost += count;
      else if (code === "FOUND") byType.found += count;
    });

    // Series: one row per day, zeroes included (see buildDaySkeleton).
    const days = buildDaySkeleton(SERIES_DAYS);
    const seriesIndex = new Map(
      days.map((day) => [day, { date: day, lost: 0, found: 0, users: 0 }])
    );
    (postFacet?.series || []).forEach((row) => {
      const bucket = seriesIndex.get(row?._id?.day);
      if (!bucket) return;
      const code = codeFor(row?._id?.type);
      if (code === "LOST") bucket.lost += row.count;
      else if (code === "FOUND") bucket.found += row.count;
    });
    (userFacet?.series || []).forEach((row) => {
      const bucket = seriesIndex.get(row?._id);
      if (bucket) bucket.users += row.count;
    });

    const [topCategories, topCities, topCountries] = await Promise.all([
      resolveRefCounts(postFacet?.topCategories || [], Category),
      resolveRefCounts(postFacet?.topCities || [], City),
      resolveRefCounts(postFacet?.topCountries || [], Country),
    ]);

    const postsLast7 = facetCount(postFacet, "last7");
    const postsPrior7 = facetCount(postFacet, "prior7");
    const usersLast7 = facetCount(userFacet, "last7");
    const usersPrior7 = facetCount(userFacet, "prior7");

    res.status(200).json({
      success: true,
      data: {
        queues: {
          reports: pendingReports,
          promotions: pendingPromotions,
          resetRequests: pendingResetRequests,
          contacts: contactStats?.new || 0,
          urgentContacts: contactStats?.urgent || 0,
        },
        totals: {
          posts: facetCount(postFacet, "total"),
          users: facetCount(userFacet, "total"),
          activeUsers: facetCount(userFacet, "active"),
          comments: totalComments,
          reports: totalReports,
          visitors: totalVisitors,
          contacts: contactStats?.total || 0,
        },
        growth: {
          posts: {
            today: facetCount(postFacet, "today"),
            last7: postsLast7,
            prior7: postsPrior7,
            change7: percentChange(postsLast7, postsPrior7),
            last30: facetCount(postFacet, "last30"),
            prior30: facetCount(postFacet, "prior30"),
            change30: percentChange(
              facetCount(postFacet, "last30"),
              facetCount(postFacet, "prior30")
            ),
          },
          users: {
            today: facetCount(userFacet, "today"),
            last7: usersLast7,
            prior7: usersPrior7,
            change7: percentChange(usersLast7, usersPrior7),
            last30: facetCount(userFacet, "last30"),
            prior30: facetCount(userFacet, "prior30"),
            change30: percentChange(
              facetCount(userFacet, "last30"),
              facetCount(userFacet, "prior30")
            ),
          },
          visitors: {
            today: visitorsToday,
            total: totalVisitors,
          },
        },
        content: {
          byStatus: {
            active: statusCounts.active || 0,
            resolved: statusCounts.resolved || 0,
            expired: statusCounts.expired || 0,
            suspended: statusCounts.suspended || 0,
          },
          byType,
          returned: facetCount(postFacet, "returned"),
          withPhoto: facetCount(postFacet, "withPhoto"),
          promoted: facetCount(postFacet, "promoted"),
        },
        people: {
          byRole: toCountMap(userFacet?.byRole),
          byProvider: toCountMap(userFacet?.byProvider),
        },
        series: days.map((day) => seriesIndex.get(day)),
        top: { categories: topCategories, cities: topCities, countries: topCountries },
        recent: { posts: recentPosts, users: recentUsers },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error building admin overview:", error);
    res.status(500).json({ success: false, message: "Error building admin overview" });
  }
};

// @desc  Visitor + content analytics over a chosen window
// @route GET /admin/analytics?days=30
// @access Private (Admin only)
const getAdminAnalytics = async (req, res) => {
  try {
    // Clamped rather than free-form: this reads a collection the site writes to
    // on every first page view, and the panel offers three fixed ranges.
    const requested = parseInt(req.query.days, 10);
    const days = [7, 30, 90].includes(requested) ? requested : 30;
    const seriesStart = utcDayStart(days - 1);
    const priorStart = utcDayStart(days * 2 - 1);
    const startOfToday = utcDayStart(0);

    const [visitorFacet] = await Visitor.aggregate([
      {
        $facet: {
          total: [{ $count: "n" }],
          today: [{ $match: { visitedAt: { $gte: startOfToday } } }, { $count: "n" }],
          window: [{ $match: { visitedAt: { $gte: seriesStart } } }, { $count: "n" }],
          priorWindow: [
            { $match: { visitedAt: { $gte: priorStart, $lt: seriesStart } } },
            { $count: "n" },
          ],
          first: [{ $sort: { visitedAt: 1 } }, { $limit: 1 }, { $project: { visitedAt: 1 } }],
          series: [
            { $match: { visitedAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$visitedAt", timezone: "UTC" },
                },
                count: { $sum: 1 },
              },
            },
          ],
          topCountries: [
            { $match: { visitedAt: { $gte: seriesStart } } },
            { $sortByCount: "$country" },
            { $limit: 8 },
          ],
          topCities: [
            { $match: { visitedAt: { $gte: seriesStart } } },
            { $sortByCount: "$city" },
            { $limit: 8 },
          ],
          topLandings: [
            { $match: { visitedAt: { $gte: seriesStart } } },
            { $sortByCount: "$firstPage" },
            { $limit: 8 },
          ],
        },
      },
    ]).allowDiskUse(false);

    const [postFacet] = await Post.aggregate([
      {
        $facet: {
          window: [{ $match: { createdAt: { $gte: seriesStart } } }, { $count: "n" }],
          priorWindow: [
            { $match: { createdAt: { $gte: priorStart, $lt: seriesStart } } },
            { $count: "n" },
          ],
          series: [
            { $match: { createdAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  day: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
                  },
                  type: "$foundLost",
                },
                count: { $sum: 1 },
              },
            },
          ],
          resolvedSeries: [
            { $match: { resolvedAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$resolvedAt", timezone: "UTC" },
                },
                count: { $sum: 1 },
              },
            },
          ],
          viewsTotal: [{ $group: { _id: null, n: { $sum: "$views" } } }],
          mostViewed: [
            { $match: { views: { $gt: 0 } } },
            { $sort: { views: -1 } },
            { $limit: 6 },
            { $project: { _id: 1, description: 1, views: 1, createdAt: 1, city: 1, foundLost: 1 } },
          ],
        },
      },
    ]).allowDiskUse(false);

    const [userFacet] = await User.aggregate([
      {
        $facet: {
          window: [{ $match: { createdAt: { $gte: seriesStart } } }, { $count: "n" }],
          priorWindow: [
            { $match: { createdAt: { $gte: priorStart, $lt: seriesStart } } },
            { $count: "n" },
          ],
          series: [
            { $match: { createdAt: { $gte: seriesStart } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]).allowDiskUse(false);

    const [foundLostOptions, cityDocs] = await Promise.all([
      FoundLost.find().select("code").lean(),
      City.find({
        _id: {
          $in: (postFacet?.mostViewed || []).map((post) => post.city).filter(Boolean),
        },
      })
        .select("labels")
        .lean(),
    ]);
    const typeById = new Map(
      (foundLostOptions || []).map((option) => [String(option._id), option.code])
    );
    const cityById = new Map(cityDocs.map((doc) => [String(doc._id), doc]));

    const dayList = buildDaySkeleton(days);
    const index = new Map(
      dayList.map((day) => [
        day,
        { date: day, visitors: 0, lost: 0, found: 0, users: 0, resolved: 0 },
      ])
    );
    (visitorFacet?.series || []).forEach((row) => {
      const bucket = index.get(row._id);
      if (bucket) bucket.visitors = row.count;
    });
    (postFacet?.series || []).forEach((row) => {
      const bucket = index.get(row?._id?.day);
      if (!bucket) return;
      const code = typeById.get(String(row?._id?.type));
      if (code === "LOST") bucket.lost += row.count;
      else if (code === "FOUND") bucket.found += row.count;
    });
    (postFacet?.resolvedSeries || []).forEach((row) => {
      const bucket = index.get(row._id);
      if (bucket) bucket.resolved = row.count;
    });
    (userFacet?.series || []).forEach((row) => {
      const bucket = index.get(row._id);
      if (bucket) bucket.users = row.count;
    });

    // Visitor.country/city default to the literal string 'Unknown' when the
    // lookup could not place a session, so those rows are labelled, not dropped:
    // "we do not know" is a real share of the traffic and hiding it would make
    // the named rows look like the whole picture.
    const namedCounts = (rows = []) =>
      rows
        .filter((row) => row?._id !== null && row?._id !== undefined && row?._id !== "")
        .map((row) => ({ label: String(row._id), count: row.count }));

    const visitorsWindow = facetCount(visitorFacet, "window");
    const visitorsPrior = facetCount(visitorFacet, "priorWindow");
    const postsWindow = facetCount(postFacet, "window");
    const postsPrior = facetCount(postFacet, "priorWindow");
    const usersWindow = facetCount(userFacet, "window");
    const usersPrior = facetCount(userFacet, "priorWindow");

    res.status(200).json({
      success: true,
      data: {
        days,
        rangeStart: seriesStart.toISOString(),
        visitors: {
          total: facetCount(visitorFacet, "total"),
          today: facetCount(visitorFacet, "today"),
          window: visitorsWindow,
          prior: visitorsPrior,
          change: percentChange(visitorsWindow, visitorsPrior),
          firstVisitDate: visitorFacet?.first?.[0]?.visitedAt || null,
        },
        posts: {
          window: postsWindow,
          prior: postsPrior,
          change: percentChange(postsWindow, postsPrior),
          totalViews: postFacet?.viewsTotal?.[0]?.n || 0,
        },
        users: {
          window: usersWindow,
          prior: usersPrior,
          change: percentChange(usersWindow, usersPrior),
        },
        series: dayList.map((day) => index.get(day)),
        geography: {
          countries: namedCounts(visitorFacet?.topCountries),
          cities: namedCounts(visitorFacet?.topCities),
        },
        landings: namedCounts(visitorFacet?.topLandings),
        mostViewed: (postFacet?.mostViewed || []).map((post) => ({
          id: String(post._id),
          description: post.description || "",
          views: post.views || 0,
          createdAt: post.createdAt,
          type: typeById.get(String(post.foundLost)) || null,
          city: localizedLabels(cityById.get(String(post.city))),
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error building admin analytics:", error);
    res.status(500).json({ success: false, message: "Error building admin analytics" });
  }
};

// @desc  The admin audit trail
// @route GET /admin/audit
// @access Private (Admin only)
const getAuditLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const [entries, total, actions] = await Promise.all([
      AdminAction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminAction.countDocuments(filter),
      // The filter's own options, derived from what has actually been recorded -
      // a hardcoded list would drift from the codes the services write.
      AdminAction.distinct("action"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        entries,
        actions: actions.sort(),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit) || 1,
          total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ success: false, message: "Error fetching audit log" });
  }
};

module.exports = {
  getAdminOverview,
  getAdminAnalytics,
  getAuditLog,
  // Exported for the offline check - the day-bucketing and the delta rule are
  // the parts worth testing without a database.
  buildDaySkeleton,
  percentChange,
  utcDayStart,
};
