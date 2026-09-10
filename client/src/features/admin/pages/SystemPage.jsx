import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BuildOutlined,
  StorageOutlined,
  HistoryOutlined,
  RefreshOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutlineOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetSystemSettingsQuery,
  useUpdateMaintenanceModeMutation,
} from '../systemSettingsApiSlice';
import { useGetDbMetricsQuery } from '../dbMetricsApiSlice';
import { useGetAdminAuditQuery } from '../adminApiSlice';
import {
  AdminCard,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PageHeader,
  SegmentedControl,
  StatusPill,
  adminTone,
  containedButtonSx,
  inputSx,
  switchSx,
  useAdminToast,
} from '../ui';
import { Meter } from '../charts';
import { formatDateTime, formatRelative } from '../adminFormat';

/**
 * The switches, the cluster, and who did what.
 *
 * Maintenance mode used to be a 600px card pinned above *every* tab in the
 * panel - the single most disruptive switch on the site, rendered as permanent
 * furniture on screens about reports and cities. It lives here now, where it is
 * the page's subject, and the Overview page carries a one-line banner when it
 * is on so nobody has to come looking.
 *
 * The database section is the same thresholds as before against the free
 * tier's ceilings, drawn as meters rather than four coloured boxes: a number
 * against a limit is a meter, and the limit is the part that was missing.
 *
 * The activity log is new. Every admin action - a deletion, a suspension, a
 * password reset, a maintenance toggle - now writes a row, so the panel can
 * answer "who did this" without anyone reading a log file off a container that
 * no longer exists.
 */

const AUDIT_ACTION_TONE = (action = '') => {
  if (action.endsWith('.delete') || action.includes('remove') || action.includes('deactivate')) {
    return 'critical';
  }
  if (action.includes('suspend') || action.includes('rejected')) return 'attention';
  if (action.includes('restore') || action.includes('activate') || action.includes('resolved')) {
    return 'positive';
  }
  return 'brand';
};

const MaintenanceSection = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();
  const { data, isLoading } = useGetSystemSettingsQuery();
  const [updateMaintenance, { isLoading: saving }] = useUpdateMaintenanceModeMutation();
  const maintenance = data?.data?.maintenanceMode;

  const [message, setMessage] = useState('');
  const [estimatedReturn, setEstimatedReturn] = useState('');
  const [confirmOn, setConfirmOn] = useState(false);

  useEffect(() => {
    if (maintenance) {
      setMessage(maintenance.message || '');
      setEstimatedReturn(maintenance.estimatedReturn || '');
    }
  }, [maintenance]);

  const apply = async (isActive) => {
    try {
      await updateMaintenance({
        isActive,
        message: message || undefined,
        estimatedReturn: estimatedReturn || undefined,
      }).unwrap();
      notify(isActive ? t('maintenanceEnabled') : t('maintenanceDisabled'), 'success');
      setConfirmOn(false);
    } catch (error) {
      notify(error?.message || t('genericActionError'), 'error');
    }
  };

  const saveCopy = async () => {
    try {
      await updateMaintenance({
        isActive: maintenance?.isActive,
        message,
        estimatedReturn,
      }).unwrap();
      notify(t('maintenanceSettingsSaved'), 'success');
    } catch (error) {
      notify(error?.message || t('genericActionError'), 'error');
    }
  };

  if (isLoading) return <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />;

  const isActive = Boolean(maintenance?.isActive);

  return (
    <>
      {/* The accent bar is the post card's, used here to mark the one state
          on this page that changes what the whole site does. */}
      <AdminCard
        sx={(theme) => ({
          ...(isActive
            ? { borderInlineStart: `6px solid ${theme.custom.status.pending.main}` }
            : null),
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, flexWrap: 'wrap' }}>
          <Box
            sx={(theme) => {
              const tone = adminTone(theme, isActive ? 'attention' : 'positive');
              return {
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: tone.bg,
                color: tone.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              };
            }}
          >
            <BuildOutlined sx={{ fontSize: 21 }} />
          </Box>

          <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
            <Typography
              sx={(theme) => ({
                fontFamily: theme.custom.font.display,
                fontWeight: 700,
                fontSize: '1.05rem',
                color: theme.custom.color.ink,
              })}
            >
              {t('maintenanceMode')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isActive ? t('maintenanceOnBody') : t('maintenanceOffBody')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <StatusPill
              tone={isActive ? 'attention' : 'positive'}
              label={isActive ? t('maintenanceOn') : t('maintenanceOff')}
              icon={isActive ? WarningAmberOutlined : CheckCircleOutline}
            />
            <Switch
              checked={isActive}
              disabled={saving}
              onChange={() => (isActive ? apply(false) : setConfirmOn(true))}
              inputProps={{ 'aria-label': t('maintenanceMode') }}
              sx={switchSx('attention')}
            />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 500))}
              label={t('maintenanceMessage')}
              placeholder={t('maintenanceMessagePlaceholder')}
              helperText={`${message.length}/500`}
              disabled={saving}
              sx={inputSx}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              value={estimatedReturn}
              onChange={(event) => setEstimatedReturn(event.target.value.slice(0, 100))}
              label={t('estimatedReturn')}
              placeholder={t('estimatedReturnPlaceholder')}
              helperText={t('estimatedReturnHint')}
              disabled={saving}
              sx={inputSx}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {maintenance?.lastUpdatedAt
              ? t('lastChangedBy', {
                  name: maintenance.lastUpdatedBy || t('unknown'),
                  time: formatDateTime(maintenance.lastUpdatedAt, currentLanguage),
                })
              : t('neverChanged')}
          </Typography>
          <Button
            variant="contained"
            disableElevation
            onClick={saveCopy}
            disabled={saving || !message.trim()}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveOutlined />}
            sx={containedButtonSx('brand')}
          >
            {t('save')}
          </Button>
        </Box>
      </AdminCard>

      <ConfirmDialog
        open={confirmOn}
        onClose={() => setConfirmOn(false)}
        onConfirm={() => apply(true)}
        tone="attention"
        title={t('enableMaintenanceTitle')}
        description={t('enableMaintenanceBody')}
        confirmLabel={t('enableMaintenance')}
        isLoading={saving}
      />
    </>
  );
};

const DatabaseSection = () => {
  const { t } = useTranslation();
  const { data, isFetching, error, refetch } = useGetDbMetricsQuery();

  const metrics = data?.data || {};
  const storageMB = metrics.storageMB || 0;
  const dataMB = metrics.dataMB || 0;
  const connections = metrics.connections || 0;
  const ops = metrics.opsPerSec || {};
  const totalOps =
    (ops.insert || 0) + (ops.query || 0) + (ops.update || 0) + (ops.delete || 0) + (ops.command || 0);
  const p95 = Math.round(metrics.p95LatencyMs || 0);

  // Free-tier ceilings. Same thresholds the old tab used, kept because they are
  // the ones the deployment is actually judged against - they are just drawn as
  // a value against a limit now, which is what they always were.
  const toneOf = (value, warn, danger) =>
    value >= danger ? 'critical' : value >= warn ? 'attention' : 'positive';

  const rows = [
    {
      key: 'storage',
      label: t('storageUsage'),
      value: storageMB,
      max: 512,
      valueLabel: `${storageMB.toFixed(1)} MB / 512 MB`,
      tone: toneOf(storageMB, 450, 500),
      hint: t('storageHint', { data: dataMB.toFixed(1) }),
    },
    {
      key: 'connections',
      label: t('activeConnections'),
      value: connections,
      max: 100,
      valueLabel: `${connections} / 100`,
      tone: toneOf(connections, 50, 80),
      hint: t('connectionsHint'),
    },
    {
      key: 'latency',
      label: t('p95Latency'),
      value: p95,
      max: 500,
      valueLabel: `${p95} ms`,
      tone: toneOf(p95, 200, 400),
      hint: t('latencyHint'),
    },
    {
      key: 'throughput',
      label: t('throughputOps'),
      value: totalOps,
      max: 120,
      valueLabel: t('opsPerSecond', { value: totalOps.toFixed(1) }),
      tone: toneOf(totalOps, 50, 100),
      hint: `${t('opsBreakdown', {
        insert: (ops.insert || 0).toFixed(1),
        query: (ops.query || 0).toFixed(1),
        update: (ops.update || 0).toFixed(1),
        remove: (ops.delete || 0).toFixed(1),
      })}`,
    },
  ];

  const severity = { positive: 0, attention: 1, critical: 2 };
  const worst = rows.reduce(
    (acc, row) => (severity[row.tone] > severity[acc] ? row.tone : acc),
    'positive'
  );

  if (error) {
    return (
      <AdminCard padding={false}>
        <EmptyState
          icon={StorageOutlined}
          title={t('errorLoadingMetrics')}
          description={error?.data?.message || error?.message}
        />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          mb: 2.5,
          flexWrap: 'wrap',
        }}
      >
        <StatusPill
          tone={worst}
          label={
            worst === 'positive'
              ? t('dbHealthy')
              : worst === 'attention'
              ? t('dbWatch')
              : t('dbSwitchNow')
          }
          icon={
            worst === 'positive'
              ? CheckCircleOutline
              : worst === 'attention'
              ? WarningAmberOutlined
              : ErrorOutlineOutlined
          }
        />
        <Box sx={{ marginInlineStart: 'auto' }}>
          <Tooltip title={t('refresh')}>
            <IconButton size="small" onClick={refetch} aria-label={t('refresh')}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isFetching && !data ? (
        <Skeleton variant="rounded" height={200} />
      ) : (
        <Grid container spacing={{ xs: 2.5, sm: 3 }}>
          {rows.map((row) => (
            <Grid item xs={12} sm={6} key={row.key}>
              <Meter
                label={row.label}
                value={row.value}
                max={row.max}
                tone={row.tone}
                valueLabel={row.valueLabel}
                hint={row.hint}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </AdminCard>
  );
};

const AuditSection = () => {
  const { t, currentLanguage } = useTranslation();
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');

  const { data, isFetching, error } = useGetAdminAuditQuery({
    page: page + 1,
    limit: 20,
    action: action || undefined,
  });

  const columns = useMemo(
    () => [
      {
        id: 'action',
        label: t('action'),
        primary: true,
        render: (entry) => (
          <Box sx={{ minWidth: 0 }}>
            <StatusPill
              size="sm"
              tone={AUDIT_ACTION_TONE(entry.action)}
              label={t(`auditAction_${entry.action}`) === `auditAction_${entry.action}`
                ? entry.action
                : t(`auditAction_${entry.action}`)}
            />
            {entry.targetLabel ? (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: theme.custom.color.ink,
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                })}
              >
                {entry.targetLabel}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        id: 'actor',
        label: t('performedBy'),
        render: (entry) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {entry.actorName || t('unknown')}
          </Typography>
        ),
      },
      {
        id: 'target',
        label: t('targetType'),
        hideBelow: 'lg',
        render: (entry) => (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t(`targetType_${entry.targetType}`)}
          </Typography>
        ),
      },
      {
        id: 'when',
        label: t('date'),
        render: (entry) => (
          <Tooltip title={formatDateTime(entry.createdAt, currentLanguage)}>
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {formatRelative(entry.createdAt, currentLanguage, t)}
            </Typography>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  return (
    <>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {t('auditRetentionHint')}
      </Typography>

      {data?.data?.actions?.length ? (
        <Box sx={{ mb: 2 }}>
          <SegmentedControl
            size="sm"
            ariaLabel={t('action')}
            value={action}
            onChange={(value) => {
              setAction(value);
              setPage(0);
            }}
            options={[
              { value: '', label: t('allActions') },
              ...data.data.actions.slice(0, 7).map((value) => ({
                value,
                label:
                  t(`auditAction_${value}`) === `auditAction_${value}`
                    ? value
                    : t(`auditAction_${value}`),
              })),
            ]}
          />
        </Box>
      ) : null}

      <DataTable
        columns={columns}
        rows={data?.data?.entries || []}
        isLoading={isFetching}
        error={error ? error?.data?.message || t('genericLoadError') : null}
        dense
        emptyState={
          <EmptyState
            icon={HistoryOutlined}
            title={t('noAuditEntries')}
            description={t('noAuditEntriesBody')}
          />
        }
        pagination={{
          page,
          rowsPerPage: 20,
          count: data?.data?.pagination?.total || 0,
          onPageChange: setPage,
        }}
      />
    </>
  );
};

const SystemPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = ['database', 'activity'].includes(searchParams.get('view'))
    ? searchParams.get('view')
    : 'maintenance';

  const setView = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'maintenance') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupSystem')}
        title={t('adminNavSystem')}
        description={t('adminNavSystemDescription')}
        actions={
          <SegmentedControl
            ariaLabel={t('adminNavSystem')}
            value={view}
            onChange={setView}
            options={[
              { value: 'maintenance', label: t('maintenanceMode'), icon: BuildOutlined },
              { value: 'database', label: t('database'), icon: StorageOutlined },
              { value: 'activity', label: t('activityLog'), icon: HistoryOutlined },
            ]}
          />
        }
      />

      {view === 'maintenance' ? <MaintenanceSection /> : null}
      {view === 'database' ? <DatabaseSection /> : null}
      {view === 'activity' ? <AuditSection /> : null}
    </>
  );
};

export default SystemPage;
