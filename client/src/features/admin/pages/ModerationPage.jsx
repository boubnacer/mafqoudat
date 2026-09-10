import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Typography, alpha } from '@mui/material';
import {
  FlagOutlined,
  ChatBubbleOutlineOutlined,
  ArticleOutlined,
  VisibilityOutlined,
  CheckCircleOutline,
  BlockOutlined,
  DeleteOutline,
  RestartAltOutlined,
  PauseCircleOutlined,
  OpenInNewOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useGetAdminCommentsQuery,
  useUpdateCommentAdminMutation,
  useUpdatePostStatusAdminMutation,
  useDeletePostAdminMutation,
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
 * The moderation queue: what people have objected to, and the comments they
 * objected to it in.
 *
 * Two things the old reports tab could not do.
 *
 * It could not show a report about a *comment*. Comments have been reportable
 * since the thread feature shipped and those reports land in this same
 * collection, but the table only ever rendered the listing - so a moderator saw
 * "inappropriate content" attached to a perfectly ordinary lost-wallet post with
 * the actual words nowhere on the page. Now a report says which kind it is,
 * quotes the comment, and the action it offers is to take that comment down.
 *
 * And it could not do anything short of deleting. Judging a report meant either
 * marking it resolved and leaving the listing up, or deleting the listing
 * outright - so suspending, which the schema has always supported and every
 * public read already respects, was unreachable. It is the first action offered
 * here, and deletion is last.
 */

const REASON_KEYS = {
  inappropriate_content: 'inappropriateContent',
  spam_fake: 'spamFake',
  duplicate: 'duplicate',
  wrong_category: 'wrongCategory',
  suspicious_activity: 'suspiciousActivity',
  personal_info: 'personalInfo',
  other: 'other',
};

const ModerationPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();
  const { overview } = useAdminOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get('view') === 'comments' ? 'comments' : 'reports';
  const setView = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'reports') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  /* ------------------------------------------------------------- reports */
  const [reportPage, setReportPage] = useState(0);
  const [reportRows, setReportRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [targetFilter, setTargetFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const {
    data: reportsData,
    isFetching: reportsFetching,
    error: reportsError,
  } = useGetReportsQuery(
    {
      page: reportPage + 1,
      limit: reportRows,
      status: statusFilter || undefined,
      target: targetFilter || undefined,
    },
    { skip: view !== 'reports' }
  );

  /* ------------------------------------------------------------ comments */
  const [commentPage, setCommentPage] = useState(0);
  const [commentRows, setCommentRows] = useState(20);
  const [commentStatus, setCommentStatus] = useState('');
  const [commentSearch, setCommentSearch] = useState('');

  const {
    data: commentsData,
    isFetching: commentsFetching,
    error: commentsError,
  } = useGetAdminCommentsQuery(
    {
      page: commentPage + 1,
      limit: commentRows,
      status: commentStatus || undefined,
      search: commentSearch || undefined,
    },
    { skip: view !== 'comments' }
  );

  const [updateReport, { isLoading: savingReport }] = useUpdateReportStatusMutation();
  const [updateComment] = useUpdateCommentAdminMutation();
  const [updatePostStatus] = useUpdatePostStatusAdminMutation();
  const [deletePost, { isLoading: deletingPost }] = useDeletePostAdminMutation();
  const [confirm, setConfirm] = useState(null);

  const openReport = (report) => {
    setSelected(report);
    setNotes(report.adminNotes || '');
  };

  const closeReport = () => {
    setSelected(null);
    setNotes('');
  };

  const resolveReport = async (status) => {
    try {
      await updateReport({ reportId: selected._id, status, adminNotes: notes }).unwrap();
      notify(t('reportUpdated'), 'success');
      closeReport();
    } catch (error) {
      notify(error?.data?.message || t('genericActionError'), 'error');
    }
  };

  const setCommentState = async (comment, status) => {
    try {
      await updateComment({ commentId: comment._id, status }).unwrap();
      notify(status === 'removed' ? t('commentRemoved') : t('commentRestored'), 'success');
    } catch (error) {
      notify(error?.data?.message || t('genericActionError'), 'error');
    }
  };

  const suspendReportedPost = async () => {
    const post = selected?.postId;
    if (!post?._id) return;
    const next = post.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updatePostStatus({ postId: post._id, status: next }).unwrap();
      notify(next === 'suspended' ? t('listingSuspended') : t('listingRestored'), 'success');
      closeReport();
    } catch (error) {
      notify(error?.data?.message || t('genericActionError'), 'error');
    }
  };

  const removeReportedComment = async () => {
    const comment = selected?.commentId;
    if (!comment?._id) return;
    const next = comment.status === 'removed' ? 'active' : 'removed';
    await setCommentState(comment, next);
    closeReport();
  };

  const reasonLabel = (reasonType) => t(REASON_KEYS[reasonType] || 'other');

  const reportColumns = useMemo(
    () => [
      {
        id: 'subject',
        label: t('reportedContent'),
        primary: true,
        maxWidth: 340,
        render: (row) => (
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.35 }}>
              <StatusPill
                size="sm"
                tone={row.target === 'comment' ? 'brand' : 'neutral'}
                label={row.target === 'comment' ? t('commentReport') : t('listingReport')}
                icon={row.target === 'comment' ? ChatBubbleOutlineOutlined : ArticleOutlined}
              />
            </Box>
            <Typography
              variant="body2"
              sx={(theme) => ({
                fontWeight: 600,
                color: theme.custom.color.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              })}
            >
              {row.target === 'comment'
                ? truncate(row.commentText || t('commentUnavailable'), 110)
                : row.postLabel || t('noDescription')}
            </Typography>
            {row.target === 'comment' && row.commentAuthor ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('byUser', { name: row.commentAuthor })}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        id: 'reason',
        label: t('reason'),
        render: (row) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({ fontWeight: 600, color: theme.custom.color.ink })}
            >
              {reasonLabel(row.reasonType)}
            </Typography>
            {row.reason ? (
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
                {truncate(row.reason, 70)}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        id: 'reportedBy',
        label: t('reportedBy'),
        hideBelow: 'lg',
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {row.reportedBy?.username || t('anonymous')}
          </Typography>
        ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (row) => <StatusPill state={row.status} label={t(row.status)} />,
      },
      {
        id: 'date',
        label: t('reportedAt'),
        render: (row) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatRelative(row.createdAt, currentLanguage, t)}
          </Typography>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  const commentColumns = useMemo(
    () => [
      {
        id: 'text',
        label: t('comment'),
        primary: true,
        maxWidth: 420,
        render: (row) => (
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: row.status === 'removed' ? theme.palette.text.disabled : theme.custom.color.ink,
              textDecoration: row.status === 'removed' ? 'line-through' : 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            })}
          >
            {row.text}
          </Typography>
        ),
      },
      {
        id: 'author',
        label: t('author'),
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {row.user?.username || t('unknown')}
          </Typography>
        ),
      },
      {
        id: 'post',
        label: t('post'),
        hideBelow: 'lg',
        maxWidth: 220,
        render: (row) =>
          row.post?._id ? (
            <Box
              component="a"
              href={`/dash/posts/${row.post._id}`}
              target="_blank"
              rel="noreferrer"
              sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: theme.custom.color.brandPrimary,
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                minWidth: 0,
              })}
            >
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 170,
                }}
              >
                {row.postLabel || t('viewPost')}
              </Box>
              <OpenInNewOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {t('postDeleted')}
            </Typography>
          ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (row) => (
          <StatusPill
            state={row.status === 'removed' ? 'removed' : 'active'}
            label={row.status === 'removed' ? t('removed') : t('visible')}
          />
        ),
      },
      {
        id: 'date',
        label: t('date'),
        render: (row) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatRelative(row.createdAt, currentLanguage, t)}
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
        title={t('adminNavModeration')}
        description={t('adminNavModerationDescription')}
        actions={
          <SegmentedControl
            ariaLabel={t('adminNavModeration')}
            value={view}
            onChange={setView}
            options={[
              {
                value: 'reports',
                label: t('reports'),
                icon: FlagOutlined,
                count: overview?.queues?.reports || 0,
              },
              { value: 'comments', label: t('siteComments'), icon: ChatBubbleOutlineOutlined },
            ]}
          />
        }
      />

      {view === 'reports' ? (
        <>
          <FilterBar
            selects={[
              {
                id: 'status',
                label: t('filterByStatus'),
                value: statusFilter,
                onChange: (value) => {
                  setStatusFilter(value);
                  setReportPage(0);
                },
                options: [
                  { value: '', label: t('allStatuses') },
                  { value: 'pending', label: t('pending') },
                  { value: 'reviewed', label: t('reviewed') },
                  { value: 'resolved', label: t('resolved') },
                  { value: 'dismissed', label: t('dismissed') },
                ],
              },
              {
                id: 'target',
                label: t('reportKind'),
                value: targetFilter,
                onChange: (value) => {
                  setTargetFilter(value);
                  setReportPage(0);
                },
                options: [
                  { value: '', label: t('allKinds') },
                  { value: 'post', label: t('listingReport') },
                  { value: 'comment', label: t('commentReport') },
                ],
              },
            ]}
            onClear={() => {
              setStatusFilter('');
              setTargetFilter('');
              setReportPage(0);
            }}
            hasActiveFilters={Boolean(statusFilter || targetFilter)}
          />

          <DataTable
            columns={reportColumns}
            rows={reportsData?.data?.reports || []}
            isLoading={reportsFetching}
            error={reportsError ? reportsError?.data?.message || t('errorLoadingReports') : null}
            onRowClick={openReport}
            emptyState={
              <EmptyState
                tone="positive"
                icon={CheckCircleOutline}
                title={statusFilter === 'pending' ? t('noPendingReports') : t('noReportsFound')}
                description={statusFilter === 'pending' ? t('noPendingReportsBody') : undefined}
              />
            }
            renderActions={(row) => (
              <Button
                size="small"
                startIcon={<VisibilityOutlined />}
                onClick={() => openReport(row)}
                sx={actionButtonSx('brand')}
              >
                {t('review')}
              </Button>
            )}
            pagination={{
              page: reportPage,
              rowsPerPage: reportRows,
              count: reportsData?.data?.pagination?.totalReports || 0,
              onPageChange: setReportPage,
              onRowsPerPageChange: (value) => {
                setReportRows(value);
                setReportPage(0);
              },
            }}
          />
        </>
      ) : (
        <>
          <FilterBar
            search={{
              value: commentSearch,
              onChange: (value) => {
                setCommentSearch(value);
                setCommentPage(0);
              },
              placeholder: t('searchComments'),
            }}
            selects={[
              {
                id: 'commentStatus',
                label: t('filterByStatus'),
                value: commentStatus,
                onChange: (value) => {
                  setCommentStatus(value);
                  setCommentPage(0);
                },
                options: [
                  { value: '', label: t('allStatuses') },
                  { value: 'active', label: t('visible') },
                  { value: 'removed', label: t('removed') },
                ],
              },
            ]}
            onClear={() => {
              setCommentSearch('');
              setCommentStatus('');
              setCommentPage(0);
            }}
            hasActiveFilters={Boolean(commentSearch || commentStatus)}
          />

          <DataTable
            columns={commentColumns}
            rows={commentsData?.data?.comments || []}
            isLoading={commentsFetching}
            error={commentsError ? commentsError?.data?.message || t('genericLoadError') : null}
            emptyState={
              <EmptyState icon={ChatBubbleOutlineOutlined} title={t('noCommentsFound')} />
            }
            renderActions={(row) =>
              row.status === 'removed' ? (
                <Button
                  size="small"
                  startIcon={<RestartAltOutlined />}
                  onClick={() => setCommentState(row, 'active')}
                  sx={actionButtonSx('positive')}
                >
                  {t('restore')}
                </Button>
              ) : (
                <Button
                  size="small"
                  startIcon={<BlockOutlined />}
                  onClick={() =>
                    setConfirm({
                      title: t('removeCommentTitle'),
                      description: t('removeCommentBody'),
                      confirmLabel: t('remove'),
                      onConfirm: async () => {
                        await setCommentState(row, 'removed');
                        setConfirm(null);
                      },
                    })
                  }
                  sx={actionButtonSx('critical')}
                >
                  {t('remove')}
                </Button>
              )
            }
            pagination={{
              page: commentPage,
              rowsPerPage: commentRows,
              count: commentsData?.data?.pagination?.totalComments || 0,
              onPageChange: setCommentPage,
              onRowsPerPageChange: (value) => {
                setCommentRows(value);
                setCommentPage(0);
              },
            }}
          />
        </>
      )}

      {/* --------------------------------------------------- report detail */}
      <AdminDialog
        open={Boolean(selected)}
        onClose={closeReport}
        icon={FlagOutlined}
        title={t('reportDetails')}
        subtitle={selected ? formatDateTime(selected.createdAt, currentLanguage) : undefined}
        maxWidth="sm"
        actions={
          selected ? (
            <>
              <Button onClick={closeReport} sx={quietButtonSx}>
                {t('close')}
              </Button>
              <Button
                onClick={() => resolveReport('dismissed')}
                disabled={savingReport}
                sx={actionButtonSx('neutral')}
              >
                {t('dismiss')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={() => resolveReport('resolved')}
                disabled={savingReport}
                startIcon={<CheckCircleOutline />}
                sx={containedButtonSx('positive')}
              >
                {t('resolve')}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <Box>
            {/* What was actually objected to, quoted. This is the part the old
                table had no place for. */}
            <Box
              sx={(theme) => ({
                p: 1.75,
                mb: 2,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: alpha(theme.custom.color.ink, 0.04),
                borderInlineStart: `4px solid ${
                  selected.target === 'comment'
                    ? theme.custom.color.brandPrimary
                    : theme.custom.status.lost.main
                }`,
              })}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}
              >
                {selected.target === 'comment' ? t('reportedComment') : t('reportedListing')}
              </Typography>
              <Typography
                variant="body2"
                sx={(theme) => ({ color: theme.custom.color.ink, whiteSpace: 'pre-wrap' })}
              >
                {selected.target === 'comment'
                  ? selected.commentText || t('commentUnavailable')
                  : selected.postLabel || t('noDescription')}
              </Typography>
              {selected.target === 'comment' && selected.commentAuthor ? (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  {t('byUser', { name: selected.commentAuthor })}
                </Typography>
              ) : null}
            </Box>

            <FieldRow label={t('reason')} value={reasonLabel(selected.reasonType)} />
            {selected.reason ? (
              <FieldRow label={t('details')} value={selected.reason} multiline />
            ) : null}
            <FieldRow
              label={t('reportedBy')}
              value={selected.reportedBy?.username || t('anonymous')}
            />
            <FieldRow
              label={t('status')}
              value={<StatusPill state={selected.status} label={t(selected.status)} />}
            />
            {selected.reviewedBy?.username ? (
              <FieldRow label={t('processedBy')} value={selected.reviewedBy.username} />
            ) : null}
            {selected.postId?._id ? (
              <FieldRow
                label={t('postLink')}
                value={
                  <Button
                    component="a"
                    href={`/dash/posts/${selected.postId._id}`}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                    endIcon={<OpenInNewOutlined />}
                    sx={actionButtonSx('brand')}
                  >
                    {t('viewPost')}
                  </Button>
                }
              />
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
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder={t('addNotesForThisReport')}
                sx={noteFieldSx}
              />
            </Box>

            {/* The proportionate actions, ahead of deletion. */}
            <Box
              sx={(theme) => ({
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              })}
            >
              {selected.target === 'comment' && selected.commentId?._id ? (
                <Button
                  size="small"
                  startIcon={
                    selected.commentId.status === 'removed' ? (
                      <RestartAltOutlined />
                    ) : (
                      <BlockOutlined />
                    )
                  }
                  onClick={removeReportedComment}
                  sx={actionButtonSx(
                    selected.commentId.status === 'removed' ? 'positive' : 'critical'
                  )}
                >
                  {selected.commentId.status === 'removed'
                    ? t('restoreComment')
                    : t('removeComment')}
                </Button>
              ) : null}

              {selected.postId?._id ? (
                <>
                  <Button
                    size="small"
                    startIcon={
                      selected.postId.status === 'suspended' ? (
                        <RestartAltOutlined />
                      ) : (
                        <PauseCircleOutlined />
                      )
                    }
                    onClick={suspendReportedPost}
                    sx={actionButtonSx(
                      selected.postId.status === 'suspended' ? 'positive' : 'attention'
                    )}
                  >
                    {selected.postId.status === 'suspended'
                      ? t('restoreListing')
                      : t('suspendListing')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteOutline />}
                    onClick={() =>
                      setConfirm({
                        title: t('deleteListingTitle'),
                        description: t('deleteListingBody'),
                        confirmLabel: t('deletePost'),
                        onConfirm: async () => {
                          try {
                            await deletePost(selected.postId._id).unwrap();
                            notify(t('postDeletedSuccessfully'), 'success');
                            setConfirm(null);
                            closeReport();
                          } catch (error) {
                            notify(error?.data?.message || t('errorDeletingPost'), 'error');
                          }
                        },
                      })
                    }
                    sx={actionButtonSx('critical')}
                  >
                    {t('deletePost')}
                  </Button>
                </>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm || (() => {})}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        isLoading={deletingPost}
      />
    </>
  );
};

export default ModerationPage;
