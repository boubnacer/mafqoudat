import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  useTheme,
  alpha,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  Save,
  Edit,
  ArrowBack,
  Public,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../utils/translations';
import useAuth from '../../../hooks/useAuth';
import { useGetUserByIdQuery, useUpdateUserMutation } from '../usersApiSlice';
import { useGetCountriesQuery } from '../../dependencies/dependenciesApiSlice';

const UserProfile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const { usernameId, username } = useAuth();

  // Fetch user data
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: errorUser,
    refetch
  } = useGetUserByIdQuery(usernameId, {
    skip: !usernameId
  });

  // Fetch countries for the selector
  const { countries } = useGetCountriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids?.map((id) => data?.entities[id]),
    }),
  });

  const [updateUser, { isLoading: isUpdating, isSuccess, isError, error }] = useUpdateUserMutation();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    country: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country?._id || user.country || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      refetch();
    }
  }, [isSuccess, refetch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username || formData.username.trim().length < 3) {
      errors.username = t('usernameTooShort') || 'Username must be at least 3 characters';
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = t('passwordTooShort') || 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('passwordsDoNotMatch') || 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updateData = {
      id: usernameId,
      username: formData.username,
      country: formData.country,
      email: formData.email,
      phone: formData.phone,
    };

    // Only include password if it was entered
    if (formData.password) {
      updateData.password = formData.password;
    }

    try {
      await updateUser(updateData).unwrap();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    // Reset form to original user data
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country?._id || user.country || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  // Get country name for display
  const getCountryName = (countryId) => {
    if (!countryId) return t('unknownCountry');
    
    const country = countries.find(c => c._id === countryId || c.id === countryId);
    if (!country) return t('unknownCountry');
    
    return country.names?.[currentLanguage] || country.names?.en || country.code || t('unknownCountry');
  };

  if (isLoadingUser) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (isErrorUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          {errorUser?.data?.message || t('errorLoadingUser') || 'Error loading user data'}
        </Alert>
      </Container>
    );
  }

  const isRTL = currentLanguage === 'ar';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={() => navigate('/dash')}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #4A9FFF 30%, #1E88E5 90%)'
              : 'linear-gradient(45deg, #1E88E5 30%, #1565C0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: isRTL ? 'right' : 'left',
            flex: 1,
          }}
        >
          {t('myProfile')}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('profileUpdated')}
        </Alert>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.data?.message || t('profileUpdateFailed')}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '3rem',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                {username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {user?.email || user?.phone || t('noContactInfo')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Public sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">
                  {getCountryName(user?.country?._id || user?.country)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information Card */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              height: '100%',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('accountInformation')}
                </Typography>
                {!isEditing && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      }
                    }}
                  >
                    {t('editProfile')}
                  </Button>
                )}
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Username */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('username')}
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      error={Boolean(validationErrors.username)}
                      helperText={validationErrors.username}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('email')}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      type="email"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  {/* Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('phone')}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  {/* Country Selector */}
                  <Grid item xs={12}>
                    {isEditing ? (
                      <Autocomplete
                        options={countries || []}
                        getOptionLabel={(option) => 
                          option.names?.[currentLanguage] || option.names?.en || option.code || ''
                        }
                        value={countries?.find(c => c._id === formData.country || c.id === formData.country) || null}
                        onChange={(event, newValue) => {
                          setFormData(prev => ({ ...prev, country: newValue?._id || newValue?.id || '' }));
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('country')}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <Public />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box
                            component="li"
                            {...props}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              py: 1
                            }}
                          >
                            <img
                              loading="lazy"
                              width="20"
                              src={`https://flagcdn.com/w20/${option.code?.toLowerCase()}.png`}
                              srcSet={`https://flagcdn.com/w40/${option.code?.toLowerCase()}.png 2x`}
                              alt=""
                            />
                            <Typography>
                              {option.names?.[currentLanguage] || option.names?.en || option.code}
                            </Typography>
                          </Box>
                        )}
                        disabled={!isEditing}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label={t('country')}
                        value={getCountryName(formData.country)}
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Public />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                  </Grid>

                  {isEditing && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('changePassword')} ({t('optional') || 'Optional'})
                          </Typography>
                        </Divider>
                      </Grid>

                      {/* New Password */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('newPassword')}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          error={Boolean(validationErrors.password)}
                          helperText={validationErrors.password}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Grid>

                      {/* Confirm Password */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('confirmNewPassword')}
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          error={Boolean(validationErrors.confirmPassword)}
                          helperText={validationErrors.confirmPassword}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Grid>
                    </>
                  )}

                  {isEditing && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={handleCancel}
                          disabled={isUpdating}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 120,
                          }}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={isUpdating ? <CircularProgress size={20} /> : <Save />}
                          disabled={isUpdating}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 120,
                            background: 'linear-gradient(45deg, #4A9FFF 30%, #1E88E5 90%)',
                            boxShadow: '0 3px 5px 2px rgba(30, 136, 229, .3)',
                          }}
                        >
                          {isUpdating ? t('savingChanges') : t('saveChanges')}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile;

