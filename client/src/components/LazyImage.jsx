import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';

/**
 * LazyImage Component
 * Provides lazy loading functionality with intersection observer
 * Supports both native lazy loading and custom intersection observer
 */
const LazyImage = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  sx = {},
  placeholder = null,
  fallback = null,
  onLoad,
  onError,
  loading = 'lazy',
  threshold = 0.1,
  rootMargin = '50px',
  useNativeLazy = true, // Use native lazy loading when supported
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const theme = useTheme();

  // Check if native lazy loading is supported
  const supportsNativeLazy = useNativeLazy && 'loading' in HTMLImageElement.prototype;

  // Filter valid img props to prevent React error #137
  const getValidImgProps = (props) => {
    const validImgProps = [
      'src', 'alt', 'width', 'height', 'loading', 'onLoad', 'onError',
      'crossOrigin', 'decoding', 'fetchPriority', 'referrerPolicy',
      'sizes', 'srcSet', 'useMap', 'style', 'className'
    ];
    
    // Filter out any props that are not valid for img elements
    return Object.keys(props).reduce((acc, key) => {
      if (validImgProps.includes(key) && props[key] !== undefined) {
        acc[key] = props[key];
      }
      return acc;
    }, {});
  };

  useEffect(() => {
    // If native lazy loading is supported, use it
    if (supportsNativeLazy) {
      setIsInView(true);
      setImageSrc(src);
      return;
    }

    // Otherwise, use intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, supportsNativeLazy, threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  // Show placeholder while loading
  if (!isInView && !supportsNativeLazy) {
    return (
      <Box
        ref={imgRef}
        sx={{
          width,
          height,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.08)',
          borderRadius: 1,
          ...sx
        }}
      >
        {placeholder || (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
          />
        )}
      </Box>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    const validProps = getValidImgProps(props);
    return (
      <Box
        component="img"
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        sx={{
          objectFit: 'cover',
          ...sx
        }}
        {...validProps}
      />
    );
  }

  return (
    <Box
      ref={supportsNativeLazy ? null : imgRef}
      sx={{
        position: 'relative',
        width,
        height,
        ...sx
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}

      {/* Actual image */}
      {imageSrc && (
        <Box
          component="img"
          src={imageSrc}
          alt={alt}
          loading={supportsNativeLazy ? loading : undefined}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            position: 'relative',
            zIndex: 2
          }}
          {...getValidImgProps(props)}
        />
      )}
    </Box>
  );
};

export default LazyImage;
