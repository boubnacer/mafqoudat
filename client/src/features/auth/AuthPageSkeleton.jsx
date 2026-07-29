import React from 'react';
import { CardContent, useTheme } from '@mui/material';
import SkeletonBlock from '../../components/SkeletonBlock';
import { AuthPageContainer, AuthCardSlot, AuthCard } from './authShared';

// Shared shell (AuthPageContainer/AuthCardSlot/AuthCard) reused directly from
// authShared.jsx so this lines up pixel-for-pixel with Login/CountrySelection/
// NewUserForm's real card — shown while a page-level dependency (e.g. the
// countries list) is still loading, before the actual form can mount.
const AuthPageSkeleton = ({ fields = 2 }) => {
  const theme = useTheme();

  return (
    <AuthPageContainer>
      <AuthCardSlot>
        <AuthCard>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <SkeletonBlock sx={{ height: 28, width: '55%', mx: 'auto', mb: 1.5 }} />
            <SkeletonBlock sx={{ height: 16, width: '75%', mx: 'auto', mb: 4 }} />

            {Array.from({ length: fields }).map((_, i) => (
              <SkeletonBlock key={i} radius={theme.custom.radius.md} sx={{ height: 56, width: '100%', mb: 2 }} />
            ))}

            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 48, width: '100%', mt: 2 }} />
          </CardContent>
        </AuthCard>
      </AuthCardSlot>
    </AuthPageContainer>
  );
};

export default AuthPageSkeleton;
