import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useGetCountriesQuery } from "../dependencies/dependenciesApiSlice";
import useTitle from "../../hooks/useTitle";
import { LoadingState } from "../../components/LoadingStates";
import { useTranslation } from "../../utils/translations";
import axios from "axios";

import { CardContent, Alert, Box, InputLabel, Select, MenuItem, InputAdornment, useTheme } from "@mui/material";
import { LocationOn } from "@mui/icons-material";

import {
  AuthPageContainer,
  AuthCardSlot,
  AuthCard,
  AuthTopControls,
  AuthHeader,
  AuthSelectField,
  AuthPrimaryButton,
} from "./authShared";

const CountrySelection = () => {
  useTitle("Select Your Country | Mafqoudat");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  // Get pending token from URL
  const pendingToken = searchParams.get('pendingToken');

  // State
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch countries
  const {
    data: countriesData,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useGetCountriesQuery({
    language: currentLanguage || 'en',
    active: true
  });

  const countries = countriesData?.ids?.map(id => countriesData.entities[id]) || [];

  // Redirect if no pending token
  useEffect(() => {
    if (!pendingToken) {
      navigate('/login');
    }
  }, [pendingToken, navigate]);

  // Helper function to get country label based on current language
  const getCountryLabel = (option) => {
    if (!option) return '';
    if (option.names && option.names[currentLanguage || 'en']) {
      return option.names[currentLanguage || 'en'];
    }
    if (option.labels && option.labels[currentLanguage || 'en']) {
      return option.labels[currentLanguage || 'en'];
    }
    return option.label || option.code;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCountry) {
      setError(t('pleaseSelectCountry'));
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const response = await axios.post(`${apiUrl}/auth/complete`, {
        pendingToken,
        countryId: selectedCountry
      });

      if (response.data?.accessToken) {
        dispatch(setCredentials({
          accessToken: response.data.accessToken
        }));

        navigate('/dash');
      } else {
        setError(t('registrationCompletionFailed'));
      }
    } catch (err) {
      console.error('Country selection error:', err);

      let errorMessage = t('registrationCompletionFailed');

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = t('invalidOrExpiredToken');
      } else if (!err.response) {
        errorMessage = t('networkErrorMessage');
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching countries
  if (countriesLoading) {
    return <LoadingState message={t('loadingCountries')} />;
  }

  // Show error if countries failed to load
  if (countriesError) {
    return (
      <AuthPageContainer>
        <AuthTopControls />
        <AuthCardSlot>
          <AuthCard>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Alert severity="error" sx={{ borderRadius: `${theme.custom.radius.md}px` }}>
                {t('errorLoadingCountries')}
              </Alert>
            </CardContent>
          </AuthCard>
        </AuthCardSlot>
      </AuthPageContainer>
    );
  }

  return (
    <AuthPageContainer key={currentLanguage}>
      <AuthTopControls />

      <AuthCardSlot>
        <AuthCard>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <AuthHeader
              eyebrow={t('countrySelectionStepCaption')}
              title={t('selectYourCountry')}
              subtitle={t('selectCountryDescription')}
            />

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: `${theme.custom.radius.md}px` }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              <AuthSelectField fullWidth sx={{ mb: 3 }}>
                <InputLabel>{t('country')}</InputLabel>
                <Select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  label={t('country')}
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: theme.custom.color.brandPrimary }} />
                    </InputAdornment>
                  }
                >
                  {countries?.map((country) => (
                    <MenuItem key={country._id} value={country._id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {country.flag ? (
                          <span style={{ fontSize: '20px' }}>
                            {country.flag}
                          </span>
                        ) : (
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                            alt=""
                            style={{ marginRight: 8 }}
                          />
                        )}
                        {getCountryLabel(country)} ({country.code})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </AuthSelectField>

              <AuthPrimaryButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting || !selectedCountry}
              >
                {isSubmitting ? t('completing') : t('continue')}
              </AuthPrimaryButton>
            </Box>
          </CardContent>
        </AuthCard>
      </AuthCardSlot>
    </AuthPageContainer>
  );
};

export default CountrySelection;
