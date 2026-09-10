const AdminAction = require("../models/AdminAction");
const User = require("../models/User");
const { logEvents } = require("../middleware/logger");

// Anything longer than this in a label or a meta string is a mistake upstream,
// not something worth storing: the audit list renders one line per row.
const MAX_LABEL = 160;

const trim = (value) => {
  if (value === null || value === undefined) return value;
  const text = String(value);
  return text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL - 1)}…` : text;
};

const trimMeta = (meta) => {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  Object.keys(meta).slice(0, 12).forEach((key) => {
    const value = meta[key];
    out[key] = typeof value === "string" ? trim(value) : value;
  });
  return out;
};

/**
 * Record one admin action.
 *
 * Never awaited on a request's critical path and never allowed to throw: an
 * audit write failing must not turn a successful deletion into a 500 for the
 * admin who just performed it. The file log runs alongside the database row so
 * a Mongo problem does not take the whole trail with it.
 *
 * @param {object} params
 * @param {string} params.actorId       the acting admin's id (req.user)
 * @param {string} params.action        stable code, e.g. 'post.delete'
 * @param {string} params.targetType    one of AdminAction's targetType enum
 * @param {string} [params.targetId]
 * @param {string} [params.targetLabel] human stand-in captured at action time
 * @param {object} [params.meta]
 */
const recordAdminAction = async ({
  actorId,
  action,
  targetType,
  targetId = null,
  targetLabel = "",
  meta = {},
} = {}) => {
  try {
    let actorName = "";
    if (actorId) {
      const actor = await User.findById(actorId).select("username").lean();
      actorName = actor?.username || "";
    }

    await AdminAction.create({
      actor: actorId || null,
      actorName,
      action,
      targetType,
      targetId: targetId || null,
      targetLabel: trim(targetLabel) || "",
      meta: trimMeta(meta),
    });

    await logEvents(
      `${actorName || actorId || "unknown"} ${action} ${targetType}:${targetId || "-"} ${trim(targetLabel) || ""}`.trim(),
      "adminActions.log"
    );
  } catch (error) {
    // Deliberately swallowed - see the doc comment above.
    console.error("Failed to record admin action:", error?.message || error);
  }
};

/**
 * Fire-and-forget wrapper. Call sites use this so the response is not held up
 * by a write nobody is waiting on.
 */
const scheduleAdminAction = (params) => {
  setImmediate(() => {
    recordAdminAction(params).catch(() => {});
  });
};

module.exports = { recordAdminAction, scheduleAdminAction, MAX_LABEL };
