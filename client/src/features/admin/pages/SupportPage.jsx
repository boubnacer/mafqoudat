import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Typography, alpha } from '@mui/material';
import {
  MailOutlineOutlined,
  LockResetOutlined,
  CheckCircleOutline,
  DeleteOutline,
  VisibilityOutlined,
  BlockOutlined,
  ContentCopyOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetContactsAdminQuery,
  useGetContactStatsQuery,
  useUpdateContactStatusMutation,
  useDeleteContactAdminMutation,
  useGetPasswordResetRequestsQuery,
  useUpdatePasswordResetRequestStatusMutation,
} from '../adminApiSlice';
import {
  AdminDialog,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FieldRow,
  FilterBar,
  PageHeader,
  SegmentedControl,
  StatusPill,
  actionButtonSx,
  containedButtonSx,
  noteFieldSx,
  quietButtonSx,
  useAdminToast,
} from '../ui';
import { formatDateTime, formatRelative, truncate } from '../adminFormat';
import { useAdminOverview } from '../AdminLayout';

/**
 * One inbox for the two things a person can ask a human for: a message through
 * the contact form, and help getting back into an account.
 *
 * They were two separate tabs, which is one more destination than either
 * deserves - both are a queue of requests with a status, both are cleared by an
 * admin replying out of band, and neither is busy. Folding them together also
 * put the password-reset queue next to the tool that answers it: the reset
 * itself is done from Users, and the row here links straight at the search that
 * finds the account.
 */
const SupportPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();
  const { overview } = useAdminOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get('view') === 'resets' ? 'resets' : 'messages';
  const setView = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'messages') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  /* ------------------------------------------------------------ messages */
  const [messagePage, setMessagePage] = useState(0);
  const [messageRows, setMessageRows] = useState(10);
  const [messageFilters, setMessageFilters] = useState({ search: '', status: '', priority: '' });
  const [openMessage, setOpenMessage] = useState(null);
  const [reply, setReply] = useState('');
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState(null);

  const {
    data: contactsData,
    isFetching: contactsFetching,
    error: contactsError,
  } = useGetContactsAdminQuery(
    {
      page: messagePage + 1,
      limit: messageRows,
      search: messageFilters.search || undefined,
      status: messageFilters.status || undefined,
      priority: messageFilters.priority || undefined,
    },
    { skip: view !== 'messages' }
  );
  const { data: contactStats } = useGetContactStatsQuery(undefined, { skip: view !== 'messages' });

  /* -------------------------------------------------------------- resets */
  const [resetPage, setResetPage] = useState(0);
  const [resetRows, setResetRows] = useState(10);
  const [resetStatus, setResetStatus] = useState('pending');
  const [openReset, setOpenReset] = useState(null);
  const [resetNotes, setResetNotes] = useState('');

  const {
    data: resetsData,
    isFetching: resetsFetching,
    error: resetsError,
  } = useGetPasswordResetRequestsQuery(
    { page: resetPage + 1, limit: resetRows, status: resetStatus || undefined },
    { skip: view !== 'resets' }
  );

  const [updateContact] = useUpdateContactStatusMutation();
  const [deleteContact, { isLoading: deletingContact }] = useDeleteContactAdminMutation();
  const [updateReset] = useUpdatePasswordResetRequestStatusMutation();

  const setContactStatus = async (contact, status, response) => {
    try {
      await updateContact({ contactId: contact._id, status, response }).unwrap();
      notify(t('messageUpdated'), 'success');
      setOpenMessage(null);
      setReply('');
    } catch (error) {
      notify(error?.data?.message || t('genericActionError'), 'error');
    }
  };

  const setResetStatusFor = async (request, status) => {
    try {
      await updateReset({ requestId: request._id, status, adminNotes: resetNotes }).unwrap();
      notify(t('resetRequestUpdated'), 'success');
      setOpenReset(null);
      setResetNotes('');
    } catch (error) {
      notify(error?.data?.message || t('genericActionError'), 'error');
    }
  };

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(t('copiedToClipboard'), 'success');
    } catch (error) {
      // Clipboard access is denied in some contexts; the value is on screen
      // either way, so this is not worth an error toast.
    }
  };

  const messageColumns = useMemo(
    () => [
      {
        id: 'subject',
        label: t('subject'),
        primary: true,
        maxWidth: 320,
        render: (contact) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({
                fontWeight: 700,
                color: theme.custom.color.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              })}
            >
              {contact.subject}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {truncate(contact.message, 110)}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'from',
        label: t('from'),
        render: (contact) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({ color: theme.custom.color.ink, fontWeight: 600 })}
            >
              {contact.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                maxWidth: 200,
              }}
            >
              {contact.email}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'priority',
        label: t('priority'),
        hideBelow: 'lg',
        render: (contact) => (
          <StatusPill state={contact.priority} label={t(`priority_${contact.priority}`)} />
        ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (contact) => (
          <StatusPill state={contact.status} label={t(`contactStatus_${contact.status}`)} />
        ),
      },
      {
        id: 'received',
        label: t('received'),
        render: (contact) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatRelative(contact.createdAt, currentLanguage, t)}
          </Typography>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  const resetColumns = useMemo(
    () => [
      {
        id: 'contactInfo',
        label: t('contactInfoLabel'),
        primary: true,
        render: (request) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({
                fontWeight: 700,
                color: theme.custom.color.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              })}
            >
              {request.contactInfo}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (request) => <StatusPill state={request.status} label={t(request.status)} />,
      },
      {
        id: 'requestedAt',
        label: t('requestedAt'),
        render: (request) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatRelative(request.createdAt, currentLanguage, t)}
          </Typography>
        ),
      },
      {
        id: 'processedBy',
        label: t('processedBy'),
        hideBelow: 'lg',
        render: (request) => (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {request.processedBy?.username || '—'}
          </Typography>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupOperations')}
        title={t('adminNavSupport')}
        description={t('adminNavSupportDescription')}
        actions={
          <SegmentedControl
            ariaLabel={t('adminNavSupport')}
            value={view}
            onChange={setView}
            options={[
              {
                value: 'messages',
                label: t('contactSubmissions'),
                icon: MailOutlineOutlined,
                count: overview?.queues?.contacts || 0,
              },
              {
                value: 'resets',
                label: t('passwordResetRequests'),
                icon: LockResetOutlined,
                count: overview?.queues?.resetRequests || 0,
              },
            ]}
          />
        }
      />

      {view === 'messages' ? (
        <>
          <FilterBar
            search={{
              value: messageFilters.search,
              onChange: (value) => {
                setMessageFilters((current) => ({ ...current, search: value }));
                setMessagePage(0);
              },
              placeholder: t('searchMessages'),
            }}
            selects={[
              {
                id: 'status',
                label: t('filterByStatus'),
                value: messageFilters.status,
                onChange: (value) => {
                  setMessageFilters((current) => ({ ...current, status: value }));
                  setMessagePage(0);
                },
                options: [
                  { value: '', label: t('allStatuses') },
                  { value: 'new', label: t('contactStatus_new') },
                  { value: 'in_progress', label: t('contactStatus_in_progress') },
                  { value: 'resolved', label: t('contactStatus_resolved') },
                  { value: 'closed', label: t('contactStatus_closed') },
                ],
              },
              {
                id: 'priority',
                label: t('priority'),
                width: 150,
                value: messageFilters.priority,
                onChange: (value) => {
                  setMessageFilters((current) => ({ ...current, priority: value }));
                  setMessagePage(0);
                },
                options: [
                  { value: '', label: t('allPriorities') },
                  { value: 'urgent', label: t('priority_urgent') },
                  { value: 'high', label: t('priority_high') },
                  { value: 'medium', label: t('priority_medium') },
                  { value: 'low', label: t('priority_low') },
                ],
              },
            ]}
            onClear={() => {
              setMessageFilters({ search: '', status: '', priority: '' });
              setMessagePage(0);
            }}
            hasActiveFilters={Boolean(
              messageFilters.search || messageFilters.status || messageFilters.priority
            )}
          />

          <DataTable
            columns={messageColumns}
            rows={contactsData?.data?.contacts || []}
            isLoading={contactsFetching}
            error={contactsError ? contactsError?.data?.message || t('genericLoadError') : null}
            onRowClick={(contact) => {
              setOpenMessage(contact);
              setReply(contact.response || '');
            }}
            emptyState={
              <EmptyState tone="positive" icon={CheckCircleOutline} title={t('noMessagesFound')} />
            }
            renderActions={(contact) => (
              <>
                <Button
                  size="small"
                  startIcon={<VisibilityOutlined />}
                  onClick={() => {
                    setOpenMessage(contact);
                    setReply(contact.response || '');
                  }}
                  sx={actionButtonSx('brand')}
                >
                  {t('open')}
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteOutline />}
                  onClick={() => setConfirmDeleteMessage(contact)}
                  sx={actionButtonSx('critical')}
                >
                  {t('delete')}
                </Button>
              </>
            )}
            pagination={{
              page: messagePage,
              rowsPerPage: messageRows,
              count:
                contactsData?.data?.pagination?.totalContacts ||
                contactsData?.data?.pagination?.total ||
                contactStats?.data?.total ||
                0,
              onPageChange: setMessagePage,
              onRowsPerPageChange: (value) => {
                setMessageRows(value);
                setMessagePage(0);
              },
            }}
          />
        </>
      ) : (
        <>
          <FilterBar
            selects={[
              {
                id: 'resetStatus',
                label: t('filterByStatus'),
                value: resetStatus,
                onChange: (value) => {
                  setResetStatus(value);
                  setResetPage(0);
                },
                options: [
                  { value: '', label: t('allStatuses') },
                  { value: 'pending', label: t('pending') },
                  { value: 'processed', label: t('processed') },
                  { value: 'rejected', label: t('rejected') },
                ],
              },
            ]}
            onClear={() => {
              setResetStatus('');
              setResetPage(0);
            }}
            hasActiveFilters={Boolean(resetStatus)}
          />

          <DataTable
            columns={resetColumns}
            rows={resetsData?.data?.resetRequests || []}
            isLoading={resetsFetching}
            error={resetsError ? resetsError?.data?.message || t('genericLoadError') : null}
            onRowClick={(request) => {
              setOpenReset(request);
              setResetNotes(request.adminNotes || '');
            }}
            emptyState={
              <EmptyState
                tone="positive"
                icon={CheckCircleOutline}
                title={t('noResetRequestsFound')}
                description={t('noResetRequestsBody')}
              />
            }
            renderActions={(request) => (
              <>
                <Button
                  size="small"
                  startIcon={<ContentCopyOutlined />}
                  onClick={() => copy(request.contactInfo)}
                  sx={actionButtonSx('brand')}
                >
                  {t('copy')}
                </Button>
                <Button
                  component="a"
                  href={`/dash/admin/users?q=${encodeURIComponent(request.contactInfo)}`}
                  size="small"
                  sx={actionButtonSx('brand')}
                >
                  {t('findAccount')}
                </Button>
              </>
            )}
            pagination={{
              page: resetPage,
              rowsPerPage: resetRows,
              count: resetsData?.data?.pagination?.totalRequests || 0,
              onPageChange: setResetPage,
              onRowsPerPageChange: (value) => {
                setResetRows(value);
                setResetPage(0);
              },
            }}
          />
        </>
      )}

      {/* ------------------------------------------------- message detail */}
      <AdminDialog
        open={Boolean(openMessage)}
        onClose={() => setOpenMessage(null)}
        icon={MailOutlineOutlined}
        title={openMessage?.subject}
        subtitle={openMessage ? formatDateTime(openMessage.createdAt, currentLanguage) : undefined}
        maxWidth="sm"
        actions={
          openMessage ? (
            <>
              <Button onClick={() => setOpenMessage(null)} sx={quietButtonSx}>
                {t('close')}
              </Button>
              <Button
                onClick={() => setContactStatus(openMessage, 'in_progress', reply)}
                sx={actionButtonSx('attention')}
              >
                {t('contactStatus_in_progress')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                startIcon={<CheckCircleOutline />}
                onClick={() => setContactStatus(openMessage, 'resolved', reply)}
                sx={containedButtonSx('positive')}
              >
                {t('resolve')}
              </Button>
            </>
          ) : null
        }
      >
        {openMessage ? (
          <Box>
            <Box
              sx={(theme) => ({
                p: 1.75,
                mb: 2,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: alpha(theme.custom.color.ink, 0.04),
              })}
            >
              <Typography
                variant="body2"
                sx={(theme) => ({ color: theme.custom.color.ink, whiteSpace: 'pre-wrap' })}
              >
                {openMessage.message}
              </Typography>
            </Box>

            <FieldRow label={t('from')} value={openMessage.name} />
            <FieldRow
              label={t('email')}
              value={
                <Box
                  component="a"
                  href={`mailto:${openMessage.email}?subject=${encodeURIComponent(
                    `Re: ${openMessage.subject}`
                  )}`}
                  sx={(theme) => ({
                    color: theme.custom.color.brandPrimary,
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    textDecoration: 'none',
                  })}
                >
                  {openMessage.email}
                </Box>
              }
            />
            <FieldRow
              label={t('priority')}
              value={
                <StatusPill
                  state={openMessage.priority}
                  label={t(`priority_${openMessage.priority}`)}
                />
              }
            />
            <FieldRow
              label={t('status')}
              value={
                <StatusPill
                  state={openMessage.status}
                  label={t(`contactStatus_${openMessage.status}`)}
                />
              }
            />
            {openMessage.country ? (
              <FieldRow label={t('country')} value={openMessage.country} />
            ) : null}

            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.75 }}
              >
                {t('adminResponse')}
              </Typography>
              <Box
                component="textarea"
                rows={3}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={t('adminResponsePlaceholder')}
                sx={noteFieldSx}
              />
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                {t('adminResponseHint')}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </AdminDialog>

      {/* --------------------------------------------------- reset detail */}
      <AdminDialog
        open={Boolean(openReset)}
        onClose={() => setOpenReset(null)}
        icon={LockResetOutlined}
        title={t('resetRequestDetails')}
        subtitle={openReset ? formatDateTime(openReset.createdAt, currentLanguage) : undefined}
        maxWidth="xs"
        actions={
          openReset ? (
            <>
              <Button onClick={() => setOpenReset(null)} sx={quietButtonSx}>
                {t('close')}
              </Button>
              <Button
                startIcon={<BlockOutlined />}
                onClick={() => setResetStatusFor(openReset, 'rejected')}
                sx={actionButtonSx('critical')}
              >
                {t('markAsRejected')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                startIcon={<CheckCircleOutline />}
                onClick={() => setResetStatusFor(openReset, 'processed')}
                sx={containedButtonSx('positive')}
              >
                {t('markAsProcessed')}
              </Button>
            </>
          ) : null
        }
      >
        {openReset ? (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {t('resetRequestAdminHint')}
            </Typography>
            <FieldRow label={t('contactInfoLabel')} value={openReset.contactInfo} />
            <FieldRow
              label={t('status')}
              value={<StatusPill state={openReset.status} label={t(openReset.status)} />}
            />
            {openReset.processedBy?.username ? (
              <FieldRow label={t('processedBy')} value={openReset.processedBy.username} />
            ) : null}

            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.75 }}
              >
                {t('adminNotes')}
              </Typography>
              <Box
                component="textarea"
                rows={3}
                value={resetNotes}
                onChange={(event) => setResetNotes(event.target.value)}
                sx={noteFieldSx}
              />
            </Box>
          </Box>
        ) : null}
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteMessage)}
        onClose={() => setConfirmDeleteMessage(null)}
        onConfirm={async () => {
          try {
            await deleteContact(confirmDeleteMessage._id).unwrap();
            notify(t('messageDeleted'), 'success');
            setConfirmDeleteMessage(null);
          } catch (error) {
            notify(error?.data?.message || t('genericActionError'), 'error');
          }
        }}
        title={t('deleteMessageTitle')}
        description={t('deleteMessageBody')}
        confirmLabel={t('delete')}
        isLoading={deletingContact}
      />
    </>
  );
};

export default SupportPage;
