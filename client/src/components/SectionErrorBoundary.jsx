import React, { Component } from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle } from '@mui/material';
import { Refresh, ArrowBack, Home, ReportProblemOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/translations';

/**
 * Section & Form Error Boundary Component
 * 
 * Provides granular error isolation for heavy route components (e.g. NewPostForm,
 * EditPostForm, Admin panel tabs). When an error occurs inside a wrapped section,
 * only that section displays a fallback error card rather than crashing the
 * entire application layout or taking down the navbar and sidebar.
 */
class SectionErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `sec-err-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    console.error('SectionErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo,
      errorId
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback: Fallback, title, subtitle, backUrl, backLabel } = this.props;

    if (hasError) {
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorId={errorId}
            onRetry={this.handleRetry}
          />
        );
      }

      return (
        <SectionErrorFallback
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
          customTitle={title}
          customSubtitle={subtitle}
          backUrl={backUrl}
          backLabel={backLabel}
        />
      );
    }

    return children;
  }
}

/**
 * Visual Fallback Card for Section/Form Crashes
 */
const SectionErrorFallback = ({
  error,
  errorId,
  onRetry,
  customTitle,
  customSubtitle,
  backUrl = '/dash/posts',
  backLabel
}) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isAr = currentLanguage === 'ar';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 4, sm: 8 },
        px: 2,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 640,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'error.lighter',
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}
        >
          <ReportProblemOutlined sx={{ fontSize: 32 }} />
        </Box>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          {customTitle || (isAr ? 'حدث خطأ غير متوقع في هذه الصفحة' : 'Something went wrong in this section')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {customSubtitle || (isAr
            ? 'واجه النموذج أو القسم مشكلة تقنية. بياناتك الأساسية آمنة ويمكنك إعادة المحاولة أو الرجوع.'
            : 'The form or section encountered a technical issue. Your session is safe; you can try again or return to the previous page.')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={onRetry}
            sx={{ px: 3, py: 1, borderRadius: 2 }}
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(backUrl)}
            sx={{ px: 2.5, py: 1, borderRadius: 2 }}
          >
            {backLabel || (isAr ? 'العودة إلى المنشورات' : 'Back to Posts')}
          </Button>

          <Button
            variant="text"
            startIcon={<Home />}
            onClick={() => navigate('/dash')}
            sx={{ px: 2, py: 1 }}
          >
            {isAr ? 'لوحة التحكم' : 'Dashboard'}
          </Button>
        </Box>

        {errorId && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {isAr ? 'رمز الخطأ: ' : 'Error ID: '} <code>{errorId}</code>
          </Typography>
        )}

        {process.env.NODE_ENV === 'development' && error && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              textAlign: 'left',
              bgcolor: 'grey.900',
              color: 'error.light',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 180
            }}
          >
            {error.toString()}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export const SectionErrorBoundary = SectionErrorBoundaryClass;
export default SectionErrorBoundaryClass;
