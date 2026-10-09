const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const resilienceManager = require("../utils/resilienceManager");
const { getConnectionMetrics } = require("../config/resilientDbConn");
const { scheduleAdminAction } = require("../services/adminAudit");

const LOGS_DIR = path.join(__dirname, "..", "logs");
const ALLOWED_FILES = {
  errLog: "errLog.log",
  mongoErrLog: "mongoErrLog.log",
  reqLog: "reqLog.log",
};

/**
 * Parse one line from a log file.
 */
const parseLogLine = (line, index) => {
  if (!line || !line.trim()) return null;
  const parts = line.split("\t");

  let date = "";
  let time = "";
  let id = "";
  let message = "";
  let method = "";
  let url = "";
  let extra = "";

  if (parts.length >= 4 && /^\d{8}$/.test(parts[0])) {
    date = `${parts[0].slice(0, 4)}-${parts[0].slice(4, 6)}-${parts[0].slice(6, 8)}`;
    time = parts[1];
    id = parts[2];
    message = parts[3];
    method = parts[4] || "";
    url = parts[5] || "";
    extra = parts.slice(6).join("\t");
  } else if (parts.length >= 3) {
    date = parts[0];
    time = parts[1];
    message = parts.slice(2).join("\t");
    id = `log-${index}`;
  } else {
    message = line;
    id = `log-${index}`;
  }

  // Determine severity / tone
  const lowerMsg = `${message} ${method} ${url} ${extra}`.toLowerCase();
  let level = "info";
  if (
    lowerMsg.includes("error") ||
    lowerMsg.includes("failed") ||
    lowerMsg.includes("fail") ||
    lowerMsg.includes("enotfound") ||
    lowerMsg.includes("etimeout") ||
    lowerMsg.includes('status":5') ||
    lowerMsg.includes("status: 5") ||
    lowerMsg.includes("500") ||
    lowerMsg.includes("exception") ||
    lowerMsg.includes("reject")
  ) {
    level = "error";
  } else if (
    lowerMsg.includes("warn") ||
    lowerMsg.includes("slow request") ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes('status":4') ||
    lowerMsg.includes("status: 4") ||
    lowerMsg.includes("jwt")
  ) {
    level = "warn";
  }

  let parsedJson = null;
  const jsonMatch = message.match(/(\{.*\}|\[.*\])$/);
  if (jsonMatch) {
    try {
      parsedJson = JSON.parse(jsonMatch[0]);
    } catch (_) {}
  }

  return {
    id: id || `line-${index}`,
    date,
    time,
    timestamp: date && time ? `${date} ${time}` : date || time || "",
    message,
    method,
    url,
    extra,
    level,
    parsedJson,
    raw: line,
  };
};

/**
 * @desc Get real-time system health and service status
 * @route GET /admin/system/health
 * @access Private (Admin only)
 */
const getSystemHealth = async (req, res) => {
  try {
    const healthData = await resilienceManager.performHealthChecks().catch((err) => ({
      status: "degraded",
      services: { database: "unknown", redis: "unknown", cloudinary: "unknown" },
      error: err.message,
    }));

    const dbMetrics = typeof getConnectionMetrics === "function" ? getConnectionMetrics() : {};
    const resilienceMetrics = resilienceManager.getMetrics();
    const mem = process.memoryUsage();

    const response = {
      status: healthData.status || "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        database: {
          status: healthData.services?.database || "unknown",
          connectionState: dbMetrics.connectionState,
          metrics: {
            totalConnections: dbMetrics.totalConnections || 0,
            activeConnections: dbMetrics.activeConnections || 0,
            failedConnections: dbMetrics.failedConnections || 0,
            retryAttempts: dbMetrics.retryAttempts || 0,
          },
        },
        redis: {
          status: healthData.services?.redis || "unknown",
        },
        cloudinary: {
          status: healthData.services?.cloudinary || "unknown",
        },
      },
      resilience: {
        overallHealth: resilienceMetrics.overallHealth || "healthy",
        failures: resilienceMetrics.failures || 0,
        successes: resilienceMetrics.successes || 0,
        retries: resilienceMetrics.retries || 0,
        circuitBreakerTrips: resilienceMetrics.circuitBreakerTrips || 0,
        circuitBreakers: resilienceMetrics.circuitBreakers || {},
      },
      system: {
        memory: {
          rssMB: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
          heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
          heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        },
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching admin system health:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system health",
      error: error.message,
    });
  }
};

/**
 * @desc Get parsed error and system logs
 * @route GET /admin/system/logs
 * @access Private (Admin only)
 */
const getSystemLogs = async (req, res) => {
  try {
    const fileKey = ALLOWED_FILES[req.query.file] ? req.query.file : "errLog";
    const filename = ALLOWED_FILES[fileKey];
    const filePath = path.join(LOGS_DIR, filename);

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 10), 500);
    const search = (req.query.search || "").trim().toLowerCase();
    const levelFilter = (req.query.level || "").trim().toLowerCase();

    // Check available files & sizes
    const availableFiles = await Promise.all(
      Object.entries(ALLOWED_FILES).map(async ([key, name]) => {
        const p = path.join(LOGS_DIR, name);
        let size = 0;
        let exists = false;
        try {
          const stat = await fsPromises.stat(p);
          size = stat.size;
          exists = true;
        } catch (_) {}
        return { key, name, sizeBytes: size, exists };
      })
    );

    let entries = [];
    let fileSizeBytes = 0;
    let totalLinesInFile = 0;

    if (fs.existsSync(filePath)) {
      const stat = await fsPromises.stat(filePath);
      fileSizeBytes = stat.size;

      const content = await fsPromises.readFile(filePath, "utf-8");
      const lines = content.split(/\r?\n/).filter((l) => Boolean(l.trim()));
      totalLinesInFile = lines.length;

      // Iterate newest to oldest
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        // Routine token expiration is normal session lifecycle and does not disrupt the user.
        // Omit it from Application Errors (errLog) so administrators only see genuine errors.
        if (fileKey === "errLog" && (line.includes("TokenExpiredError") || line.includes("jwt expired"))) {
          continue;
        }
        if (search && !line.toLowerCase().includes(search)) {
          continue;
        }
        const parsed = parseLogLine(line, i);
        if (!parsed) continue;

        if (levelFilter && levelFilter !== "all" && parsed.level !== levelFilter) {
          continue;
        }

        entries.push(parsed);
        if (entries.length >= limit) break;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        file: fileKey,
        filename,
        fileSizeBytes,
        totalLinesInFile,
        count: entries.length,
        entries,
        availableFiles,
      },
    });
  } catch (error) {
    console.error("Error reading system logs:", error);
    res.status(500).json({
      success: false,
      message: "Error reading system logs",
      error: error.message,
    });
  }
};

/**
 * @desc Clear/truncate a specific log file
 * @route DELETE /admin/system/logs/:file
 * @access Private (Admin only)
 */
const clearSystemLogs = async (req, res) => {
  try {
    const fileKey = req.params.file;
    const filename = ALLOWED_FILES[fileKey];
    if (!filename) {
      return res.status(400).json({ success: false, message: "Invalid log file identifier" });
    }

    const filePath = path.join(LOGS_DIR, filename);
    await fsPromises.writeFile(filePath, "");

    // Audit trail
    scheduleAdminAction({
      actorId: req.user,
      action: "system.clear_logs",
      targetType: "system",
      targetLabel: filename,
      meta: { file: fileKey, timestamp: new Date().toISOString() },
    });

    res.status(200).json({
      success: true,
      message: `Log file ${filename} cleared successfully`,
    });
  } catch (error) {
    console.error("Error clearing log file:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing log file",
      error: error.message,
    });
  }
};

module.exports = {
  getSystemHealth,
  getSystemLogs,
  clearSystemLogs,
};
