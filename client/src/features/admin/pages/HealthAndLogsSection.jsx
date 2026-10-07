import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  DnsOutlined,
  StorageOutlined,
  CloudQueueOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutlineOutlined,
  RefreshOutlined,
  DeleteOutline,
  SearchOutlined,
  ContentCopyOutlined,
  CheckOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  TerminalOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetSystemHealthQuery,
  useGetSystemLogsQuery,
  useClearSystemLogsMutation,
} from '../adminApiSlice';
import {
  AdminCard,
  ConfirmDialog,
  EmptyState,
  SegmentedControl,
  StatusPill,
  adminTone,
  containedButtonSx,
  inputSx,
  useAdminToast,
} from '../ui';
import { formatDateTime } from '../adminFormat';

/**
 * Format uptime seconds into human readable duration
 */
const formatUptime = (seconds = 0) => {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 && d === 0) parts.push(`${m}m`);
  if (parts.length === 0 || (s > 0 && d === 0 && h === 0)) parts.push(`${s}s`);
  return parts.join(' ');
};

/**
 * Format bytes to readable size
 */
const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const LOG_LEVEL_TONES = {
  error: 'critical',
  warn: 'attention',
  slow: 'brand',
  info: 'positive',
};

const HealthAndLogsSection = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();

  // State
  const [activeFile, setActiveFile] = useState('errLog');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [limit, setLimit] = useState(100);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Queries
  const {
    data: healthRes,
    isFetching: isFetchingHealth,
    error: healthError,
    refetch: refetchHealth,
  } = useGetSystemHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const {
    data: logsRes,
    isFetching: isFetchingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useGetSystemLogsQuery({
    file: activeFile,
    limit,
    search: searchTerm,
    level: levelFilter === 'all' ? undefined : levelFilter,
  });

  const [clearLogs, { isLoading: isClearing }] = useClearSystemLogsMutation();

  const health = healthRes?.data;
  const logsData = logsRes?.data;
  const entries = useMemo(() => logsData?.entries || [], [logsData?.entries]);

  // Overall health tone
  const healthTone = useMemo(() => {
    if (healthError) return 'critical';
    if (!health) return 'neutral';
    if (health.status === 'healthy') return 'positive';
    if (health.status === 'degraded') return 'attention';
    return 'critical';
  }, [health, healthError]);

  const handleCopy = (entry) => {
    const textToCopy = entry.parsedJson
      ? JSON.stringify(entry.parsedJson, null, 2)
      : entry.raw;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedId(entry.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === entry.id ? null : prev));
    }, 2000);
  };

  const handleClearLogs = async () => {
    try {
      await clearLogs(activeFile).unwrap();
      notify(t('logClearedSuccess'), 'success');
      setClearConfirmOpen(false);
      refetchLogs();
    } catch (err) {
      notify(err?.data?.message || err?.message || t('genericActionError'), 'error');
    }
  };

  // Find file size for current selected file
  const currentFileSize = useMemo(() => {
    const fileObj = (logsData?.availableFiles || []).find((f) => f.key === activeFile);
    return fileObj ? formatFileSize(fileObj.sizeBytes) : '—';
  }, [logsData?.availableFiles, activeFile]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Infrastructure & Server Health Card */}
      <AdminCard>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <StatusPill
              tone={healthTone}
              label={
                healthError
                  ? t('systemUnhealthy')
                  : health?.status === 'healthy'
                  ? t('allHealthy')
                  : health?.status === 'degraded'
                  ? t('systemDegraded')
                  : t('systemUnhealthy')
              }
              icon={
                healthTone === 'positive'
                  ? CheckCircleOutline
                  : healthTone === 'attention'
                  ? WarningAmberOutlined
                  : ErrorOutlineOutlined
              }
            />
            {health?.timestamp && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDateTime(health.timestamp, currentLanguage)}
              </Typography>
            )}
          </Box>

          <Tooltip title={t('refresh')}>
            <IconButton
              size="small"
              onClick={refetchHealth}
              disabled={isFetchingHealth}
              aria-label={t('refresh')}
            >
              <RefreshOutlined
                fontSize="small"
                sx={{
                  animation: isFetchingHealth ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        {healthError ? (
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.palette.error.main, 0.08),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            })}
          >
            <ErrorOutlineOutlined color="error" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                {t('systemUnhealthy')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {healthError?.data?.message || healthError?.message || 'Server is not responding. The API server may be offline or restarting.'}
              </Typography>
            </Box>
          </Box>
        ) : isFetchingHealth && !health ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((k) => (
              <Grid item xs={12} sm={6} md={3} key={k}>
                <Skeleton variant="rounded" height={88} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {/* Server Uptime & Node Runtime */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  height: '100%',
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.03),
                  border: `1px solid ${theme.custom.color.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {t('systemUptime')}
                  </Typography>
                </Box>
                <Typography
                  sx={(theme) => ({
                    fontFamily: theme.custom.font.display,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: theme.custom.color.ink,
                  })}
                >
                  {formatUptime(health?.uptimeSeconds)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 'auto' }}>
                  {health?.system?.nodeVersion} · {health?.system?.platform} ({health?.system?.environment})
                </Typography>
              </Box>
            </Grid>

            {/* Heap & RSS Memory */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  height: '100%',
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.03),
                  border: `1px solid ${theme.custom.color.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {t('memoryUsage')}
                  </Typography>
                </Box>
                <Typography
                  sx={(theme) => ({
                    fontFamily: theme.custom.font.display,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: theme.custom.color.ink,
                  })}
                >
                  {health?.system?.memory?.heapUsedMB} MB
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 'auto' }}>
                  RSS: {health?.system?.memory?.rssMB} MB · Total: {health?.system?.memory?.heapTotalMB} MB
                </Typography>
              </Box>
            </Grid>

            {/* MongoDB Connection Status */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  height: '100%',
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.03),
                  border: `1px solid ${theme.custom.color.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DnsOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {t('database')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={(theme) => ({
                      fontFamily: theme.custom.font.display,
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color:
                        health?.services?.database?.status === 'healthy'
                          ? 'success.main'
                          : 'error.main',
                    })}
                  >
                    {health?.services?.database?.status === 'healthy'
                      ? t('dbHealthy')
                      : t('systemUnhealthy')}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 'auto' }}>
                  {health?.services?.database?.metrics?.activeConnections || 0} active · {health?.services?.database?.metrics?.failedConnections || 0} failed
                </Typography>
              </Box>
            </Grid>

            {/* Redis & Cloudinary */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  height: '100%',
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.03),
                  border: `1px solid ${theme.custom.color.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudQueueOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Services
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Redis:
                  </Typography>
                  <StatusPill
                    size="sm"
                    tone={health?.services?.redis?.status === 'healthy' ? 'positive' : 'attention'}
                    label={health?.services?.redis?.status === 'healthy' ? 'OK' : 'Degraded'}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Media:
                  </Typography>
                  <StatusPill
                    size="sm"
                    tone={health?.services?.cloudinary?.status === 'healthy' ? 'positive' : 'attention'}
                    label={health?.services?.cloudinary?.status === 'healthy' ? 'OK' : 'Degraded'}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </AdminCard>

      {/* 2. Error and Server Log Viewer Card */}
      <AdminCard>
        {/* Top Controls: File Selector & Badges */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <SegmentedControl
              size="sm"
              ariaLabel={t('logFile')}
              value={activeFile}
              onChange={(val) => {
                setActiveFile(val);
                setExpandedLogId(null);
              }}
              options={[
                { value: 'errLog', label: t('appErrorLogs') },
                { value: 'mongoErrLog', label: t('mongoErrorLogs') },
                { value: 'reqLog', label: t('requestLogs') },
              ]}
            />

            <Chip
              size="small"
              variant="outlined"
              label={`${currentFileSize} · ${t('linesCount', { count: logsData?.count || 0 })}`}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={t('refresh')}>
              <IconButton
                size="small"
                onClick={refetchLogs}
                disabled={isFetchingLogs}
                aria-label={t('refresh')}
              >
                <RefreshOutlined
                  fontSize="small"
                  sx={{
                    animation: isFetchingLogs ? 'spin 1s linear infinite' : 'none',
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteOutline />}
              onClick={() => setClearConfirmOpen(true)}
              disabled={isClearing || entries.length === 0}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              {t('clearLogFile')}
            </Button>
          </Box>
        </Box>

        {/* Filter and Search Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 2.5,
          }}
        >
          <TextField
            size="small"
            placeholder={t('searchLogsPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: '1 1 240px', minWidth: 200, ...inputSx }}
          />

          <SegmentedControl
            size="sm"
            ariaLabel="Log level"
            value={levelFilter}
            onChange={setLevelFilter}
            options={[
              { value: 'all', label: t('allLogLevels') },
              { value: 'error', label: t('logLevelError') },
              { value: 'warn', label: t('logLevelWarn') },
              { value: 'slow', label: t('logLevelSlow') },
              { value: 'info', label: t('logLevelInfo') },
            ]}
          />

          <SegmentedControl
            size="sm"
            ariaLabel="Limit"
            value={String(limit)}
            onChange={(v) => setLimit(Number(v))}
            options={[
              { value: '50', label: '50' },
              { value: '100', label: '100' },
              { value: '200', label: '200' },
            ]}
          />
        </Box>

        {/* Logs Stream / List */}
        {isFetchingLogs && !logsData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3, 4, 5].map((k) => (
              <Skeleton key={k} variant="rounded" height={60} sx={{ borderRadius: 1.5 }} />
            ))}
          </Box>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={TerminalOutlined}
            title={t('noLogsFound')}
            description={t('noLogsFoundBody')}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {entries.map((entry) => {
              const tone = LOG_LEVEL_TONES[entry.level] || 'neutral';
              const isExpanded = expandedLogId === entry.id;
              const hasExtra = Boolean(entry.parsedJson || entry.extra);

              return (
                <Box
                  key={entry.id}
                  sx={(theme) => {
                    const resolvedTone = adminTone(theme, tone);
                    return {
                      p: 1.5,
                      borderRadius: `${theme.custom.radius.sm}px`,
                      border: `1px solid ${theme.custom.color.line}`,
                      borderInlineStart: `4px solid ${resolvedTone.main}`,
                      backgroundColor: isExpanded
                        ? alpha(resolvedTone.bg, 0.4)
                        : theme.palette.background.paper,
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        backgroundColor: alpha(resolvedTone.bg, 0.25),
                      },
                    };
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.25,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Level Pill */}
                    <StatusPill
                      size="sm"
                      tone={tone}
                      label={entry.level.toUpperCase()}
                    />

                    {/* Timestamp */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        alignSelf: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.timestamp || entry.date}
                    </Typography>

                    {/* Method & URL if present */}
                    {entry.method && (
                      <Chip
                        size="small"
                        label={`${entry.method} ${entry.url}`}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          height: 22,
                          backgroundColor: (theme) => alpha(theme.custom.color.ink, 0.06),
                          color: 'text.primary',
                          maxWidth: 320,
                        }}
                      />
                    )}

                    {/* Actions: Details toggle and Copy */}
                    <Box sx={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {hasExtra && (
                        <Button
                          size="small"
                          onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                          endIcon={isExpanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.25,
                            px: 1,
                            minHeight: 0,
                          }}
                        >
                          {t('rawPayload')}
                        </Button>
                      )}

                      <Tooltip title={copiedId === entry.id ? 'Copied!' : t('copyLogLine')}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(entry)}
                          aria-label={t('copyLogLine')}
                        >
                          {copiedId === entry.id ? (
                            <CheckOutlined fontSize="small" color="success" />
                          ) : (
                            <ContentCopyOutlined fontSize="small" sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Log Message */}
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                    }}
                  >
                    {entry.message}
                  </Typography>

                  {/* Expandable JSON / Extra block */}
                  {hasExtra && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box
                        sx={(theme) => ({
                          mt: 1.5,
                          p: 1.5,
                          borderRadius: `${theme.custom.radius.sm}px`,
                          backgroundColor:
                            theme.palette.mode === 'dark' ? '#0d1117' : '#1e293b',
                          color: '#e2e8f0',
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          overflowX: 'auto',
                          maxHeight: 300,
                        })}
                      >
                        {entry.parsedJson ? (
                          <pre style={{ margin: 0 }}>
                            {JSON.stringify(entry.parsedJson, null, 2)}
                          </pre>
                        ) : (
                          <pre style={{ margin: 0 }}>{entry.extra || entry.raw}</pre>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </AdminCard>

      {/* Confirmation Dialog to Clear Log File */}
      <ConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearLogs}
        tone="critical"
        title={t('clearLogConfirmTitle')}
        description={t('clearLogConfirmBody')}
        confirmLabel={t('clearLogFile')}
        isLoading={isClearing}
      />
    </Box>
  );
};

export default HealthAndLogsSection;
