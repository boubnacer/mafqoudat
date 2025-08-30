import React, { useState, useRef, useEffect } from 'react';
import { CardMedia, Skeleton, useTheme } from '@mui/material';

/**
 * LazyCardMedia Component
 * Extends Material-UI CardMedia with lazy loading functionality
 * Supports both native lazy loading and intersection observer
 */
const LazyCardMedia = ({
  image,
  alt,
  component = 'img',
  sx = {},
  placeholder = null,
  fallback = null,
  onLoad,
  onError,
  loading = 'lazy',
  threshold = 0.1,
  rootMargin = '50px',
  useNativeLazy = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const mediaRef = useRef(null);
  const observerRef = useRef(null);
  const theme = useTheme();

  // Check if native lazy loading is supported
  const supportsNativeLazy = useNativeLazy && 'loading' in HTMLImageElement.prototype;

  // Filter valid CardMedia props to prevent React error #137
  const getValidCardMediaProps = (props) => {
    const validCardMediaProps = [
      'image', 'alt', 'component', 'sx', 'onLoad', 'onError',
      'loading', 'crossOrigin', 'decoding', 'fetchPriority', 
      'referrerPolicy', 'sizes', 'srcSet', 'useMap', 'style', 'className'
    ];
    
    return Object.keys(props).reduce((acc, key) => {
      if (validCardMediaProps.includes(key) && props[key] !== undefined) {
        acc[key] = props[key];
      }
      return acc;
    }, {});
  };

  // Filter valid img props for when component="img"
  const getValidImgProps = (props) => {
    const validImgProps = [
      'src', 'alt', 'width', 'height', 'loading', 'onLoad', 'onError',
      'crossOrigin', 'decoding', 'fetchPriority', 'referrerPolicy',
      'sizes', 'srcSet', 'useMap', 'style', 'className'
    ];
    
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
      setImageSrc(image);
      return;
    }

    // Otherwise, use intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(image);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (mediaRef.current) {
      observer.observe(mediaRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [image, supportsNativeLazy, threshold, rootMargin]);

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
      <CardMedia
        ref={mediaRef}
        component="div"
        sx={{
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      </CardMedia>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    const validProps = component === 'img' ? getValidImgProps(props) : getValidCardMediaProps(props);
    return (
      <CardMedia
        component={component}
        image={fallback}
        alt={alt}
        sx={{
          ...sx
        }}
        {...validProps}
      />
    );
  }

  // Main CardMedia with filtered props
  const validProps = component === 'img' ? getValidImgProps(props) : getValidCardMediaProps(props);
  
  // If component is img, use a regular img element to avoid Material-UI prop issues
  if (component === 'img') {
    return (
      <CardMedia
        ref={supportsNativeLazy ? null : mediaRef}
        component="div"
        sx={{
          position: 'relative',
          ...sx
        }}
      >
        {/* Loading skeleton overlay */}
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
          <img
            src={imageSrc}
            alt={alt}
            loading={supportsNativeLazy ? loading : undefined}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              position: 'relative',
              zIndex: 2
            }}
            {...validProps}
          />
        )}
      </CardMedia>
    );
  }

  // For other components, use CardMedia as usual
  return (
    <CardMedia
      ref={supportsNativeLazy ? null : mediaRef}
      component={component}
      image={imageSrc}
      alt={alt}
      loading={supportsNativeLazy ? loading : undefined}
      onLoad={handleLoad}
      onError={handleError}
      sx={{
        position: 'relative',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        ...sx
      }}
      {...validProps}
    >
      {/* Loading skeleton overlay */}
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
    </CardMedia>
  );
};

export default LazyCardMedia;
