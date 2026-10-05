import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ShareOutlined,
  CheckCircleOutline,
  BlockOutlined,
  EditOutlined,
  OpenInNewOutlined,
  PhoneOutlined,
  WhatsApp,
  ScheduleOutlined,
  SearchOffOutlined,
  InfoOutlined,
  NotificationsActiveOutlined,
  NotificationsNoneOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { getSubscriptionState, requestSubscription } from '../../../utils/webPush';
import {
  useGetSocialReviewPostsQuery,
  useApproveSocialPostMutation,
  useSkipSocialPostMutation,
  useUpdateSocialPostMutation,
} from '../adminApiSlice';
import {
  AdminCard,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  StatusPill,
  actionButtonSx,
  containedButtonSx,
  useAdminToast,
} from '../ui';
import { formatDate, formatDateTime, labelOf, postTitle } from '../adminFormat';

/**
 * Admin Social Media Review Page
 *
 * Dedicated admin component to review newly created listings before they are shared
 * to Facebook & Instagram. Admins can:
 * - Review listing images, text, and metadata
 * - Edit description/contact if the user made a typo or mistake
 * - Approve with safe rate-limited queueing to avoid platform bans
 * - Skip sharing for irrelevant/sensitive listings
 */
const AdminSocialReviewPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');

  // Edit modal state
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    contact: '',
    exactLocation: '',
  });

  // Browser Push notification subscription state
  const [pushState, setPushState] = useState('loading'); // 'loading' | 'on' | 'off' | 'blocked' | 'unsupported'

  useEffect(() => {
    let active = true;
    getSubscriptionState().then((state) => {
      if (active) setPushState(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleEnablePush = async () => {
    try {
      const outcome = await requestSubscription(currentLanguage);
      if (outcome.status === 'subscribed') {
        setPushState('on');
        notify(t('browserPushSubscribedSuccess') || 'Browser review alerts enabled successfully!', 'success');
      } else if (outcome.status === 'denied') {
        setPushState('blocked');
        notify(t('browserPushDenied') || 'Notifications were blocked in your browser settings.', 'warning');
      } else {
        notify(t('browserPushFailed') || 'Could not enable browser notifications.', 'error');
      }
    } catch (err) {
      notify(err?.message || 'Failed to enable notifications', 'error');
    }
  };

  const { data, isFetching, error, refetch } = useGetSocialReviewPostsQuery({
    page: page + 1,
    limit: rowsPerPage,
    status: status || undefined,
    search: search || undefined,
  });

  const [approvePost, { isLoading: approving }] = useApproveSocialPostMutation();
  const [skipPost, { isLoading: skipping }] = useSkipSocialPostMutation();
  const [updatePost, { isLoading: updating }] = useUpdateSocialPostMutation();

  const payload = data?.data || data || {};
  const posts = payload.posts || [];
  const total = payload.total || 0;
  const counts = payload.counts || { pending: 0, approved: 0, skipped: 0 };

  const handleApprove = async (post) => {
    try {
      const res = await approvePost({ postId: post._id }).unwrap();
      notify(res?.message || t('socialPostApprovedSuccess') || 'Post approved and enqueued for social publishing.', 'success');
    } catch (err) {
      notify(err?.data?.message || t('genericActionError') || 'Failed to approve post.', 'error');
    }
  };

  const handleSkip = async (post) => {
    try {
      const res = await skipPost({ postId: post._id }).unwrap();
      notify(res?.message || t('socialPostSkippedSuccess') || 'Post marked as skipped.', 'info');
    } catch (err) {
      notify(err?.data?.message || t('genericActionError') || 'Failed to skip post.', 'error');
    }
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setEditForm({
      description: post.description || '',
      contact: post.contact || '',
      exactLocation: post.exactLocation || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      await updatePost({
        postId: editingPost._id,
        description: editForm.description,
        contact: editForm.contact,
        exactLocation: editForm.exactLocation,
      }).unwrap();
      notify(t('postUpdateSuccess') || 'Post updated successfully.', 'success');
      setEditingPost(null);
    } catch (err) {
      notify(err?.data?.message || t('genericActionError') || 'Failed to update post.', 'error');
    }
  };

  const statusFilters = useMemo(
    () => [
      { value: 'pending', label: `${t('pending') || 'Pending'} (${counts.pending || 0})` },
      { value: 'approved', label: `${t('approved') || 'Approved'} (${counts.approved || 0})` },
      { value: 'skipped', label: `${t('skipped') || 'Skipped'} (${counts.skipped || 0})` },
      { value: 'all', label: t('all') || 'All' },
    ],
    [counts, t]
  );

  const columns = useMemo(
    () => [
      {
        id: 'photo',
        label: t('photo') || 'Photo',
        render: (post) => (
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {post.cloudinaryUrl ? (
              <Box
                component="img"
                src={post.cloudinaryUrl}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <SearchOffOutlined sx={{ color: 'text.disabled', fontSize: 24 }} />
            )}
          </Box>
        ),
      },
      {
        id: 'details',
        label: t('listing') || 'Listing',
        primary: true,
        render: (post) => {
          const isLost = post.foundLost?.code === 'LOST' || post.type === 'lost';
          return (
            <Box sx={{ minWidth: 0, maxWidth: 360 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <StatusPill
                  tone={isLost ? 'lost' : 'found'}
                  label={isLost ? (t('lost') || 'Lost') : (t('found') || 'Found')}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {[
                    labelOf(post.category || post.categories?.[0], currentLanguage, ''),
                    labelOf(post.city, currentLanguage, ''),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'text.primary',
                }}
              >
                {post.description || t('noDescription')}
              </Typography>
              {post.exactLocation && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  📍 {post.exactLocation}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        id: 'author',
        label: t('author') || 'Author',
        render: (post) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {post.user?.username || '—'}
            </Typography>
            {post.contact && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <PhoneOutlined sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography
                  component="a"
                  href={`tel:${post.contact}`}
                  variant="caption"
                  sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
                >
                  {post.contact}
                </Typography>
              </Box>
            )}
          </Box>
        ),
      },
      {
        id: 'status',
        label: t('socialStatus') || 'Social Status',
        render: (post) => {
          const appStatus = post.social?.approvalStatus || 'pending';
          const toneMap = {
            pending: 'attention',
            approved: 'positive',
            skipped: 'muted',
          };
          const labelMap = {
            pending: t('pendingApproval') || 'Pending Review',
            approved: t('approved') || 'Approved & Queued',
            skipped: t('skipped') || 'Skipped',
          };

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <StatusPill tone={toneMap[appStatus] || 'neutral'} label={labelMap[appStatus] || appStatus} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDate(post.createdAt, currentLanguage)}
              </Typography>
              {post.social?.facebook?.permalink && (
                <Typography
                  component="a"
                  href={post.social.facebook.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  sx={{ color: '#1877F2', fontWeight: 600, textDecoration: 'none' }}
                >
                  Facebook ↗
                </Typography>
              )}
              {post.social?.instagram?.permalink && (
                <Typography
                  component="a"
                  href={post.social.instagram.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  sx={{ color: '#E4405F', fontWeight: 600, textDecoration: 'none' }}
                >
                  Instagram ↗
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        id: 'actions',
        label: t('actions') || 'Actions',
        align: 'right',
        render: (post) => {
          const isPending = (post.social?.approvalStatus || 'pending') === 'pending';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title={t('edit') || 'Edit'}>
                <IconButton size="small" onClick={() => handleOpenEdit(post)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('viewOnSite') || 'View Listing'}>
                <IconButton
                  size="small"
                  component="a"
                  href={`/dash/posts/${post._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNewOutlined fontSize="small" />
                </IconButton>
              </Tooltip>

              {isPending && (
                <>
                  <Button
                    size="small"
                    onClick={() => handleSkip(post)}
                    disabled={skipping}
                    sx={{ ...actionButtonSx('muted'), px: 1.5 }}
                  >
                    {t('skip') || 'Skip'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleApprove(post)}
                    disabled={approving}
                    startIcon={<CheckCircleOutline />}
                    sx={{ ...containedButtonSx('positive'), px: 1.75 }}
                  >
                    {t('approveAndPublish') || 'Approve & Publish'}
                  </Button>
                </>
              )}
            </Box>
          );
        },
      },
    ],
    [t, currentLanguage, approving, skipping]
  );

  return (
    <Box>
      <PageHeader
        title={t('adminNavSocialReview') || 'Social Media Review'}
        description={
          t('adminNavSocialReviewDescription') ||
          'Review newly created posts, edit errors or photos, and approve them to be posted to Facebook and Instagram.'
        }
        actions={
          pushState === 'on' ? (
            <Chip
              icon={<NotificationsActiveOutlined sx={{ fontSize: '1rem !important' }} />}
              label={t('browserAlertsActive') || 'Browser alerts active'}
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, py: 1.5, px: 0.5 }}
            />
          ) : pushState === 'off' ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<NotificationsNoneOutlined />}
              onClick={handleEnablePush}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.primary.main,
              }}
            >
              {t('enableBrowserAlerts') || 'Enable browser alerts'}
            </Button>
          ) : null
        }
      />

      {/* Safety Notice & Pacing Info */}
      <AdminCard sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(24, 119, 242, 0.1)',
            color: '#1877F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShareOutlined sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {t('socialPacingTitle') || 'Safe Automated Social Publishing Queue'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('socialPacingDesc') ||
              'When you approve a listing, it is automatically paced out with random jitter and safe delays (60-105s for Facebook, 3-5m for Instagram) to strictly prevent account restrictions or spam triggers from Meta.'}
          </Typography>
        </Box>
      </AdminCard>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('searchListings') || 'Search listings...'}
        filters={[
          {
            id: 'status',
            value: status,
            onChange: (val) => {
              setStatus(val);
              setPage(0);
            },
            options: statusFilters,
          },
        ]}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={posts}
        isLoading={isFetching}
        error={error ? (error?.data?.message || t('genericActionError') || 'Failed to load listings') : null}
        pagination={{
          page,
          rowsPerPage,
          count: total,
          onPageChange: setPage,
          onRowsPerPageChange: (val) => {
            setRowsPerPage(val);
            setPage(0);
          },
        }}
        emptyState={
          <EmptyState
            icon={ShareOutlined}
            title={t('noSocialPostsTitle') || 'No posts waiting for social review'}
            description={t('noSocialPostsDesc') || 'New listings created by users will appear here for verification.'}
          />
        }
      />

      {/* Quick Edit Dialog */}
      <Dialog
        open={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('editListing') || 'Edit Listing Details'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={t('description') || 'Description'}
            multiline
            rows={4}
            fullWidth
            value={editForm.description}
            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            label={t('contactPhone') || 'Contact Phone'}
            fullWidth
            value={editForm.contact}
            onChange={(e) => setEditForm((prev) => ({ ...prev, contact: e.target.value }))}
          />
          <TextField
            label={t('exactLocation') || 'Exact Location'}
            fullWidth
            value={editForm.exactLocation}
            onChange={(e) => setEditForm((prev) => ({ ...prev, exactLocation: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingPost(null)} sx={actionButtonSx('muted')}>
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={updating}
            sx={containedButtonSx('brand')}
          >
            {t('saveChanges') || 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSocialReviewPage;
