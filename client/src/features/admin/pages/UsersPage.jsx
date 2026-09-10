import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import {
  PeopleAltOutlined,
  ArticleOutlined,
  LockResetOutlined,
  MoreVertOutlined,
  DeleteOutline,
  BlockOutlined,
  CheckCircleOutline,
  ShieldOutlined,
  PersonOutlineOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetUsersAdminQuery,
  useGetUserPostsAdminQuery,
  useUpdateUserAdminMutation,
  useAdminResetUserPasswordMutation,
  useDeleteUserAdminMutation,
} from '../adminApiSlice';
import {
  AdminDialog,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  ResetPasswordDialog,
  StatusPill,
  useAdminToast,
} from '../ui';

import { formatDate, labelOf, postTitle } from '../adminFormat';

/**
 * The accounts on the site.
 *
 * The change that matters here is that deleting is no longer the only thing an
 * admin can do to a person. Deactivating an account stops it signing in - and
 * takes hold within one access-token lifetime, because /auth/refresh reloads
 * the user from the database before minting - while leaving their listings,
 * their comments and any report about them exactly where they are. Deleting
 * purges all of it, so it asks for the username to be typed first.
 *
 * The role control offers `user` and `moderator` only. Promoting someone to
 * admin is the one change this route cannot undo afterwards, so it is not a
 * menu item.
 */

const UserPostsDialog = ({ user, onClose }) => {
  const { t, currentLanguage } = useTranslation();
  const [page, setPage] = useState(0);

  const { data, isFetching } = useGetUserPostsAdminQuery(
    { userId: user?._id, page: page + 1, limit: 10 },
    { skip: !user?._id }
  );

  const columns = useMemo(
    () => [
      {
        id: 'listing',
        label: t('listing'),
        primary: true,
        render: (post) => (
          <Typography
            variant="body2"
            sx={(theme) => ({
              fontWeight: 600,
              color: theme.custom.color.ink,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            })}
          >
            {postTitle(post, t('noDescription'))}
          </Typography>
        ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (post) => <StatusPill state={post.status} label={t(post.status)} />,
      },
      {
        id: 'date',
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

  return (
    <AdminDialog
      open={Boolean(user)}
      onClose={onClose}
      icon={ArticleOutlined}
      title={t('userListings')}
      subtitle={user?.username}
      maxWidth="md"
    >
      <DataTable
        columns={columns}
        rows={data?.data?.posts || []}
        isLoading={isFetching}
        emptyState={<EmptyState icon={ArticleOutlined} title={t('noPostsFound')} />}
        pagination={{
          page,
          rowsPerPage: 10,
          count: data?.data?.pagination?.totalPosts || 0,
          onPageChange: setPage,
        }}
      />
    </AdminDialog>
  );
};

const UsersPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();

  // `?q=` is how Support's "find this account" link arrives here, so a
  // password-reset request can be taken straight to the account it is about.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const setSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('q', value);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menu, setMenu] = useState({ anchor: null, row: null });
  const [postsFor, setPostsFor] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isFetching, error } = useGetUsersAdminQuery({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const [updateUser] = useUpdateUserAdminMutation();
  const [resetPassword] = useAdminResetUserPasswordMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserAdminMutation();

  const applyChange = async (user, body, successKey) => {
    try {
      await updateUser({ userId: user._id, ...body }).unwrap();
      notify(t(successKey), 'success');
    } catch (requestError) {
      notify(requestError?.data?.message || t('genericActionError'), 'error');
    } finally {
      setMenu({ anchor: null, row: null });
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'user',
        label: t('user'),
        primary: true,
        render: (user) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: user.isActive
                  ? theme.custom.status.found.bg
                  : theme.custom.status.lost.bg,
                color: user.isActive
                  ? theme.custom.status.found.main
                  : theme.custom.status.lost.main,
              })}
            >
              {(user.username || '?').charAt(0).toUpperCase()}
            </Box>
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
                {user.username}
              </Typography>
              {user.profile?.firstName || user.profile?.lastName ? (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ')}
                </Typography>
              ) : null}
            </Box>
          </Box>
        ),
      },
      {
        id: 'contact',
        label: t('contact'),
        maxWidth: 240,
        render: (user) => (
          <Box sx={{ minWidth: 0 }}>
            {user.email ? (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: theme.custom.color.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                })}
              >
                {user.email}
              </Typography>
            ) : null}
            {user.phone ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.phone}
              </Typography>
            ) : null}
            {!user.email && !user.phone ? (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('noContact')}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        id: 'country',
        label: t('country'),
        hideBelow: 'lg',
        render: (user) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {labelOf(user.country, currentLanguage, t('unknown'))}
          </Typography>
        ),
      },
      {
        id: 'role',
        label: t('role'),
        render: (user) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <StatusPill
              state={user.role || 'user'}
              label={t(`role_${user.role || 'user'}`)}
              icon={user.role === 'user' || !user.role ? PersonOutlineOutlined : ShieldOutlined}
            />
            <StatusPill
              tone={user.isActive ? 'positive' : 'critical'}
              label={user.isActive ? t('accountActive') : t('accountSuspended')}
            />
          </Box>
        ),
      },
      {
        id: 'joined',
        label: t('joinedDate'),
        render: (user) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatDate(user.createdAt, currentLanguage)}
          </Typography>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage]
  );

  const row = menu.row;
  const isAdminRow = row?.role === 'admin';

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupCatalog')}
        title={t('adminNavUsers')}
        description={t('adminNavUsersDescription')}
      />

      <FilterBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(0);
          },
          placeholder: t('searchUsers'),
        }}
        onClear={() => {
          setSearch('');
          setPage(0);
        }}
        hasActiveFilters={Boolean(search)}
      />

      <DataTable
        columns={columns}
        rows={data?.data?.users || []}
        isLoading={isFetching}
        error={error ? error?.data?.message || t('errorLoadingUsers') : null}
        emptyState={<EmptyState icon={PeopleAltOutlined} title={t('noUsersFound')} />}
        renderActions={(user) => (
          <>
            <Tooltip title={t('viewPosts')}>
              <IconButton size="small" onClick={() => setPostsFor(user)} aria-label={t('viewPosts')}>
                <ArticleOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('moreActions')}>
              <IconButton
                size="small"
                onClick={(event) => setMenu({ anchor: event.currentTarget, row: user })}
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
          count: data?.data?.pagination?.totalUsers || 0,
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
            minWidth: 210,
          }),
        }}
      >
        <MenuItem
          onClick={() => {
            setResetFor(row);
            setMenu({ anchor: null, row: null });
          }}
          sx={{ fontSize: '0.86rem', gap: 1.25 }}
        >
          <LockResetOutlined fontSize="small" />
          {t('resetPassword')}
        </MenuItem>

        {/* Every action below is refused by the server for an admin account, so
            the menu says so rather than offering a button that 403s. */}
        <MenuItem
          disabled={isAdminRow}
          onClick={() =>
            applyChange(
              row,
              { isActive: !row.isActive },
              row?.isActive ? 'accountSuspendedToast' : 'accountActivatedToast'
            )
          }
          sx={(theme) => ({
            fontSize: '0.86rem',
            gap: 1.25,
            color: row?.isActive ? theme.custom.status.pending.main : theme.custom.status.found.main,
          })}
        >
          {row?.isActive ? <BlockOutlined fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
          {row?.isActive ? t('suspendAccount') : t('activateAccount')}
        </MenuItem>

        <MenuItem
          disabled={isAdminRow}
          onClick={() =>
            applyChange(
              row,
              { role: row?.role === 'moderator' ? 'user' : 'moderator' },
              'roleUpdated'
            )
          }
          sx={{ fontSize: '0.86rem', gap: 1.25 }}
        >
          <ShieldOutlined fontSize="small" />
          {row?.role === 'moderator' ? t('demoteToUser') : t('promoteToModerator')}
        </MenuItem>

        <MenuItem
          disabled={isAdminRow}
          onClick={() => {
            setConfirmDelete(row);
            setMenu({ anchor: null, row: null });
          }}
          sx={(theme) => ({
            fontSize: '0.86rem',
            gap: 1.25,
            color: theme.custom.status.lost.main,
          })}
        >
          <DeleteOutline fontSize="small" />
          {t('deleteUser')}
        </MenuItem>

        {isAdminRow ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {t('adminAccountsProtected')}
            </Typography>
          </Box>
        ) : null}
      </Menu>

      <UserPostsDialog user={postsFor} onClose={() => setPostsFor(null)} />

      <ResetPasswordDialog
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        username={resetFor?.username}
        onConfirm={async (newPassword) => {
          await resetPassword({ userId: resetFor._id, newPassword }).unwrap();
          notify(t('passwordResetSuccessfully'), 'success');
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            await deleteUser(confirmDelete._id).unwrap();
            notify(t('userDeletedSuccessfully'), 'success');
            setConfirmDelete(null);
          } catch (requestError) {
            notify(requestError?.data?.message || t('errorDeletingUser'), 'error');
          }
        }}
        title={t('deleteUserTitle')}
        description={t('deleteUserBody', { name: confirmDelete?.username || '' })}
        confirmLabel={t('deleteUser')}
        requireTyped={confirmDelete?.username}
        isLoading={deleting}
      />
    </>
  );
};

export default UsersPage;
