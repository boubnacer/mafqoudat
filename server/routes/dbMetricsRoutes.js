const express = require('express');
const router = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');
const verifyJWT = require('../middleware/verifyJWT');
const mongoose = require('mongoose');
const { getConnectionMetrics } = require('../config/resilientDbConn');

// Simple in-memory sampler for ops/sec
let lastSample = {
  time: 0,
  opcounters: null
};

const computeOpsPerSec = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ serverStatus: 1 });
    const now = Date.now();
    let opsPerSec = {
      insert: 0,
      query: 0,
      update: 0,
      delete: 0,
      command: 0
    };
    if (lastSample.opcounters && lastSample.time) {
      const dt = Math.max(1, (now - lastSample.time) / 1000);
      opsPerSec = {
        insert: Math.max(0, (status.opcounters.insert - lastSample.opcounters.insert) / dt),
        query: Math.max(0, (status.opcounters.query - lastSample.opcounters.query) / dt),
        update: Math.max(0, (status.opcounters.update - lastSample.opcounters.update) / dt),
        delete: Math.max(0, (status.opcounters.delete - lastSample.opcounters.delete) / dt),
        command: Math.max(0, (status.opcounters.command - lastSample.opcounters.command) / dt)
      };
    }
    lastSample = { time: now, opcounters: { ...status.opcounters } };
    return { opsPerSec, connections: status.connections?.current || 0 };
  } catch (e) {
    return { opsPerSec: null, connections: 0 };
  }
};

// GET /db-metrics/summary (Admin only)
router.get('/summary', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    if (!mongoose.connection?.db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const admin = mongoose.connection.db.admin();
    const [dbStats, perf] = await Promise.all([
      mongoose.connection.db.command({ dbStats: 1, scale: 1 }),
      computeOpsPerSec()
    ]);

    const connMetrics = getConnectionMetrics();

    const storageMB = (dbStats.storageSize || 0) / (1024 * 1024);
    const dataMB = (dbStats.dataSize || 0) / (1024 * 1024);
    const collections = dbStats.collections || 0;
    const objects = dbStats.objects || 0;
    const connections = perf.connections || 0;
    const opsPerSec = perf.opsPerSec || { insert: 0, query: 0, update: 0, delete: 0, command: 0 };

    // p95 latency placeholder from connection metrics (client can compute better if instrumented)
    const p95LatencyMs = connMetrics?.resilienceMetrics?.latency?.p95 || 0;

    res.json({
      success: true,
      data: {
        storageMB,
        dataMB,
        collections,
        objects,
        connections,
        opsPerSec,
        p95LatencyMs,
        connectionState: connMetrics.connectionState,
        uptimeMs: connMetrics.uptime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching DB metrics:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch DB metrics' });
  }
});

module.exports = router;


