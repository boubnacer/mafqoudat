import React, { useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  CampaignOutlined,
  CheckCircleOutline,
  UndoOutlined,
  OpenInNewOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetPromotionsQuery, useUpdatePromotionStatusMutation } from '../adminApiSlice';
import {
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  StatusPill,
  actionButtonSx,
  containedButtonSx,
  useAdminToast,
} from '../ui';
import { formatDate, formatRelative, labelOf, postTitle } from '../adminFormat';

/**
 * Listings whose owner asked to have them promoted.
 *
 * A queue with exactly one decision in it, so it is a table with one button
 * rather than a table plus a dialog: an admin reads the request, calls the
 * number on it, and marks it done. The old version made you open a detail
 * dialog to reach that one button, and the row it was reading from showed "No
 * title" for every listing.
 *
 * The phone number is a `tel:` link. It is the only reason this queue exists.
 */
const PromotionsPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [status, setStatus] = useState('requested');

  const { data, isFetching, error } = useGetPromotionsQuery({
    page: page + 1,
    limit: rowsPerPage,
    status: status || undefined,
  });

  const [updatePromotion] = useUpdatePromotionStatusMutation();

  const setProcessed = async (promotion, processed) => {
    try {
      await updatePromotion({ postId: promotion._id, processed }).unwrap();
      notify(processed ? t('promotionProcessed') : t('promotionReopened'), 'success');
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
        maxWidth: 320,
        render: (promotion) => (
          <Box sx={{ minWidth: 0 }}>
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
              {postTitle(promotion, t('noDescription'))}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {[
                promotion.user?.username,
                labelOf(promotion.city, currentLanguage, ''),
                labelOf(promotion.category, currentLanguage, ''),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'phone',
        label: t('promotionPhone'),
        render: (promotion) =>
          promotion.promotionPhoneNumber ? (
            <Box
              component="a"
              href={`tel:${promotion.promotionPhoneNumber}`}
              sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: theme.custom.color.brandPrimary,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                direction: 'ltr',
              })}
            >
              <PhoneOutlined sx={{ fontSize: 15 }} />
              {promotion.promotionPhoneNumber}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {promotion.contact || t('noContact')}
            </Typography>
          ),
      },
      {
        id: 'status',
        label: t('status'),
        render: (promotion) => (
          <StatusPill
            state={promotion.promotionProcessed ? 'processed' : 'requested'}
            label={promotion.promotionProcessed ? t('processed') : t('requested')}
          />
        ),
      },
      {
        id: 'requestedAt',
        label: t('requestedAt'),
        render: (promotion) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatRelative(promotion.promotionRequestedAt, currentLanguage, t)}
          </Typography>
        ),
      },
      {
        id: 'processedAt',
        label: t('processedAt'),
        hideBelow: 'lg',
        render: (promotion) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {promotion.promotionProcessedAt
              ? formatDate(promotion.promotionProcessedAt, currentLanguage)
              : '—'}
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
        title={t('adminNavPromotions')}
        description={t('adminNavPromotionsDescription')}
      />

      <FilterBar
        selects={[
          {
            id: 'status',
            label: t('filterByStatus'),
            value: status,
            onChange: (value) => {
              setStatus(value);
              setPage(0);
            },
            options: [
              { value: '', label: t('allStatuses') },
              { value: 'requested', label: t('requested') },
              { value: 'processed', label: t('processed') },
            ],
          },
        ]}
        onClear={() => {
          setStatus('');
          setPage(0);
        }}
        hasActiveFilters={Boolean(status)}
      />

      <DataTable
        columns={columns}
        rows={data?.data?.promotions || []}
        isLoading={isFetching}
        error={error ? error?.data?.message || t('errorLoadingPromotions') : null}
        emptyState={
          <EmptyState
            tone={status === 'requested' ? 'positive' : 'neutral'}
            icon={status === 'requested' ? CheckCircleOutline : CampaignOutlined}
            title={status === 'requested' ? t('noPendingPromotions') : t('noPromotionsFound')}
          />
        }
        renderActions={(promotion) => (
          <>
            <Button
              component="a"
              href={`/dash/posts/${promotion._id}`}
              target="_blank"
              rel="noreferrer"
              size="small"
              startIcon={<OpenInNewOutlined />}
              sx={actionButtonSx('brand')}
            >
              {t('viewPost')}
            </Button>
            {promotion.promotionProcessed ? (
              <Button
                size="small"
                startIcon={<UndoOutlined />}
                onClick={() => setProcessed(promotion, false)}
                sx={actionButtonSx('neutral')}
              >
                {t('reopen')}
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<CheckCircleOutline />}
                onClick={() => setProcessed(promotion, true)}
                sx={containedButtonSx('positive')}
              >
                {t('markAsProcessed')}
              </Button>
            )}
          </>
        )}
        pagination={{
          page,
          rowsPerPage,
          count: data?.data?.pagination?.totalPromotions || 0,
          onPageChange: setPage,
          onRowsPerPageChange: (value) => {
            setRowsPerPage(value);
            setPage(0);
          },
        }}
      />
    </>
  );
};

export default PromotionsPage;
