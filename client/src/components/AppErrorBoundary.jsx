import React, { Component } from 'react';

/**
 * Top-level Application Error Boundary
 * 
 * Catches unhandled JavaScript render errors anywhere in the component tree,
 * logs them, and displays a friendly recovery UI instead of a blank white screen.
 * 
 * Note: Sits above ThemeProvider and LanguageProvider in index.js, so this component
 * uses self-contained styling and bilingual (Arabic / English) text to guarantee
 * it will render reliably even if context providers fail.
 */
class AppErrorBoundary extends Component {
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
    const errorId = `app-err-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Log for developers / error monitoring
    console.error('AppErrorBoundary caught an unhandled render error:', error, errorInfo);

    this.setState({
      errorInfo,
      errorId
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearCacheAndReload = () => {
    try {
      // Clear potentially corrupted application state in storage
      sessionStorage.clear();
      // Keep persistent language/theme preference if possible, clear transient data
      const lang = localStorage.getItem('language');
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (lang) localStorage.setItem('language', lang);
      if (theme) localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError) {
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorId={errorId}
            onReload={this.handleReload}
            onGoHome={this.handleGoHome}
          />
        );
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif',
            textAlign: 'center',
            lineHeight: 1.6
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '36px 28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155'
            }}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px auto',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Bilingual Titles */}
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                margin: '0 0 8px 0',
                color: '#ffffff'
              }}
            >
              عذراً، حدث خطأ غير متوقع
            </h1>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 500,
                margin: '0 0 16px 0',
                color: '#94a3b8'
              }}
            >
              Something went wrong
            </h2>

            {/* Bilingual Explanations */}
            <p
              style={{
                fontSize: '14px',
                color: '#cbd5e1',
                margin: '0 0 24px 0'
              }}
            >
              واجه التطبيق مشكلة غير متوقعة أثناء عرض هذه الصفحة. يمكنك محاولة إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>إعادة تحميل الصفحة / Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>الصفحة الرئيسية / Home</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                مسح الذاكرة المؤقتة وإعادة المحاولة / Clear Cache & Try Again
              </button>
            </div>

            {/* Error ID for Support */}
            {errorId && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #334155'
                }}
              >
                رمز الخطأ للمتابعة / Reference: <code>{errorId}</code>
              </div>
            )}

            {/* Developer Details in Development */}
            {isDev && error && (
              <details
                style={{
                  marginTop: '20px',
                  textAlign: 'left',
                  backgroundColor: '#090d16',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #ef4444'
                }}
              >
                <summary
                  style={{
                    color: '#f87171',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  Error Details (Visible only in Development)
                </summary>
                <pre
                  style={{
                    color: '#fca5a5',
                    fontSize: '11px',
                    overflowX: 'auto',
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {error.toString()}
                  {'\n\n'}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default AppErrorBoundary;
