import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { selectAuthPerformanceMetrics } from '../features/auth/authSelectors';

/**
 * Hook for monitoring authentication performance metrics
 * Provides insights into token validation performance, cache hits, etc.
 */
const useAuthPerformance = () => {
  const performanceMetrics = useSelector(selectAuthPerformanceMetrics);

  return useMemo(() => {
    const now = Date.now();
    const validationLatency = now - performanceMetrics.lastValidationTime;

    return {
      ...performanceMetrics,
      validationLatency,
      isPerformanceOptimal: performanceMetrics.cacheHit && validationLatency < 100,
      recommendations: generatePerformanceRecommendations(performanceMetrics, validationLatency)
    };
  }, [performanceMetrics]);
};

/**
 * Generate performance recommendations based on metrics
 */
const generatePerformanceRecommendations = (metrics, latency) => {
  const recommendations = [];

  if (!metrics.cacheHit) {
    recommendations.push({
      type: 'cache_miss',
      message: 'Token validation cache miss detected. Consider implementing more aggressive caching.',
      priority: 'medium'
    });
  }

  if (latency > 50) {
    recommendations.push({
      type: 'high_latency',
      message: `Token validation latency is high (${latency}ms). Consider optimizing validation logic.`,
      priority: 'high'
    });
  }

  if (metrics.refreshAttempts > 1) {
    recommendations.push({
      type: 'multiple_refresh_attempts',
      message: `Multiple refresh attempts (${metrics.refreshAttempts}). Consider implementing proactive refresh.`,
      priority: 'high'
    });
  }

  if (metrics.isRefreshing) {
    recommendations.push({
      type: 'active_refresh',
      message: 'Token refresh in progress. This may cause temporary performance degradation.',
      priority: 'low'
    });
  }

  return recommendations;
};

export default useAuthPerformance;
