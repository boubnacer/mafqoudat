#!/bin/bash
# Production startup script with optimized settings

export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
export NODE_NO_WARNINGS=1

echo "🚀 Starting production server with memory optimizations..."
echo "📊 Memory limit: 512MB"
echo "🧹 Garbage collection: Enabled"
echo "⚠️ Deprecation warnings: Suppressed"

node server.js
