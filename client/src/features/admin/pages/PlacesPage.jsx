import React, { useMemo, useState } from 'react';
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import {
  PublicOutlined,
  EditOutlined,
  DeleteOutline,
  SaveOutlined,
  CloseOutlined,
  StarOutlineOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import {
  useGetCitiesByCountryAdminQuery,
  useUpdateCityAdminMutation,
  useDeleteCityAdminMutation,
} from '../adminApiSlice';
import { useGetCountriesQuery } from '../../dependencies/dependenciesApiSlice';
import {
  AdminCard,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  StatusPill,
  actionButtonSx,
  containedButtonSx,
  inputSx,
  useAdminToast,
} from '../ui';
import { labelOf } from '../adminFormat';

/**
 * The city list behind every country the site covers.
 *
 * The one place in the panel where an admin is editing reference data rather
 * than judging user content, so it is the one place with an inline edit: a city
 * is three short strings (en/fr/ar) and opening a dialog to change one of them
 * is more ceremony than the task deserves.
 *
 * A city with no country selected fetches nothing. That is the point of the
 * empty state here - the old tab issued no request either, but rendered an
 * empty table that read as "this country has no cities".
 */
const PlacesPage = () => {
  const { t, currentLanguage } = useTranslation();
  const notify = useAdminToast();

  const [countryId, setCountryId] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [labels, setLabels] = useState({ en: '', fr: '', ar: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: countriesData } = useGetCountriesQuery({ language: currentLanguage || 'en' });
  const countries = countriesData?.ids?.map((id) => countriesData.entities[id]) || [];

  const { data, isFetching, error } = useGetCitiesByCountryAdminQuery(
    { countryId, language: currentLanguage || 'en' },
    { skip: !countryId }
  );

  const [updateCity, { isLoading: saving }] = useUpdateCityAdminMutation();
  const [deleteCity, { isLoading: deleting }] = useDeleteCityAdminMutation();

  const cities = useMemo(() => {
    const all = data?.data || [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((city) =>
      [city.labels?.en, city.labels?.fr, city.labels?.ar, city.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [data, search]);

  const startEdit = (city) => {
    setEditing(city._id);
    setLabels({
      en: city.labels?.en || '',
      fr: city.labels?.fr || '',
      ar: city.labels?.ar || '',
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setLabels({ en: '', fr: '', ar: '' });
  };

  const save = async (city) => {
    try {
      await updateCity({ cityId: city._id, labels }).unwrap();
      notify(t('cityUpdatedSuccessfully'), 'success');
      cancelEdit();
    } catch (requestError) {
      notify(requestError?.data?.message || t('errorUpdatingCity'), 'error');
    }
  };

  const nameField = (lang) => (
    <TextField
      key={lang}
      size="small"
      value={labels[lang]}
      onChange={(event) => setLabels((current) => ({ ...current, [lang]: event.target.value }))}
      label={t(`language_${lang}`)}
      // Arabic is typed right-to-left whatever the panel's own direction is,
      // and Latin names stay left-to-right in an Arabic panel - so each field
      // is pinned to its own script's direction rather than the document's.
      inputProps={{ dir: lang === 'ar' ? 'rtl' : 'ltr' }}
      sx={(theme) => ({ ...inputSx(theme), flex: '1 1 130px', minWidth: 110 })}
    />
  );

  const columns = useMemo(
    () => [
      {
        id: 'city',
        label: t('city'),
        primary: true,
        render: (city) =>
          editing === city._id ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 0.5 }}>
              {['en', 'fr', 'ar'].map(nameField)}
            </Box>
          ) : (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={(theme) => ({ fontWeight: 700, color: theme.custom.color.ink })}
              >
                {labelOf(city, currentLanguage, city.code)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {[city.labels?.en, city.labels?.fr, city.labels?.ar]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
          ),
      },
      {
        id: 'code',
        label: t('code'),
        hideBelow: 'lg',
        render: (city) => (
          <Typography variant="caption" sx={{ color: 'text.secondary', direction: 'ltr' }}>
            {city.code}
          </Typography>
        ),
      },
      {
        id: 'flags',
        label: t('status'),
        render: (city) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {city.isCapital ? (
              <StatusPill
                size="sm"
                tone="brand"
                label={t('capitalCity')}
                icon={StarOutlineOutlined}
              />
            ) : null}
            {city.isActive === false ? (
              <StatusPill
                size="sm"
                tone="neutral"
                label={t('hidden')}
                icon={VisibilityOffOutlined}
              />
            ) : (
              <StatusPill size="sm" tone="positive" label={t('visible')} />
            )}
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentLanguage, editing, labels]
  );

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupCatalog')}
        title={t('adminNavPlaces')}
        description={t('adminNavPlacesDescription')}
      />

      <FilterBar
        search={
          countryId
            ? {
                value: search,
                onChange: setSearch,
                placeholder: t('searchCity'),
              }
            : undefined
        }
        selects={[
          {
            id: 'country',
            label: t('selectCountry'),
            value: countryId,
            width: 220,
            onChange: (value) => {
              setCountryId(value);
              setSearch('');
              cancelEdit();
            },
            options: [
              { value: '', label: t('selectCountry') },
              ...countries.map((country) => ({
                value: country._id,
                label: labelOf(country, currentLanguage, country.code),
              })),
            ],
          },
        ]}
        onClear={countryId ? () => setSearch('') : undefined}
        hasActiveFilters={Boolean(search)}
      />

      {!countryId ? (
        <AdminCard padding={false}>
          <EmptyState
            icon={PublicOutlined}
            title={t('pickACountry')}
            description={t('pickACountryBody')}
          />
        </AdminCard>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={cities}
            isLoading={isFetching}
            error={error ? error?.data?.message || t('genericLoadError') : null}
            emptyState={<EmptyState icon={PublicOutlined} title={t('noCitiesFound')} />}
            renderActions={(city) =>
              editing === city._id ? (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    startIcon={<SaveOutlined />}
                    disabled={saving || !labels.en.trim()}
                    onClick={() => save(city)}
                    sx={containedButtonSx('brand')}
                  >
                    {t('save')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CloseOutlined />}
                    onClick={cancelEdit}
                    sx={actionButtonSx('neutral')}
                  >
                    {t('cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Tooltip title={t('edit')}>
                    <IconButton size="small" onClick={() => startEdit(city)} aria-label={t('edit')}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('delete')}>
                    <IconButton
                      size="small"
                      onClick={() => setConfirmDelete(city)}
                      aria-label={t('delete')}
                      sx={(theme) => ({ color: theme.custom.status.lost.main })}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )
            }
          />
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5 }}>
            {t('citiesCount', { count: cities.length })}
          </Typography>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            await deleteCity(confirmDelete._id).unwrap();
            notify(t('cityDeletedSuccessfully'), 'success');
            setConfirmDelete(null);
          } catch (requestError) {
            notify(requestError?.data?.message || t('errorDeletingCity'), 'error');
          }
        }}
        title={t('deleteCityTitle')}
        description={t('deleteCityBody')}
        confirmLabel={t('delete')}
        requireTyped={confirmDelete ? labelOf(confirmDelete, 'en', confirmDelete.code) : undefined}
        isLoading={deleting}
      />
    </>
  );
};

export default PlacesPage;
