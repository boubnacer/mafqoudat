import React, { useState, useRef, useEffect } from 'react';
import { optimizeCloudinaryUrl, getOptimizedImageUrl } from '../../utils/cloudinaryUtils';

/**
 * Cost-Optimized Lazy Loading Image Component
 * Implements intersection observer for lazy loading and format optimization
 * Reduces Cloudinary bandwidth costs by loading images only when needed
 */

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  useCase = 'card',
  width = 800,
  height = 600,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, inView] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  // Load image when it comes into view
  useEffect(() => {
    if (inView && src) {
      // Optimize the URL for the specific use case
      const optimizedSrc = getOptimizedImageUrl(src, useCase);
      setImageSrc(optimizedSrc);
    }
  }, [inView, src, useCase]);

  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (onError) onError();
    // Fallback to original src if optimized version fails
    if (imageSrc !== src) {
      setImageSrc(src);
    }
  };

  return (
    <div 
      ref={imageRef}
      className={`lazy-image-container ${className}`}
      style={{ width, height }}
      {...props}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  );
};

/**
 * Custom hook for intersection observer
 */
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isVisible = entry.isIntersecting;
      setIsIntersecting(isVisible);
      
      if (isVisible && options.triggerOnce && !hasTriggered) {
        setHasTriggered(true);
      }
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '50px'
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.triggerOnce, hasTriggered]);

  return [ref, isIntersecting || (options.triggerOnce && hasTriggered)];
};

/**
 * Progressive Image Component with multiple quality levels
 */
export const ProgressiveImage = ({ 
  src, 
  alt, 
  className = '',
  placeholder = null,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageRef, inView] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && src) {
      // Load low quality first
      const lowQualitySrc = optimizeCloudinaryUrl(src, { 
        width: 400, 
        quality: 'auto:low' 
      });
      setCurrentSrc(lowQualitySrc);
    }
  }, [inView, src]);

  const handleLowQualityLoad = () => {
    // Then load high quality
    const highQualitySrc = optimizeCloudinaryUrl(src, { 
      width: 1200, 
      quality: 'auto:good' 
    });
    
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsLoaded(true);
    };
    img.src = highQualitySrc;
  };

  return (
    <div 
      ref={imageRef}
      className={`progressive-image-container ${className}`}
      {...props}
    >
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={!isLoaded ? handleLowQualityLoad : undefined}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isLoaded ? 'none' : 'blur(5px)',
            transition: 'filter 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  );
};

/**
 * Responsive Image Component with srcset
 */
export const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props 
}) => {
  const [imageRef, inView] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  const generateSrcSet = (baseSrc) => {
    if (!baseSrc || !baseSrc.includes('cloudinary.com')) {
      return baseSrc;
    }

    const sizes = [400, 800, 1200, 1600];
    return sizes.map(size => {
      const optimizedUrl = optimizeCloudinaryUrl(baseSrc, { 
        width: size, 
        quality: 'auto:good' 
      });
      return `${optimizedUrl} ${size}w`;
    }).join(', ');
  };

  const optimizedSrc = inView && src ? optimizeCloudinaryUrl(src, { 
    width: 800, 
    quality: 'auto:good' 
  }) : '';

  return (
    <div ref={imageRef} className={`responsive-image-container ${className}`}>
      {inView && src && (
        <img
          src={optimizedSrc}
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'cover'
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
