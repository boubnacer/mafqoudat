import React, { useMemo, useState } from 'react';
import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import {
  ArticleOutlined,
  DeleteOutline,
  MoreVertOutlined,
  OpenInNewOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  TaskAltOutlined,
  SearchOffOutlined,
  VisibilityOutlined,
  ImageNotSupportedOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetAllPostsAdminQuery,
  useDeletePostAdminMutation,
  useUpdatePostStatusAdminMutation,
} from '../adminApiSlice';
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
} from '../../dependencies/dependenciesApiSlice';
import {
  AdminDialog,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FieldRow,
  FilterBar,
  PageHeader,
  StatusPill,
  actionButtonSx,
  useAdminToast,
} from '../ui';
import { formatDate, formatDateTime, labelOf, postTitle } from '../adminFormat';

/**
 * Every listing on the site.
 *
 * Same table as before in outline, but it can now do something other than
 * delete: suspending takes a listing off the public site while leaving it, its
 * owner and any report about it intact, which is the right answer to most of
 * what lands in moderation. Deletion is behind a typed confirmation, because it
 * takes the listing's photo, comment thread and match rows with it.
 *
 * Filters, labels and dates all read the admin's own language - the old table's
 * headers were hardcoded English, its categories and cities always rendered
 * `labels.en`, and its dates went through `toLocaleDateString()` with no locale
 * at all.
 */

const STATUS_ACTIONS = ['active', 'suspended', 'resolved', 'expired'];

const PostsPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', country: '' });
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, row: null });

  const { data, isFetching, error } = useGetAllPostsAdminQuery({
    page: page + 1,
    limit: rowsPerPage,
    search: filters.search || undefined,
    status: filters.status || undefined,
    category: filters.category || undefined,
    country: filters.country || undefined,
  });

  const { data: categoriesData } = useGetCategoriesQuery({ language: currentLanguage || 'en' });
  const { data: countriesData } = useGetCountriesQuery({ language: currentLanguage || 'en' });
  const categories = categoriesData?.ids?.map((id) => categoriesData.entities[id]) || [];
  const countries = countriesData?.ids?.map((id) => countriesData.entities[id]) || [];

  const [deletePost, { isLoading: deleting }] = useDeletePostAdminMutation();
  const [updateStatus] = useUpdatePostStatusAdminMutation();

  const setStatus = async (post, status) => {
    try {
      await updateStatus({ postId: post._id, status }).unwrap();
      notify(t('listingStatusUpdated', { status: t(status) }), 'success');
      setMenu({ anchor: null, row: null });
      setSelected((current) => (current?._id === post._id ? { ...current, status } : current));
    } catch (requestError) {
      notify(requestError?.data?.message || t('genericActionError'), 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'listing',
        label: t('listing'),
        primary: true,
        maxWidth: 360,
        render: (post) => {
          const isLost = post.foundLost?.code === 'LOST';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <Box
                sx={(theme) => {
                  const tone = isLost ? theme.custom.status.lost : theme.custom.status.found;
                  return {
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: `${theme.custom.radius.sm}px`,
                    overflow: 'hidden',
                    backgroundColor: tone.bg,
                    color: tone.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  };
                }}
              >
                {post.cloudinaryUrl ? (
                  <Box
                    component="img"
                    src={post.cloudinaryUrl}
                    alt=""
                    loading="lazy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageNotSupportedOutlined sx={{ fontSize: 17 }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
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
                  {postTitle(post, t('noDescription'))}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.35 }}>
                  <StatusPill
                    size="sm"
                    tone={isLost ? 'critical' : 'positive'}
                    label={isLost ? t('lost') : t('found')}
                    icon={isLost ? SearchOffOutlined : TaskAltOutlined}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {labelOf(post.category, currentLanguage, t('unknown'))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        },
      },
      {
        id: 'owner',
        label: t('user'),
        hideBelow: 'lg',
        render: (post) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {post.user?.username || t('unknown')}
          </Typography>
        ),
      },
      {
        id: 'place',
        label: t('location'),
        render: (post) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({ color: theme.custom.color.ink, fontWeight: 600 })}
            >
              {labelOf(post.city, currentLanguage, t('unknown'))}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {labelOf(post.country, currentLanguage, '')}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (post) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <StatusPill state={post.status} label={t(post.status)} />
            {post.returned ? (
              <StatusPill
                size="sm"
                tone="positive"
                label={t('returned')}
                icon={TaskAltOutlined}
              />
            ) : null}
          </Box>
        ),
      },
      {
        id: 'views',
        label: t('viewsLabel'),
        align: 'end',
        hideBelow: 'lg',
        render: (post) => (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
          >
            {(post.views || 0).toLocaleString()}
          </Typography>
        ),
      },
      {
        id: 'created',
        label: t('date'),
        render: (post) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatDate(post.createdAt, currentLanguage)}
          </Typography>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  const hasFilters = Boolean(
    filters.search || filters.status || filters.category || filters.country
  );

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupCatalog')}
        title={t('adminNavPosts')}
        description={t('adminNavPostsDescription')}
      />

      <FilterBar
        search={{
          value: filters.search,
          onChange: (value) => {
            setFilters((current) => ({ ...current, search: value }));
            setPage(0);
          },
          placeholder: t('searchPostsAdmin'),
        }}
        selects={[
          {
            id: 'status',
            label: t('filterByStatus'),
            value: filters.status,
            width: 168,
            onChange: (value) => {
              setFilters((current) => ({ ...current, status: value }));
              setPage(0);
            },
            options: [
              { value: '', label: t('allStatuses') },
              { value: 'active', label: t('active') },
              { value: 'resolved', label: t('resolved') },
              { value: 'expired', label: t('expired') },
              { value: 'suspended', label: t('suspended') },
            ],
          },
          {
            id: 'category',
            label: t('filterByCategory'),
            value: filters.category,
            onChange: (value) => {
              setFilters((current) => ({ ...current, category: value }));
              setPage(0);
            },
            options: [
              { value: '', label: t('allCategories') },
              ...categories.map((category) => ({
                value: category._id,
                label: labelOf(category, currentLanguage, category.code),
              })),
            ],
          },
          {
            id: 'country',
            label: t('filterByCountry'),
            value: filters.country,
            width: 180,
            onChange: (value) => {
              setFilters((current) => ({ ...current, country: value }));
              setPage(0);
            },
            options: [
              { value: '', label: t('allCountries') },
              ...countries.map((country) => ({
                value: country._id,
                label: labelOf(country, currentLanguage, country.code),
              })),
            ],
          },
        ]}
        onClear={() => {
          setFilters({ search: '', status: '', category: '', country: '' });
          setPage(0);
        }}
        hasActiveFilters={hasFilters}
      />

      <DataTable
        columns={columns}
        rows={data?.data?.posts || []}
        isLoading={isFetching}
        error={error ? error?.data?.message || t('errorLoadingPosts') : null}
        onRowClick={setSelected}
        emptyState={
          <EmptyState
            icon={ArticleOutlined}
            title={t('noPostsFound')}
            description={hasFilters ? t('noPostsFoundFiltered') : undefined}
          />
        }
        renderActions={(post) => (
          <>
            <Tooltip title={t('viewDetails')}>
              <IconButton size="small" onClick={() => setSelected(post)} aria-label={t('viewDetails')}>
                <VisibilityOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('moreActions')}>
              <IconButton
                size="small"
                onClick={(event) => setMenu({ anchor: event.currentTarget, row: post })}
                aria-label={t('moreActions')}
              >
                <MoreVertOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        pagination={{
          page,
          rowsPerPage,
          count: data?.data?.pagination?.totalPosts || 0,
          onPageChange: setPage,
          onRowsPerPageChange: (value) => {
            setRowsPerPage(value);
            setPage(0);
          },
        }}
      />

      <Menu
        anchorEl={menu.anchor}
        open={Boolean(menu.anchor)}
        onClose={() => setMenu({ anchor: null, row: null })}
        PaperProps={{
          sx: (theme) => ({
            backgroundColor: theme.custom.color.surfaceRaised,
            backgroundImage: 'none',
            borderRadius: `${theme.custom.radius.md}px`,
            boxShadow: theme.custom.elevation.e2,
            minWidth: 190,
          }),
        }}
      >
        {STATUS_ACTIONS.filter((status) => status !== menu.row?.status).map((status) => (
          <MenuItem
            key={status}
            onClick={() => setStatus(menu.row, status)}
            sx={{ fontSize: '0.86rem', gap: 1.25 }}
          >
            {status === 'suspended' ? (
              <PauseCircleOutlined fontSize="small" />
            ) : (
              <PlayCircleOutlined fontSize="small" />
            )}
            {t('markAs', { status: t(status) })}
          </MenuItem>
        ))}
        <MenuItem
          component="a"
          href={menu.row ? `/dash/posts/${menu.row._id}` : undefined}
          target="_blank"
          rel="noreferrer"
          onClick={() => setMenu({ anchor: null, row: null })}
          sx={{ fontSize: '0.86rem', gap: 1.25 }}
        >
          <OpenInNewOutlined fontSize="small" />
          {t('viewPost')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDelete(menu.row);
            setMenu({ anchor: null, row: null });
          }}
          sx={(theme) => ({
            fontSize: '0.86rem',
            gap: 1.25,
            color: theme.custom.status.lost.main,
          })}
        >
          <DeleteOutline fontSize="small" />
          {t('deletePost')}
        </MenuItem>
      </Menu>

      <AdminDialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        icon={ArticleOutlined}
        title={t('listingDetails')}
        subtitle={selected ? formatDateTime(selected.createdAt, currentLanguage) : undefined}
        actions={
          selected ? (
            <>
              <Button
                component="a"
                href={`/dash/posts/${selected._id}`}
                target="_blank"
                rel="noreferrer"
                endIcon={<OpenInNewOutlined />}
                sx={actionButtonSx('brand')}
              >
                {t('viewPost')}
              </Button>
              <Button
                onClick={() =>
                  setStatus(selected, selected.status === 'suspended' ? 'active' : 'suspended')
                }
                startIcon={
                  selected.status === 'suspended' ? <PlayCircleOutlined /> : <PauseCircleOutlined />
                }
                sx={actionButtonSx(selected.status === 'suspended' ? 'positive' : 'attention')}
              >
                {selected.status === 'suspended' ? t('restoreListing') : t('suspendListing')}
              </Button>
              <Button
                onClick={() => setConfirmDelete(selected)}
                startIcon={<DeleteOutline />}
                sx={actionButtonSx('critical')}
              >
                {t('deletePost')}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <Box>
            {selected.cloudinaryUrl ? (
              <Box
                component="img"
                src={selected.cloudinaryUrl}
                alt=""
                sx={(theme) => ({
                  width: '100%',
                  maxHeight: 240,
                  objectFit: 'cover',
                  borderRadius: `${theme.custom.radius.md}px`,
                  mb: 2,
                })}
              />
            ) : null}

            <Grid container spacing={0}>
              <Grid item xs={12}>
                <FieldRow label={t('description')} value={selected.description || '—'} multiline />
                <FieldRow
                  label={t('status')}
                  value={
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <StatusPill state={selected.status} label={t(selected.status)} />
                      <StatusPill
                        tone={selected.foundLost?.code === 'LOST' ? 'critical' : 'positive'}
                        label={selected.foundLost?.code === 'LOST' ? t('lost') : t('found')}
                      />
                      {selected.returned ? (
                        <StatusPill tone="positive" label={t('returned')} />
                      ) : null}
                    </Box>
                  }
                />
                <FieldRow label={t('user')} value={selected.user?.username || t('unknown')} />
                <FieldRow label={t('contact')} value={selected.contact || t('noContact')} />
                <FieldRow
                  label={t('category')}
                  value={labelOf(selected.category, currentLanguage, t('unknown'))}
                />
                <FieldRow
                  label={t('location')}
                  value={[
                    selected.exactLocation,
                    labelOf(selected.city, currentLanguage, ''),
                    labelOf(selected.country, currentLanguage, ''),
                  ]
                    .filter(Boolean)
                    .join(' · ') || t('noLocation')}
                />
                {selected.mainDate ? (
                  <FieldRow label={t('date')} value={selected.mainDate} />
                ) : null}
                <FieldRow
                  label={t('viewsLabel')}
                  value={(selected.views || 0).toLocaleString()}
                />
                {selected.promotionRequested ? (
                  <FieldRow
                    label={t('adminNavPromotions')}
                    value={
                      <StatusPill
                        state={selected.promotionProcessed ? 'processed' : 'requested'}
                        label={selected.promotionProcessed ? t('processed') : t('requested')}
                      />
                    }
                  />
                ) : null}
              </Grid>
            </Grid>
          </Box>
        ) : null}
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            await deletePost(confirmDelete._id).unwrap();
            notify(t('postDeletedSuccessfully'), 'success');
            setConfirmDelete(null);
            setSelected(null);
          } catch (requestError) {
            notify(requestError?.data?.message || t('errorDeletingPost'), 'error');
          }
        }}
        title={t('deleteListingTitle')}
        description={t('deleteListingBody')}
        confirmLabel={t('deletePost')}
        isLoading={deleting}
      />
    </>
  );
};

export default PostsPage;
