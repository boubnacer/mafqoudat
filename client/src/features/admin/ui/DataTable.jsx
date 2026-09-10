import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  IconButton,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import AdminCard from './AdminCard';
import { useTranslation } from '../../../utils/translations';

/**
 * One list component for the whole panel, in two shapes.
 *
 * From `md` up it is a real table. Below `md` the same columns are re-laid as a
 * stack of cards, because the old panel put seven-column tables on a phone and
 * left the reader scrolling sideways through a listing's description to reach
 * the delete button. A card takes its heading from the column marked `primary`,
 * its subtitle from `secondary`, and renders everything else as label/value
 * rows - so a column is described once and both shapes follow.
 *
 * Columns can opt out of the narrow table with `hideBelow`, which only affects
 * the table: the card shape shows every column, since it has the room.
 *
 * A column's `align` is `'start'` or `'end'`, not `'left'`/`'right'`: MUI's
 * `align` prop writes a physical `text-align`, so a numeric column pinned to
 * the right ends up on the wrong side of an Arabic table.
 */

const Pager = ({ page, rowsPerPage, count, onPageChange, onRowsPerPageChange }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isRtl = theme.direction === 'rtl';
  const compact = useMediaQuery(theme.breakpoints.down('sm'));

  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  // The chevrons point at the page, not at the screen: in Arabic "previous" is
  // to the right. Everything else in the row is laid out by flex, which already
  // follows the document direction.
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <Box
      sx={(t2) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        px: { xs: 1, sm: 1.5 },
        py: 1,
        borderTop: `1px solid ${alpha(t2.custom.color.ink, 0.08)}`,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {!compact && onRowsPerPageChange ? (
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            sx={(t2) => ({
              minWidth: 76,
              fontSize: '0.8rem',
              borderRadius: `${t2.custom.radius.sm}px`,
            })}
            inputProps={{ 'aria-label': t('rowsPerPage') }}
          >
            {[10, 25, 50].map((option) => (
              <MenuItem key={option} value={option} sx={{ fontSize: '0.8rem' }}>
                {t('perPageCount', { count: option })}
              </MenuItem>
            ))}
          </Select>
        ) : null}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {t('paginationRange', { from, to, total: count })}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('previousPage')}
        >
          <PrevIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, px: 0.5 }}>
          {t('pageOf', { page: page + 1, total: totalPages })}
        </Typography>
        <IconButton
          size="small"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('nextPage')}
        >
          <NextIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

const DataTable = ({
  columns = [],
  rows = [],
  getRowKey = (row, index) => row?._id || row?.id || index,
  isLoading = false,
  error = null,
  emptyState = null,
  renderActions,
  onRowClick,
  pagination,
  dense = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isCards = useMediaQuery(theme.breakpoints.down('md'));
  const isNarrowTable = useMediaQuery(theme.breakpoints.down('lg'));

  const tableColumns = columns.filter((column) => {
    if (!column.hideBelow) return true;
    if (column.hideBelow === 'lg') return !isNarrowTable;
    return true;
  });

  const skeletonRows = Array.from({ length: Math.min(pagination?.rowsPerPage || 5, 5) });

  if (error) {
    return (
      <AdminCard padding={false}>
        <Box sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={(t2) => ({ color: t2.custom.status.lost.main, fontWeight: 600 })}
          >
            {error}
          </Typography>
        </Box>
      </AdminCard>
    );
  }

  if (!isLoading && rows.length === 0) {
    return <AdminCard padding={false}>{emptyState}</AdminCard>;
  }

  /* --------------------------------------------------------------- cards */
  if (isCards) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {isLoading
          ? skeletonRows.map((_, index) => (
              <AdminCard key={`skeleton-${index}`}>
                <Skeleton variant="text" width="60%" height={22} />
                <Skeleton variant="text" width="40%" height={16} />
                <Skeleton variant="rounded" height={54} sx={{ mt: 1 }} />
              </AdminCard>
            ))
          : rows.map((row, index) => {
              const primary = columns.find((column) => column.primary);
              const secondary = columns.find((column) => column.secondary);
              const rest = columns.filter(
                (column) => !column.primary && !column.secondary && !column.cardHidden
              );
              return (
                <AdminCard
                  key={getRowKey(row, index)}
                  interactive={Boolean(onRowClick)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {primary ? (
                    <Box sx={{ minWidth: 0 }}>{primary.render(row, { variant: 'card' })}</Box>
                  ) : null}
                  {secondary ? (
                    <Box sx={{ minWidth: 0, mt: 0.5 }}>
                      {secondary.render(row, { variant: 'card' })}
                    </Box>
                  ) : null}

                  {rest.length ? (
                    <Box
                      sx={(t2) => ({
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: `1px solid ${alpha(t2.custom.color.ink, 0.08)}`,
                        display: 'grid',
                        gridTemplateColumns: 'minmax(84px, auto) 1fr',
                        columnGap: 1.5,
                        rowGap: 0.75,
                        alignItems: 'center',
                      })}
                    >
                      {rest.map((column) => (
                        <React.Fragment key={column.id}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontWeight: 600 }}
                          >
                            {column.label}
                          </Typography>
                          <Box sx={{ minWidth: 0, justifySelf: 'start' }}>
                            {column.render(row, { variant: 'card' })}
                          </Box>
                        </React.Fragment>
                      ))}
                    </Box>
                  ) : null}

                  {renderActions ? (
                    <Box
                      sx={(t2) => ({
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: `1px solid ${alpha(t2.custom.color.ink, 0.08)}`,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                      })}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderActions(row, { variant: 'card' })}
                    </Box>
                  ) : null}
                </AdminCard>
              );
            })}

        {pagination ? (
          <AdminCard padding={false}>
            <Pager {...pagination} />
          </AdminCard>
        ) : null}
      </Box>
    );
  }

  /* --------------------------------------------------------------- table */
  return (
    <AdminCard padding={false}>
      <TableContainer sx={{ borderRadius: 'inherit' }}>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {tableColumns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={(t2) => ({
                    borderBottom: `1px solid ${alpha(t2.custom.color.ink, 0.08)}`,
                    color: t2.palette.text.secondary,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    py: 1.25,
                    textAlign: column.align === 'end' ? 'end' : 'start',
                  })}
                >
                  {column.label}
                </TableCell>
              ))}
              {renderActions ? (
                <TableCell
                  sx={(t2) => ({
                    borderBottom: `1px solid ${alpha(t2.custom.color.ink, 0.08)}`,
                    color: t2.palette.text.secondary,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textAlign: 'end',
                  })}
                >
                  {t('actions')}
                </TableCell>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? skeletonRows.map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {tableColumns.map((column) => (
                      <TableCell key={column.id} sx={{ borderBottom: 'none' }}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                    {renderActions ? (
                      <TableCell sx={{ borderBottom: 'none' }}>
                        <Skeleton variant="text" width={70} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              : rows.map((row, index) => (
                  <TableRow
                    key={getRowKey(row, index)}
                    hover={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={(t2) => ({
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': onRowClick
                        ? { backgroundColor: alpha(t2.custom.color.brandPrimary, 0.04) }
                        : undefined,
                      '& td': {
                        borderBottom: `1px solid ${alpha(t2.custom.color.ink, 0.06)}`,
                      },
                      '&:last-of-type td': { borderBottom: 'none' },
                    })}
                  >
                    {tableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{
                          maxWidth: column.maxWidth || 'none',
                          py: dense ? 1 : 1.5,
                          textAlign: column.align === 'end' ? 'end' : 'start',
                        }}
                      >
                        {column.render(row, { variant: 'table' })}
                      </TableCell>
                    ))}
                    {renderActions ? (
                      <TableCell
                        onClick={(event) => event.stopPropagation()}
                        sx={{ textAlign: 'end' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >
                          {renderActions(row, { variant: 'table' })}
                        </Box>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination ? <Pager {...pagination} /> : null}
    </AdminCard>
  );
};

export default DataTable;
